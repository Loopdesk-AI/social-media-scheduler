import { forwardRef, ImgHTMLAttributes, PropsWithChildren } from 'react';
import { cn } from '@/lib/utils';

export const Avatar = forwardRef<HTMLDivElement, PropsWithChildren<{ className?: string }>>(
  ({ children, className }, ref) => {
    return (
      <div ref={ref} className={cn('inline-flex items-center justify-center rounded-full overflow-hidden bg-gray-200', className)}>
        {children}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';

export const AvatarImage = forwardRef<HTMLImageElement, ImgHTMLAttributes<HTMLImageElement>>(({ className, ...props }, ref) => (
  <img ref={ref} className={cn('object-cover', className)} {...props} />
));

AvatarImage.displayName = 'AvatarImage';

export const AvatarFallback = ({ children, className }: PropsWithChildren<{ className?: string }>) => (
  <div className={cn('flex items-center justify-center text-sm font-semibold text-gray-700', className)}>{children}</div>
);

export default Avatar;
