import * as React from 'react';
import { cn } from '../lib/cn';

type Variant = 'primary' | 'ghost' | 'soft';
type Size = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    const sizeCls =
      size === 'sm' ? 'h-8 px-3 text-sm' : size === 'lg' ? 'h-12 px-5 text-base' : 'h-10 px-4';
    const variantCls = variant === 'primary' ? 'bb-btn-primary' : variant === 'soft' ? 'bb-btn-soft' : 'bb-btn-ghost';
    return (
      <button
        ref={ref}
        className={cn('bb-btn bb-ring select-none', sizeCls, variantCls, className)}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';

export default Button;
