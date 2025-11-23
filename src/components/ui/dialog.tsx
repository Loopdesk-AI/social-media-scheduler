import * as React from 'react';
import * as RadixDialog from '@radix-ui/react-dialog';
import { cn } from '@/lib/utils';

export const Dialog = RadixDialog.Root;

export const DialogTrigger = RadixDialog.Trigger;

export const DialogContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof RadixDialog.Content>
>(({ className, children, ...props }, ref) => (
  <RadixDialog.Portal>
    <RadixDialog.Overlay className="fixed inset-0 bg-black/50" />
    <RadixDialog.Content
      ref={ref}
      className={cn(
        // use theme-aware tokens so the dialog respects light/dark variables
        'fixed top-1/2 left-1/2 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-md bg-popover text-popover-foreground p-6 shadow-lg',
        className
      )}
      {...props}
    >
      {children}
    </RadixDialog.Content>
  </RadixDialog.Portal>
));

DialogContent.displayName = 'DialogContent';

export const DialogHeader: React.FC<{ className?: string; children: React.ReactNode }> = ({
  className,
  children
}) => {
  return <div className={cn('flex flex-col space-y-1', className)}>{children}</div>;
};

export const DialogFooter: React.FC<{ className?: string; children: React.ReactNode }> = ({
  className,
  children
}) => {
  return <div className={cn('flex justify-end space-x-2', className)}>{children}</div>;
};

export const DialogTitle = RadixDialog.Title;
export const DialogDescription = RadixDialog.Description;
