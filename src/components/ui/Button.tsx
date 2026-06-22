"use client";

import { cn } from "@/lib/cn";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "blue" | "outline" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: "md" | "lg";
  children: ReactNode;
}

const base =
  "inline-flex items-center justify-center gap-2 rounded-pill font-medium leading-none transition-colors disabled:cursor-not-allowed select-none";

const variants: Record<Variant, string> = {
  primary:
    "bg-deep-black text-white hover:bg-black disabled:bg-divider disabled:text-gray-text",
  blue: "bg-stratosphere text-white hover:brightness-110",
  outline:
    "bg-white text-deep-black border border-ink hover:bg-ghost-white",
  ghost: "bg-transparent text-deep-black hover:bg-ghost-white",
};

const sizes = {
  md: "px-5 py-3 text-base",
  lg: "px-8 py-4 text-2xl",
};

export function Button({
  variant = "primary",
  size = "lg",
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button className={cn(base, variants[variant], sizes[size], className)} {...props}>
      {children}
    </button>
  );
}
