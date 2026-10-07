# AGENTS.md

## Operational Commands

- 패키지 매니저는 `bun` 고정. npm/yarn/pnpm 사용 금지 (`bun.lock`, `package.json` scripts가 `bun` 전제).
- 개발 서버(API + Vite 동시): `bun run dev`
- API 서버만: `bun run server` (포트 3002, `server/index.ts:138`)
- 테스트 전체: `bun run test` (vitest run; `bun test`는 Bun 내장 러너라 설정이 다르므로 쓰지 않는다)
- 단일 파일 테스트: `bun run test server/generator.test.ts`
- 린트: `bun run lint`
- 빌드/타입체크: `bun run build` (`tsc -b && vite build`)

## Golden Rules

### Immutable

- API 키를 로그, 에러 메시지, 응답 본문에 노출하지 않는다. `/api/config`는 키 존재 여부(boolean)만 반환한다 (`server/index.ts:147-156`). Gemini 호출은 URL 쿼리에 키가 들어가므로(`server/index.ts:99`) 에러에 `url`을 포함시키지 않는다.
- `.env`와 키가 담긴 파일은 커밋하지 않는다 (`.gitignore`).
- AI가 생성한 코드는 `react-live`로만 실행한다 (`src/components/LivePreview.tsx:14`). `eval`, `new Function`, `dangerouslySetInnerHTML` 등 다른 실행 경로를 추가하지 않는다.

### Do's and Don'ts

- `server/index.ts`는 import 시점에 `Bun.serve`를 실행한다 (`:138`). 테스트 대상 로직은 부수효과 없는 `server/generator.ts`, `server/fallback.ts`에 두고, 테스트에서 `index.ts`를 import하지 않는다.
- 프로바이더 업스트림 에러는 `Claude API error: ${status}`, `Gemini API error: ${status}` 형태로 상태 코드를 메시지에 유지한다. 라우트가 `message.includes('503')`, `'429'` 문자열로 HTTP 상태를 매핑한다 (`server/index.ts:194,201`).
- `Provider` 타입이 두 곳에 중복 정의되어 있다 (`server/index.ts:57`, `src/types/index.ts:1`). 프로바이더를 추가/변경하면 두 곳과 `ENV_KEYS`, UI 선택지를 함께 수정한다.
- TypeScript는 `erasableSyntaxOnly`가 켜져 있다 (`tsconfig.app.json:23`, `tsconfig.node.json`). `enum`, `namespace`, 생성자 파라미터 프로퍼티를 쓰지 않는다.
- `tsc -b`는 `src`와 `vite.config.ts`만 검사한다 (`tsconfig.app.json:27`, `tsconfig.node.json`). `server/`는 빌드에서 타입체크되지 않으므로 서버 수정 후에는 `bun run test`와 `bun run lint`로 확인한다.
- Vite 프록시 대상 포트(`vite.config.ts:11`)와 서버 포트(`server/index.ts:138`)는 항상 같이 바꾼다.

### 생성 코드 파이프라인 (이중 방어)

- 모델 출력은 두 겹으로 정규화한다. 프롬프트에서 "코드펜스 금지", "마지막에 `render(<Name />)` 호출"을 요구하고(`server/index.ts:11,16`), 서버에서 `stripCodeFences`, `ensureRenderCall`로 다시 보정한다 (`server/index.ts:188`, `server/generator.ts:5,16`). 한쪽만 제거하지 않는다.
- 프롬프트의 "import 금지", "TypeScript 문법 금지" 규칙(`server/index.ts:11,20`)은 `react-live` `noInline` 실행 제약 때문이다 (`LivePreview.tsx:14`). 완화하면 미리보기가 깨진다. `SYSTEM_PROMPT`를 수정하면 `generator.ts`의 보정 로직과 테스트가 여전히 유효한지 확인한다.

### 테스트 경계

- 테스트가 있는 곳: `server/generator.ts`, `server/fallback.ts`, `src/components/PromptInput.tsx`. 이 파일들을 수정하면 해당 테스트를 갱신한다.
- 테스트가 없는 곳: `server/index.ts`(라우팅, 외부 API 호출), `src/hooks/useComponentGenerator.ts`, `src/App.tsx`. 변경 시 순수 로직을 `generator.ts`/`fallback.ts` 방식으로 분리해 테스트를 붙이는 쪽을 우선한다.
- 테스트 환경은 jsdom이며 각 테스트 후 `cleanup()`이 자동 실행된다 (`src/test/setup.ts`). 테스트 파일은 소스 옆에 `*.test.ts(x)`로 둔다 (`vite.config.ts:20`).

## Project Context

- 프롬프트로 React 컴포넌트를 AI가 생성하고 실시간 미리보기와 코드를 보여주는 도구.
- Stack: React 19, TypeScript, Vite 8, Bun(API 프록시), react-live, Vitest, Testing Library, ESLint 9 flat config.

## Standards and References

- 프로젝트 소개, 실행 방법, 기능 목록은 [README.md](./README.md)를 따른다.
- 커밋: `type: 요약` (feat/fix/refactor/chore), 한국어, 50자 안팎, 마침표 없음. 제목과 트레일러 사이에 빈 줄을 둔다. 상세 절차는 `.claude/skills/commit/SKILL.md`.
- 사용자 대상 문구와 에러 메시지는 한국어로 쓴다 (`server/index.ts:196,203`).
- 의존성 변경 시 `bun.lock`도 함께 커밋한다.

## Maintenance Policy

- 이 문서의 규칙과 코드가 어긋나면(파일 이동, 포트 변경, 규칙 위반 관행 등) 작업을 마치기 전에 AGENTS.md 업데이트를 제안한다.
