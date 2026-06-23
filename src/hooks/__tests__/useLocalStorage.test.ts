import { describe, it, expect, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import {
  useLocalStorage,
  readLocalStorageValue,
  writeLocalStorageValue,
  removeLocalStorageValue,
} from '../useLocalStorage';

beforeEach(() => {
  window.localStorage.clear();
});

describe('useLocalStorage', () => {
  it('initializes from an existing localStorage value', () => {
    window.localStorage.setItem('count', JSON.stringify(42));
    const { result } = renderHook(() => useLocalStorage('count', 0));
    expect(result.current[0]).toBe(42);
  });

  it('falls back to the initial value when nothing is stored', () => {
    const { result } = renderHook(() => useLocalStorage('missing-key', 'default'));
    expect(result.current[0]).toBe('default');
  });

  it('falls back to the initial value when stored data is corrupted JSON', () => {
    window.localStorage.setItem('broken', '{not valid json');
    const { result } = renderHook(() => useLocalStorage('broken', 'fallback'));
    expect(result.current[0]).toBe('fallback');
  });

  it('persists updates to localStorage', () => {
    const { result } = renderHook(() => useLocalStorage('count', 0));
    act(() => result.current[1](5));
    expect(result.current[0]).toBe(5);
    expect(JSON.parse(window.localStorage.getItem('count')!)).toBe(5);
  });

  it('supports functional updates', () => {
    const { result } = renderHook(() => useLocalStorage('count', 1));
    act(() => result.current[1]((prev) => prev + 1));
    expect(result.current[0]).toBe(2);
    expect(JSON.parse(window.localStorage.getItem('count')!)).toBe(2);
  });
});

describe('readLocalStorageValue / writeLocalStorageValue / removeLocalStorageValue', () => {
  it('round-trips a value', () => {
    writeLocalStorageValue('key', { a: 1 });
    expect(readLocalStorageValue('key', null)).toEqual({ a: 1 });
  });

  it('returns the fallback for missing keys', () => {
    expect(readLocalStorageValue('nope', 'fallback')).toBe('fallback');
  });

  it('returns the fallback for corrupted JSON without throwing', () => {
    window.localStorage.setItem('corrupt', 'not json{{{');
    expect(() => readLocalStorageValue('corrupt', 'fallback')).not.toThrow();
    expect(readLocalStorageValue('corrupt', 'fallback')).toBe('fallback');
  });

  it('removes a value', () => {
    writeLocalStorageValue('key', 'value');
    removeLocalStorageValue('key');
    expect(window.localStorage.getItem('key')).toBeNull();
  });
});
