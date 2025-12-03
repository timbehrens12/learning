interface LogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

export const Logo = ({ className = '', size = 32, showText = false }: LogoProps) => {
  // Using the favicon as the logo - you can also add logo.svg or logo.png to public folder
  const logoSrc = '/favicon-32x32.png.png'; // Using favicon, or use '/logo.svg' or '/logo.png' if you add one
  
  return (
    <div className={`flex items-center ${className}`}>
      <img
        src={logoSrc}
        alt="Visnly"
        width={size}
        height={size}
        className="flex-shrink-0"
        style={{ display: 'block' }}
      />
      {showText && (
        <span className="font-semibold text-lg tracking-tight ml-2">Visnly</span>
      )}
    </div>
  );
};

