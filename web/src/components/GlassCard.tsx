import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
}

export const GlassCard = ({ children, className = '' }: GlassCardProps) => {
  return (
    <div className={`glass-panel rounded-2xl p-6 ${className}`}>
      {children}
    </div>
  );
};



