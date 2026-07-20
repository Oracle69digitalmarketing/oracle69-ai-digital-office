import React from 'react';
import { cn } from './utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Card = ({ className, ...props }: CardProps) => (
  <div className={cn("rounded-xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md", className)} {...props} />
);
