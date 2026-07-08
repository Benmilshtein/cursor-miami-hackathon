import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  accentColor?: 'blue' | 'purple' | 'green';
  hover?: boolean;
  padding?: 'sm' | 'md' | 'lg';
}

const paddingMap = {
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

const accentColorMap = {
  blue: 'bg-[var(--accent-blue)]',
  purple: 'bg-[var(--accent-purple)]',
  green: 'bg-[var(--accent-green)]',
};

export function Card({ 
  children, 
  className = '', 
  accentColor,
  hover = true,
  padding = 'md'
}: CardProps) {
  return (
    <div 
      className={`
        glass-card relative overflow-hidden
        ${paddingMap[padding]}
        ${hover ? '' : 'hover:transform-none hover:shadow-none'}
        ${className}
      `}
    >
      {accentColor && (
        <div className={`accent-bar-left ${accentColorMap[accentColor]}`} />
      )}
      {children}
    </div>
  );
}

interface IconBoxProps {
  children: ReactNode;
  color?: 'blue' | 'purple' | 'green';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const iconSizeMap = {
  sm: 'w-10 h-10 text-lg',
  md: 'w-12 h-12 text-xl',
  lg: 'w-14 h-14 text-2xl',
};

export function IconBox({ children, color = 'blue', size = 'md', className = '' }: IconBoxProps) {
  return (
    <div className={`icon-box icon-box-${color} ${iconSizeMap[size]} ${className}`}>
      {children}
    </div>
  );
}
