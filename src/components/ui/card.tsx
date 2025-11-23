import { PropsWithChildren } from 'react';
import { cn } from '@/lib/utils';

export const Card = ({ children, className }: PropsWithChildren<{ className?: string }>) => {
  return <div className={cn('rounded-md bg-white shadow-sm', className)}>{children}</div>;
};

export const CardContent = ({ children, className }: PropsWithChildren<{ className?: string }>) => {
  return <div className={cn('p-4', className)}>{children}</div>;
};

export default Card;
