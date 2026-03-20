/**
 * Combines multiple class names into a single string
 * This is a simplified version of the clsx or classnames libraries
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
