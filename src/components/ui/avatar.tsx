'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const avatarVariants = cva(
  'relative inline-flex items-center justify-center rounded-full bg-gray-100 overflow-hidden shrink-0',
  {
    variants: {
      size: {
        sm: 'h-8 w-8',
        default: 'h-10 w-10',
        lg: 'h-12 w-12',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
);

const avatarTextVariants = cva(
  'font-medium text-gray-600 select-none',
  {
    variants: {
      size: {
        sm: 'text-xs',
        default: 'text-sm',
        lg: 'text-base',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
);

export interface AvatarProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof avatarVariants> {
  src?: string | null;
  alt?: string;
  fallback?: string;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function Avatar({ className, size, src, alt, fallback, ...props }: AvatarProps) {
  const [hasError, setHasError] = React.useState(false);

  const showImage = src && !hasError;
  const initials = fallback ? getInitials(fallback) : alt ? getInitials(alt) : '?';

  return (
    <div
      className={cn(avatarVariants({ size, className }))}
      {...props}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt || ''}
          className="h-full w-full object-cover"
          onError={() => setHasError(true)}
        />
      ) : (
        <span className={cn(avatarTextVariants({ size }))}>
          {initials}
        </span>
      )}
    </div>
  );
}

export { Avatar, avatarVariants };
