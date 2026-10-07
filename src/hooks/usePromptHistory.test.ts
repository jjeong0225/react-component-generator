import { describe, it, expect } from 'vitest';
import { pushPrompt, MAX_HISTORY } from './usePromptHistory';

describe('pushPrompt', () => {
  it('새 프롬프트를 맨 앞에 추가한다', () => {
    expect(pushPrompt(['a'], 'b')).toEqual(['b', 'a']);
  });

  it('중복 프롬프트는 기존 항목을 제거하고 맨 앞으로 올린다', () => {
    expect(pushPrompt(['a', 'b', 'c'], 'b')).toEqual(['b', 'a', 'c']);
  });

  it('최대 개수를 넘으면 가장 오래된 항목부터 버린다', () => {
    const full = Array.from({ length: MAX_HISTORY }, (_, i) => `p${i}`);
    const next = pushPrompt(full, 'new');
    expect(next).toHaveLength(MAX_HISTORY);
    expect(next[0]).toBe('new');
    expect(next).not.toContain(`p${MAX_HISTORY - 1}`);
  });
});
