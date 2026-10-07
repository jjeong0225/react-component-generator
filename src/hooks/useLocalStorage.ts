import { useState, useEffect, type Dispatch, type SetStateAction } from 'react';

/**
 * localStorage에서 JSON 값을 읽는다. 값이 없거나 손상되었거나 접근이 막힌 경우
 * (사생활 보호 모드 등) fallback을 반환한다. revive로 저장 형태를 앱 타입으로 복원·검증한다.
 */
export function readStorage<T>(key: string, fallback: T, revive?: (raw: unknown) => T): T {
  try {
    const stored = window.localStorage.getItem(key);
    if (stored === null) return fallback;
    const raw: unknown = JSON.parse(stored);
    return revive ? revive(raw) : (raw as T);
  } catch {
    return fallback;
  }
}

/** useState처럼 쓰되 값이 바뀔 때마다 localStorage에 저장하고, 마운트 시 저장값으로 시작한다. */
export function useLocalStorage<T>(
  key: string,
  fallback: T,
  revive?: (raw: unknown) => T,
): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => readStorage(key, fallback, revive));

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // 용량 초과나 접근 불가 시에도 앱은 메모리 상태로 계속 동작한다.
    }
  }, [key, value]);

  return [value, setValue];
}
