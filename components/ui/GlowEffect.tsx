interface GlowEffectProps {
  color: 'blue' | 'purple' | 'accent';
  position: {
    top?: string;
    bottom?: string;
    left?: string;
    right?: string;
  };
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  sm: 'w-[80vw] h-[80vw] max-w-[400px] max-h-[400px]',
  md: 'w-[90vw] h-[90vw] max-w-[600px] max-h-[600px]',
  lg: 'w-[100vw] h-[100vw] max-w-[800px] max-h-[800px]',
};

export function GlowEffect({ color, position, size = 'lg', className = '' }: GlowEffectProps) {
  const positionStyles: React.CSSProperties = {
    top: position.top,
    bottom: position.bottom,
    left: position.left,
    right: position.right,
  };

  return (
    <div
      className={`glow-${color} ${sizeMap[size]} ${className}`}
      style={positionStyles}
    />
  );
}
