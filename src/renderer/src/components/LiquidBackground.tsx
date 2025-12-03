import React from 'react';

const LiquidBackground: React.FC = () => {
  return (
    <div style={styles.container}>
      {/* The "Aurora" Blobs */}
      <div style={{...styles.blob, ...styles.blob1}}></div>
      <div style={{...styles.blob, ...styles.blob2}}></div>
      <div style={{...styles.blob, ...styles.blob3}}></div>
      
      {/* Noise Texture for Realism */}
      <div style={styles.noise}></div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'fixed',
    top: 0, left: 0,
    width: '100vw', height: '100vh',
    backgroundColor: '#050505',
    zIndex: -1,
    overflow: 'hidden',
  },
  noise: {
    position: 'absolute', inset: 0, opacity: 0.04,
    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
    pointerEvents: 'none',
  },
  blob: {
    position: 'absolute', borderRadius: '50%',
    filter: 'blur(80px)', // High blur = Liquid effect
    opacity: 0.5,
    animation: 'aurora 20s infinite ease-in-out',
  },
  blob1: {
    top: '-10%', left: '-10%', width: '50vw', height: '50vw',
    backgroundColor: '#4c1d95', // Deep Purple (Study)
    animationDelay: '0s',
  },
  blob2: {
    top: '40%', right: '-20%', width: '40vw', height: '40vw',
    backgroundColor: '#0ea5e9', // Cyan (Solve)
    animationDelay: '-5s',
  },
  blob3: {
    bottom: '-20%', left: '20%', width: '60vw', height: '60vw',
    backgroundColor: '#be185d', // Warning Red (Cheat)
    animationDelay: '-10s',
  },
};

export default LiquidBackground;


