import React from 'react';
import LiquidBackground from './LiquidBackground';

const LoadingScreen: React.FC = () => {
  return (
    <div style={styles.container}>
      <LiquidBackground />
      <div style={styles.content}>
        <div style={styles.logoContainer}>
          <div style={styles.logo}>V</div>
          <div style={styles.logoGlow}></div>
        </div>
        <div style={styles.textContainer}>
          <h1 style={styles.title}>Visnly</h1>
        <div style={styles.loader}>
          <div style={styles.loaderBar} className="loading-bar-1"></div>
          <div style={styles.loaderBar} className="loading-bar-2"></div>
          <div style={styles.loaderBar} className="loading-bar-3"></div>
        </div>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100vw',
    height: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#050505',
    color: '#fff',
    position: 'relative',
    overflow: 'hidden'
  },
  content: {
    position: 'relative',
    zIndex: 10,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '32px'
  },
  logoContainer: {
    position: 'relative',
    width: '80px',
    height: '80px'
  },
  logo: {
    width: '80px',
    height: '80px',
    background: '#fff',
    color: '#000',
    borderRadius: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 900,
    fontSize: '36px',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    position: 'relative',
    zIndex: 2,
    boxShadow: '0 0 40px rgba(255, 255, 255, 0.3)',
    animation: 'logoFloat 2s ease-in-out infinite'
  },
  logoGlow: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '120px',
    height: '120px',
    background: 'radial-gradient(circle, rgba(100, 108, 255, 0.4) 0%, transparent 70%)',
    borderRadius: '50%',
    filter: 'blur(20px)',
    animation: 'glowPulse 2s ease-in-out infinite',
    zIndex: 1
  },
  textContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '24px'
  },
  title: {
    fontSize: '32px',
    fontWeight: 700,
    letterSpacing: '-0.5px',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    background: 'linear-gradient(135deg, #fff 0%, rgba(255, 255, 255, 0.7) 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    animation: 'fadeIn 0.6s ease-out'
  },
  loader: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center'
  },
  loaderBar: {
    width: '6px',
    height: '32px',
    background: 'linear-gradient(180deg, #646cff 0%, rgba(100, 108, 255, 0.5) 100%)',
    borderRadius: '3px',
    animation: 'loaderWave 1.4s ease-in-out infinite',
    boxShadow: '0 0 10px rgba(100, 108, 255, 0.5)'
  }
};

// Add CSS animations
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes logoFloat {
    0%, 100% { transform: translateY(0px) scale(1); }
    50% { transform: translateY(-10px) scale(1.05); }
  }
  @keyframes glowPulse {
    0%, 100% { opacity: 0.6; transform: translate(-50%, -50%) scale(1); }
    50% { opacity: 1; transform: translate(-50%, -50%) scale(1.2); }
  }
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes loaderWave {
    0%, 100% { transform: scaleY(0.4); opacity: 0.5; }
    50% { transform: scaleY(1); opacity: 1; }
  }
  .loading-bar-1 { animation-delay: 0s !important; }
  .loading-bar-2 { animation-delay: 0.2s !important; }
  .loading-bar-3 { animation-delay: 0.4s !important; }
`;
if (!document.head.querySelector('style[data-loading-screen]')) {
  styleSheet.setAttribute('data-loading-screen', 'true');
  document.head.appendChild(styleSheet);
}

export default LoadingScreen;

