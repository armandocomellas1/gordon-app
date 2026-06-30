import { forwardRef, cloneElement, isValidElement } from "react";
import { cn } from "@/lib/utils";

const variants = {
  default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
  outline: "border border-border bg-transparent hover:border-primary hover:text-goldink",
  ghost: "hover:bg-secondary",
  accent: "bg-accent text-accent-foreground hover:bg-accent/90 shadow-sm",
  destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
  link: "text-goldink underline-offset-4 hover:underline",
};

const sizes = {
  default: "h-10 px-4 py-2",
  sm: "h-9 px-3 text-sm",
  lg: "h-12 px-6 text-base",
  icon: "h-10 w-10",
};

export const Button = forwardRef(function Button(
  { className, variant = "default", size = "default", asChild = false, children, ...props },
  ref
) {
  const classes = cn(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
    variants[variant],
    sizes[size],
    className
  );

  // asChild: merge button styles onto the single child element (e.g. <Link>),
  // so the child itself is the clickable target — no dead padding zone.
  if (asChild && isValidElement(children)) {
    return cloneElement(children, {
      ref,
      className: cn(classes, children.props.className),
      ...props,
    });
  }

  return (
    <button ref={ref} className={classes} {...props}>
      {children}
    </button>
  );
});
