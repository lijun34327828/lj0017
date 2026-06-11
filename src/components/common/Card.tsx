import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  hoverable = false,
  ...props
}) => {
  return (
    <div
      className={cn(
        'bg-[#1a1008]/80 backdrop-blur-sm border border-[#C9A962]/20 rounded-xl overflow-hidden',
        hoverable && 'transition-all duration-300 hover:border-[#C9A962]/40 hover:shadow-xl hover:shadow-[#C9A962]/10',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        'px-5 py-4 border-b border-[#C9A962]/10 flex items-center justify-between',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className,
  ...props
}) => {
  return (
    <div className={cn('p-5', className)} {...props}>
      {children}
    </div>
  );
};

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        'px-5 py-4 border-t border-[#C9A962]/10 bg-black/20',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
