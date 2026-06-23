import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface Props extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /** Visually marks the card as the currently-selected option (e.g. a chosen category). */
  selected?: boolean;
}

export function Card({ children, className, selected, ...rest }: Props) {
  return (
    <div
      className={cn(
        'rounded-xl border bg-white p-4 shadow-sm transition-colors duration-200',
        selected ? 'border-purple-500 ring-2 ring-purple-300' : 'border-gray-200',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
