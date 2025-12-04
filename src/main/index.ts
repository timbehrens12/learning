import { app, shell, BrowserWindow, globalShortcut, screen, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'

let mainWindow: BrowserWindow | null = null
let overlayWindow: BrowserWindow | null = null

function createMainWindow(): void {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    minWidth: 600,
    minHeight: 500,
    show: false,
    autoHideMenuBar: true,
    resizable: true,
    roundedCorners: true, // Rounded corners (Windows 11+)
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  // Set a modern user agent so Google serves the modern OAuth UI
  // This prevents Google from showing the old 2014-style OAuth page
  mainWindow.webContents.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  )

  // DevTools only open in dev mode (see createOverlayWindow for dev mode DevTools)

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
    mainWindow?.focus()
  })
  
  // Show window immediately in dev mode
  if (is.dev) {
    mainWindow.show()
  }

  mainWindow.webContents.setWindowOpenHandler((details) => {
    // Don't open external windows - handle everything in the app
    // If it's a visnly:// protocol, handle it
    if (details.url.startsWith('visnly://')) {
      handleOAuthCallback(details.url)
      return { action: 'deny' }
    }
    // For OAuth flows, load in the same window (handled by load-oauth-url IPC)
    return { action: 'deny' }
  })
  
  // Handle navigation events to catch OAuth redirects
  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    console.log('🔗 Will navigate to:', navigationUrl)
    
    // Check if the URL's hostname is actually visnly.com (not just in query params)
    let isVisnlyDomain = false
    try {
      const url = new URL(navigationUrl)
      const hostname = url.hostname.toLowerCase()
      isVisnlyDomain = hostname === 'visnly.com' || hostname === 'www.visnly.com'
    } catch (e) {
      // If URL parsing fails, fall back to string check
      isVisnlyDomain = navigationUrl.includes('visnly.com') || navigationUrl.includes('www.visnly.com')
    }
    
    // BLOCK ALL navigation to the website (except during OAuth callback)
    if (isVisnlyDomain) {
      // If it's the callback, extract tokens from hash or code from query
      if (navigationUrl.includes('/auth/callback')) {
        console.log('🔐 INTERCEPTING OAuth callback')
        event.preventDefault()
        
        let callbackUrl: string | null = null
        
        try {
          const url = new URL(navigationUrl)
          
          // Check for code in query (PKCE flow)
          const code = url.searchParams.get('code')
          if (code) {
            console.log('✅ Extracted code (PKCE):', code.substring(0, 20) + '...')
            callbackUrl = `visnly://auth/callback?code=${code}`
          } else {
            // Check for hash fragment (implicit flow - access_token)
            // The hash will be in the full URL, not in the URL object
            const hashMatch = navigationUrl.match(/#(.+)$/)
            if (hashMatch) {
              const hash = hashMatch[1]
              console.log('✅ Extracted hash fragment (implicit flow)')
              // Send full callback URL with hash to renderer
              callbackUrl = `visnly://auth/callback#${hash}`
            } else {
              console.warn('⚠️ No code or hash found in callback URL')
            }
          }
        } catch (e) {
          console.error('❌ Error parsing callback URL:', e)
        }
        
        // Send callback to renderer to set session
        if (callbackUrl) {
          console.log('📤 Sending OAuth callback to renderer:', callbackUrl.substring(0, 80) + '...')
          handleOAuthCallback(callbackUrl)
          
          // Set up a one-time listener for session confirmation
          const sessionConfirmed = new Promise<void>((resolve) => {
            const timeout = setTimeout(() => {
              console.log('⏱️ Timeout waiting for session confirmation, reloading anyway')
              resolve()
            }, 3000) // 3 second timeout
            
            ipcMain.once('oauth-session-set', () => {
              clearTimeout(timeout)
              console.log('✅ Session confirmed by renderer, reloading now')
              resolve()
            })
          })
          
          // Wait for session confirmation, then reload
          sessionConfirmed.then(() => {
            console.log('🔄 Reloading app after OAuth intercept')
            if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
              mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
            } else {
              mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
            }
          })
        } else {
          // No callback URL extracted, just reload
          setTimeout(() => {
            console.log('🔄 Reloading app (no callback URL extracted)')
            if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
              mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
            } else {
              mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
            }
          }, 50)
        }
      } else {
        // Block any other navigation to the website
        console.log('🚫 BLOCKING navigation to website:', navigationUrl)
        event.preventDefault()
        
        // Reload the app
        setTimeout(() => {
          if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
            mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
          } else {
            mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
          }
        }, 50)
      }
      return
    }
    
    // If navigating to visnly:// protocol, handle it and prevent navigation
    if (navigationUrl.startsWith('visnly://')) {
      event.preventDefault()
      handleOAuthCallback(navigationUrl)
      // Reload the app after handling callback
      setTimeout(() => {
        if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
          mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
        } else {
          mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
        }
      }, 50)
      return
    }
  })
  
  // ALSO catch when the page actually loads the website (did-finish-load)
  mainWindow.webContents.on('did-finish-load', () => {
    const currentUrl = mainWindow.webContents.getURL()
    
    // Check if the URL's hostname is actually visnly.com (not just in query params)
    let isVisnlyDomain = false
    try {
      const url = new URL(currentUrl)
      const hostname = url.hostname.toLowerCase()
      isVisnlyDomain = hostname === 'visnly.com' || hostname === 'www.visnly.com'
    } catch (e) {
      // If URL parsing fails, skip this check
      isVisnlyDomain = false
    }
    
    // Only intercept if it's actually the visnly.com domain (callback page)
    if (isVisnlyDomain && !currentUrl.includes('localhost') && !currentUrl.includes('127.0.0.1')) {
      console.log('🚫 Website loaded in app window - extracting tokens and reloading app:', currentUrl)
      
      // Try to extract hash fragment from the loaded page
      mainWindow.webContents.executeJavaScript(`
        (function() {
          const hash = window.location.hash;
          if (hash && (hash.includes('access_token') || hash.includes('code='))) {
            return hash.substring(1); // Remove the #
          }
          return null;
        })();
      `).then((hashFragment: string | null) => {
        if (hashFragment) {
          console.log('✅ Extracted hash fragment from loaded page')
          const callbackUrl = `visnly://auth/callback#${hashFragment}`
          
          // Encode callback URL and pass it as query parameter when reloading
          // This works across domains (unlike localStorage)
          const encodedCallback = encodeURIComponent(callbackUrl)
          console.log('💾 OAuth callback extracted, reloading app with callback parameter')
          
          // Reload with callback as query parameter
          if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
            mainWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}?oauth_callback=${encodedCallback}`)
          } else {
            mainWindow.loadFile(join(__dirname, '../renderer/index.html'), {
              query: { oauth_callback: encodedCallback }
            })
          }
        } else {
          // No hash found, just reload
          setTimeout(() => {
            if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
              mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
            } else {
              mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
            }
          }, 100)
        }
      }).catch((e) => {
        console.error('Error extracting hash:', e)
        // Still reload the app
        if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
          mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
        } else {
          mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
        }
      })
    }
  })

  // Load the standard Dashboard URL
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    console.log('Loading dev URL:', process.env['ELECTRON_RENDERER_URL'])
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    console.log('Loading production file:', join(__dirname, '../renderer/index.html'))
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
  
  // Open DevTools in dev mode for debugging
  if (is.dev) {
    mainWindow.webContents.openDevTools()
  }
}

function createOverlayWindow(): void {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize
  const overlayWidth = 500
  const overlayHeight = 600

  overlayWindow = new BrowserWindow({
    width: overlayWidth,
    height: overlayHeight,
    minWidth: 300,
    minHeight: 400,
    // Remove maxWidth/maxHeight to allow resizing beyond screen
    x: width - overlayWidth - 20,
    y: height - overlayHeight - 20,
    show: false,
    frame: false, // No title bar (we made our own)
    transparent: true, // See-through background
    backgroundColor: '#00000000', // Fully transparent background
    alwaysOnTop: true, // Floats above everything
    skipTaskbar: true, // Doesn't show in taskbar
    hasShadow: false, // We control shadow in CSS
    resizable: true, // Enable resizing
    movable: true, // Enable moving (can drag off-screen)
    roundedCorners: true, // Rounded corners (Windows 11+)
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      nodeIntegration: false,
      contextIsolation: true
    }
  })
  
  // Enable window to be moved off-screen
  overlayWindow.setMovable(true)
  overlayWindow.setResizable(true)

  // Load the Overlay URL (Note the hash /#/overlay)
  const overlayUrl = is.dev && process.env['ELECTRON_RENDERER_URL']
    ? `${process.env['ELECTRON_RENDERER_URL']}/#/overlay`
    : `file://${join(__dirname, '../renderer/index.html')}#/overlay`

  overlayWindow.loadURL(overlayUrl)
  
  // Prevent closing, just hide instead
  overlayWindow.on('close', (e) => {
    e.preventDefault()
    overlayWindow?.hide()
  })
}

// Modified Toggle Logic
function toggleOverlay() {
  if (overlayWindow?.isVisible()) {
    overlayWindow.hide()
    // Show the dashboard when overlay closes
    mainWindow?.show()
    mainWindow?.focus()
  } else {
    overlayWindow?.show()
    overlayWindow?.focus()
    // Hides the dashboard to "close it out"
    mainWindow?.hide() 
  }
}

// Register custom protocol for OAuth callback
const PROTOCOL_NAME = 'visnly'

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.studylayer.app')

  // Register custom protocol handler for OAuth callbacks
  if (process.defaultApp) {
    if (process.argv.length >= 2) {
      app.setAsDefaultProtocolClient(PROTOCOL_NAME, process.execPath, [process.argv[1]])
    }
  } else {
    app.setAsDefaultProtocolClient(PROTOCOL_NAME)
  }

  // Handle protocol URLs (OAuth callbacks)
  app.on('open-url', (event, url) => {
    event.preventDefault()
    handleOAuthCallback(url)
  })

  // Handle protocol URLs on Windows/Linux
  if (process.platform !== 'darwin') {
    app.on('second-instance', (_, commandLine) => {
      // Someone tried to run a second instance, focus our window instead
      if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore()
        mainWindow.focus()
      }
      
      // Check for protocol URL in command line
      const url = commandLine.find(arg => arg.startsWith(`${PROTOCOL_NAME}://`))
      if (url) {
        handleOAuthCallback(url)
      }
    })
  }

  // Handle protocol URLs passed as command line argument
  const url = process.argv.find(arg => arg.startsWith(`${PROTOCOL_NAME}://`))
  if (url) {
    handleOAuthCallback(url)
  }

  function handleOAuthCallback(url: string) {
    console.log('Main process received OAuth callback:', url)
    
    // Focus the main window when callback is received
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
      mainWindow.show()
    }
    
    // For PKCE flow, the code is in query params: visnly://auth/callback?code=...
    // For implicit flow, tokens are in hash: visnly://auth/callback#access_token=...
    // We'll send the full URL string and let the renderer parse it
    
    // Send the full callback URL to the renderer process
    if (mainWindow) {
      mainWindow.webContents.send('oauth-callback', url)
    } else {
      // Window not ready yet, wait for it
      app.once('browser-window-created', () => {
        if (mainWindow) {
          mainWindow.webContents.send('oauth-callback', url)
        }
      })
    }
  }

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
    
    // Handle permission requests (microphone, camera, etc.)
    window.webContents.session.setPermissionRequestHandler((_webContents, permission, callback) => {
      // Automatically allow microphone permissions
      if (permission === 'media') {
        callback(true) // Allow
      } else {
        callback(false) // Deny other permissions
      }
    })

    // Handle permission check results
    window.webContents.session.setPermissionCheckHandler((_webContents, permission, _requestingOrigin) => {
      // Allow microphone access
      if (permission === 'media') {
        return true
      }
      return false
    })
  })

  // HANDLE STEALTH MODE
  // isDetectable = true  -> Protection OFF (Zoom can see it)
  // isDetectable = false -> Protection ON  (Zoom sees nothing)
  ipcMain.on('set-detectable', (_, isDetectable: boolean) => {
    if (overlayWindow) {
      // setContentProtection(true) HIDEs it from capture
      // setContentProtection(false) SHOWS it to capture
      overlayWindow.setContentProtection(!isDetectable)
    }

    // Optional: Hide dashboard from capture too
    if (mainWindow) {
      mainWindow.setContentProtection(!isDetectable)
    }
  })

  // Listen for the "Start Session" button click from React
  ipcMain.on('open-overlay', () => {
    if (!overlayWindow?.isVisible()) {
      toggleOverlay()
    }
  })

  // Listen for overlay close button click from React
  ipcMain.on('close-overlay', () => {
    if (overlayWindow?.isVisible()) {
      toggleOverlay()
    }
  })

  // Enable window dragging mode
  ipcMain.on('enable-window-drag', () => {
    if (overlayWindow) {
      overlayWindow.setIgnoreMouseEvents(false)
    }
  })

  // NEW: Handle screen source request
  ipcMain.handle('get-screen-source', async () => {
    const { desktopCapturer } = require('electron')
    // Get all screens
    const sources = await desktopCapturer.getSources({ types: ['screen'], thumbnailSize: { width: 0, height: 0 } })
    // Return the first screen (Primary Display)
    return sources[0]
  })

  // Handle overlay window movement (allows off-screen movement)
  ipcMain.on('move-overlay-window', (_event, { direction, distance }: { direction: 'left' | 'right' | 'up' | 'down', distance: number }) => {
    if (!overlayWindow) return
    
    const [x, y] = overlayWindow.getPosition()
    
    let newX = x
    let newY = y
    
    // Allow movement off-screen (no bounds checking)
    switch (direction) {
      case 'left':
        newX = x - distance
        break
      case 'right':
        newX = x + distance
        break
      case 'up':
        newY = y - distance
        break
      case 'down':
        newY = y + distance
        break
    }
    
    overlayWindow.setPosition(newX, newY)
  })

  // Handle OAuth URL loading - load in app window instead of external browser
  ipcMain.on('load-oauth-url', (_event, url: string) => {
    if (mainWindow) {
      console.log('🔐 Loading OAuth URL in app window (stays in app):', url)
      mainWindow.loadURL(url)
      // The will-navigate handler above will catch the redirect and extract the code
    }
  })

  // 1. Create Dashboard
  createMainWindow()
  
  // 2. Create Overlay (Hidden)
  createOverlayWindow()

  // 3. Register Hotkey
  // 'CommandOrControl+Shift+Space' works on both Mac and Windows
  globalShortcut.register('CommandOrControl+Shift+Space', () => {
    toggleOverlay()
  })

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// Unregister hotkeys when quitting
app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})
