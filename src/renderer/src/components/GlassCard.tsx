import React from 'react';

interface GlassProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  hoverEffect?: boolean;
}

const GlassCard: React.FC<GlassProps> = ({ children, style, onClick, hoverEffect = false }) => {
  return (
    <div 
      onClick={onClick}
      className={hoverEffect ? "glass-hover" : ""}
      style={{
        ...defaultStyles.card, 
        ...style, 
        cursor: onClick ? 'pointer' : 'default'
      }}
    >
      {children}
    </div>
  );
};

const defaultStyles: Record<string, React.CSSProperties> = {
  card: {
    // The "Liquid Glass" Formula
    backgroundColor: 'rgba(20, 20, 25, 0.65)', // Dark but see-through
    backdropFilter: 'blur(24px)', // Heavy frost
    WebkitBackdropFilter: 'blur(24px)', // Safari/Electron support
    
    // The Borders (1px transparent white)
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderTop: '1px solid rgba(255, 255, 255, 0.15)', // Highlight top edge
    borderRadius: '24px', // Smooth corners
    
    // The Inner Glow (Depth)
    boxShadow: `
      0 20px 40px rgba(0, 0, 0, 0.6), 
      inset 0 0 0 1px rgba(255, 255, 255, 0.03)
    `,
    color: 'white',
    overflow: 'hidden',
    transition: 'all 0.2s ease-out',
  }
};

export default GlassCard;



