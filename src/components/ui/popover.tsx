import * as React from 'react';
import * as RadixPopover from '@radix-ui/react-popover';
import { cn } from '@/lib/utils';

export const Popover = RadixPopover.Root;
export const PopoverTrigger = RadixPopover.Trigger;

export const PopoverContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof RadixPopover.Content>
>(({ className, ...props }, ref) => (
  <RadixPopover.Portal>
    <RadixPopover.Content
      ref={ref}
      className={cn(
        'z-50 w-64 rounded-md border bg-white p-4 shadow-md',
        className
      )}
      {...props}
    />
  </RadixPopover.Portal>
));

PopoverContent.displayName = 'PopoverContent';
