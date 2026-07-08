import { ReactNode } from 'react';

interface SectionTagProps {
  children: ReactNode;
  color?: 'blue' | 'purple' | 'pink' | 'green';
  icon?: ReactNode;
  className?: string;
}

export function SectionTag({ children, color = 'blue', icon, className = '' }: SectionTagProps) {
  return (
    <div className={`section-tag section-tag-${color} ${className}`}>
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span>{children}</span>
    </div>
  );
}
