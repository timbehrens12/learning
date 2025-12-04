import { useState } from 'react';

interface LogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

export const Logo = ({ className = '', size = 32, showText = false }: LogoProps) => {
  // Try to use SVG first (best quality), then PNG, fallback to favicon
  const [logoSrc, setLogoSrc] = useState('/logo.svg');
  
  const handleError = () => {
    // Fallback chain: logo.svg -> logo.png -> favicon-32x32.png
    if (logoSrc.includes('logo.svg')) {
      setLogoSrc('/logo.png');
    } else if (logoSrc.includes('logo.png')) {
      setLogoSrc('/favicon-32x32.png');
    }
  };
  
  return (
    <div className={`flex items-center ${className}`}>
      <img
        src={logoSrc}
        alt="Visnly"
        width={size}
        height={size}
        className="flex-shrink-0"
        style={{ display: 'block' }}
        onError={handleError}
      />
      {showText && (
        <span className="font-semibold text-lg tracking-tight ml-2">Visnly</span>
      )}
    </div>
  );
};

