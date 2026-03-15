type LoadingSpinnerProps = {
  className?: string;
  size?: "sm" | "md";
};

export function LoadingSpinner({
  className = "",
  size = "sm",
}: LoadingSpinnerProps) {
  const sizeClass = size === "md" ? "samsung-spinner-md" : "samsung-spinner-sm";
  return (
    <span
      className={`samsung-spinner ${sizeClass} ${className}`.trim()}
      aria-hidden="true"
    />
  );
}
