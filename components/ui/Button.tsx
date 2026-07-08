import { ReactNode, ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const variantStyles = {
  primary: 'bg-[var(--accent-blue)] hover:bg-[var(--accent-blue)]/80 text-white border-transparent',
  secondary: 'bg-transparent border-[var(--border-color)] hover:border-[var(--border-hover)] text-white hover:bg-[var(--bg-tertiary)]',
  ghost: 'bg-transparent border-transparent hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-white',
};

const sizeStyles = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-4 text-lg',
};

export function Button({ 
  children, 
  variant = 'primary', 
  size = 'md',
  className = '',
  ...props 
}: ButtonProps) {
  return (
    <button
      className={`
        inline-flex items-center justify-center gap-2
        rounded-full border font-semibold
        transition-all duration-300
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
}

interface LinkButtonProps {
  children: ReactNode;
  href: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  external?: boolean;
}

export function LinkButton({ 
  children, 
  href, 
  variant = 'primary', 
  size = 'md',
  className = '',
  external = false
}: LinkButtonProps) {
  return (
    <a
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      className={`
        inline-flex items-center justify-center gap-2
        rounded-full border font-semibold
        transition-all duration-300
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
    >
      {children}
    </a>
  );
}
