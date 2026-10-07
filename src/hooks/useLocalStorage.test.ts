import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { readStorage, useLocalStorage } from './useLocalStorage';

describe('readStorage', () => {
  beforeEach(() => localStorage.clear());

  it('저장된 값이 없으면 fallback을 반환한다', () => {
    expect(readStorage('k', 'x')).toBe('x');
  });

  it('JSON이 손상되었으면 fallback을 반환한다', () => {
    localStorage.setItem('k', '{broken');
    expect(readStorage('k', 'x')).toBe('x');
  });

  it('revive가 던지면 fallback을 반환한다', () => {
    localStorage.setItem('k', '1');
    expect(
      readStorage('k', 'x', () => {
        throw new Error('invalid');
      }),
    ).toBe('x');
  });
});

describe('useLocalStorage', () => {
  beforeEach(() => localStorage.clear());

  it('값을 바꾸면 localStorage에 저장하고, 다시 마운트하면 복원한다', () => {
    const first = renderHook(() => useLocalStorage('k', ''));
    act(() => first.result.current[1]('hello'));
    expect(localStorage.getItem('k')).toBe('"hello"');
    first.unmount();

    const second = renderHook(() => useLocalStorage('k', ''));
    expect(second.result.current[0]).toBe('hello');
  });
});
