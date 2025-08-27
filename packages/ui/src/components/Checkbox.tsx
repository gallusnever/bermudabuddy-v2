import * as React from 'react';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(({ className, ...props }, ref) => {
  return <input ref={ref} type="checkbox" className={`bb-input h-4 w-4 ${className || ''}`} {...props} />;
});
Checkbox.displayName = 'Checkbox';

export default Checkbox;
