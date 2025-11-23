import { cn } from '@/lib/utils';
import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'link';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
          variant === 'default' && 'bg-blue-500 text-white hover:bg-blue-600',
          variant === 'outline' && 'border border-gray-300 hover:bg-gray-100',
          variant === 'ghost' && 'bg-transparent hover:bg-gray-100',
          variant === 'link' && 'underline text-blue-500 hover:text-blue-600',
          size === 'sm' && 'px-2 py-1 text-sm',
          size === 'md' && 'px-4 py-2',
          size === 'lg' && 'px-6 py-3',
          size === 'icon' && 'p-2',
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';
