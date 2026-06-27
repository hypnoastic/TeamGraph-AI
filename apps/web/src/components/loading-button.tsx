import type { ButtonHTMLAttributes, ReactNode } from "react";

type LoadingButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  busy?: boolean;
  label: ReactNode;
  busyLabel?: ReactNode;
};

export function LoadingButton({
  busy = false,
  label,
  busyLabel = "Working...",
  disabled,
  className = "btn-primary",
  children,
  ...props
}: LoadingButtonProps) {
  return (
    <button {...props} disabled={disabled || busy} className={className}>
      {children}
      {busy ? busyLabel : label}
    </button>
  );
}
