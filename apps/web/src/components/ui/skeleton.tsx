import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

/** Decorative placeholder: fixed dimensions are supplied by callers so layout never shifts (CLS). */
export const Skeleton = ({ className, ...p }: HTMLAttributes<HTMLDivElement>) => (
  <div aria-hidden className={cn('skeleton', className)} {...p} />
);
