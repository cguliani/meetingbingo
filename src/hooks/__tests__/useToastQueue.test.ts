import { describe, it, expect } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useToastQueue } from '../useToastQueue';

describe('useToastQueue', () => {
  it('starts with an empty queue', () => {
    const { result } = renderHook(() => useToastQueue());
    expect(result.current.toasts).toEqual([]);
  });

  it('adds a toast', () => {
    const { result } = renderHook(() => useToastQueue());
    act(() => result.current.addToast('sprint detected'));
    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].message).toBe('sprint detected');
    expect(result.current.toasts[0].type).toBe('success');
  });

  it('stacks multiple toasts added in quick succession (does not drop or overwrite)', () => {
    const { result } = renderHook(() => useToastQueue(5));
    act(() => {
      result.current.addToast('sprint');
      result.current.addToast('backlog');
      result.current.addToast('velocity');
    });
    expect(result.current.toasts).toHaveLength(3);
    expect(result.current.toasts.map((t) => t.message)).toEqual(['sprint', 'backlog', 'velocity']);
  });

  it('caps simultaneously visible toasts, dropping the oldest first', () => {
    const { result } = renderHook(() => useToastQueue(2));
    act(() => {
      result.current.addToast('first');
      result.current.addToast('second');
      result.current.addToast('third');
    });
    expect(result.current.toasts).toHaveLength(2);
    expect(result.current.toasts.map((t) => t.message)).toEqual(['second', 'third']);
  });

  it('dismisses a toast by id', () => {
    const { result } = renderHook(() => useToastQueue());
    act(() => result.current.addToast('sprint'));
    const id = result.current.toasts[0].id;
    act(() => result.current.dismissToast(id));
    expect(result.current.toasts).toEqual([]);
  });

  it('assigns each toast a unique id', () => {
    const { result } = renderHook(() => useToastQueue(10));
    act(() => {
      result.current.addToast('a');
      result.current.addToast('b');
    });
    const ids = result.current.toasts.map((t) => t.id);
    expect(new Set(ids).size).toBe(2);
  });
});
