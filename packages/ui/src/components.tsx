import React from "react";
import { cn } from "./utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
}

export const Button = ({ className, variant = "primary", ...props }: ButtonProps) => {
  const variants = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700",
    secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200",
    outline: "border border-gray-300 text-gray-700 hover:bg-gray-50",
    ghost: "text-gray-600 hover:bg-gray-100",
  };
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:pointer-events-none",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
};

export const Badge = ({
  className,
  children,
  variant = "default",
}: {
  className?: string;
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "error";
}) => {
  const variants = {
    default: "bg-gray-100 text-gray-700",
    success: "bg-green-100 text-green-700",
    warning: "bg-amber-100 text-amber-700",
    error: "bg-red-100 text-red-700",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
};

export const LoadingSkeleton = ({ className }: { className?: string }) => (
  <div className={cn("animate-pulse rounded bg-gray-200", className)} />
);

export const EmptyState = ({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) => (
  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 p-12 text-center">
    <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
    <p className="mt-1 text-sm text-gray-500">{description}</p>
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export const StatCard = ({
  title,
  value,
  icon: Icon,
  trend,
}: {
  title: string;
  value: string | number;
  icon: any;
  trend?: string;
}) => (
  <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
    <div className="flex items-center justify-between">
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <Icon className="h-5 w-5 text-gray-400" />
    </div>
    <h3 className="mt-2 text-2xl font-bold text-gray-900">{value}</h3>
    {trend && <p className="mt-1 text-xs text-green-600">{trend}</p>}
  </div>
);
