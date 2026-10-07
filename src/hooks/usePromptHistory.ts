import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';

export const MAX_HISTORY = 20;

/** 새 프롬프트를 맨 앞에 추가한다. 중복은 기존 항목을 끌어올리고, 최대 개수를 넘으면 오래된 것부터 버린다. */
export function pushPrompt(history: string[], prompt: string): string[] {
  return [prompt, ...history.filter((p) => p !== prompt)].slice(0, MAX_HISTORY);
}

function reviveHistory(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((p): p is string => typeof p === 'string').slice(0, MAX_HISTORY);
}

export function usePromptHistory() {
  const [history, setHistory] = useLocalStorage<string[]>('rcg:prompt-history', [], reviveHistory);

  const addPrompt = useCallback(
    (prompt: string) => setHistory((prev) => pushPrompt(prev, prompt)),
    [setHistory],
  );
  const clearHistory = useCallback(() => setHistory([]), [setHistory]);

  return { history, addPrompt, clearHistory };
}
