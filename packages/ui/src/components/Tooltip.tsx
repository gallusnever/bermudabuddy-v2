"use client";
import * as React from 'react';

export interface TooltipProps extends React.HTMLAttributes<HTMLDivElement> {
  text: string;
}

export function Tooltip({ text, children, ...props }: TooltipProps) {
  return (
    <div title={text} {...props}>
      {children}
    </div>
  );
}

export default Tooltip;
