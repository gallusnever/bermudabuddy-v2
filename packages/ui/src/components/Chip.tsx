import * as React from 'react';
import { cn } from '../lib/cn';

export interface ChipProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
}

export function Chip({ className, icon, children, ...props }: ChipProps) {
  return (
    <div className={cn('bb-chip bb-ring', className)} {...props}>
      {icon}
      <span className="text-sm">{children}</span>
    </div>
  );
}

export default Chip;
