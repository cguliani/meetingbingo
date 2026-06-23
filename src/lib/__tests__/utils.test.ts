import { describe, it, expect } from 'vitest';
import { cn } from '../utils';

describe('cn', () => {
  it('joins multiple truthy class strings with a space', () => {
    expect(cn('a', 'b', 'c')).toBe('a b c');
  });

  it('drops falsy values from a conditional expression', () => {
    const isActive = false;
    expect(cn('base', isActive && 'active-class')).toBe('base');
  });

  it('keeps a class when the condition is true', () => {
    const isActive = true;
    expect(cn('base', isActive && 'active-class')).toBe('base active-class');
  });

  it('drops null and undefined', () => {
    expect(cn('base', null, undefined, 'end')).toBe('base end');
  });

  it('returns an empty string when given nothing truthy', () => {
    expect(cn(false, null, undefined)).toBe('');
  });
});
