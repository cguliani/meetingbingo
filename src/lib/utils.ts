export type ClassValue = string | false | null | undefined;

/**
 * Joins truthy class name values together, skipping falsy ones. Used
 * throughout the UI for conditional Tailwind classes, e.g.
 * cn('base', isActive && 'active-class').
 */
export function cn(...classes: ClassValue[]): string {
  return classes.filter(Boolean).join(' ');
}
