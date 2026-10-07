---
name: create-pr
description: 현재 브랜치의 커밋을 분석해 한국어 제목과 본문을 작성하고, 브랜치를 push한 뒤 GitHub Pull Request를 생성한다. 서브 에이전트(fork)에서 실행되어 메인 대화 컨텍스트를 소모하지 않는다. "PR 만들어줘", "PR 생성", "풀리퀘스트 올려줘", "create pr" 같은 요청에 활성화한다. 커밋 작성이나 main 브랜치 push에는 사용하지 않는다.
context: fork
agent: general-purpose
disable-model-invocation: true
---

# create-pr

현재 브랜치를 base 브랜치(기본 `main`)로 보내는 Pull Request를 만든다.

이 스킬은 서브 에이전트에서 실행되므로 사용자에게 중간 질문을 할 수 없다. 판단이 필요한 지점은 아래 규칙대로 안전한 쪽으로 처리하고, 처리할 수 없으면 PR을 만들지 말고 이유를 보고하며 끝낸다. 마지막 보고만 사용자에게 전달된다.

## 절차

### 1. 사전 확인

- `git rev-parse --is-inside-work-tree`로 git 저장소인지 확인한다. 아니면 중단한다.
- `gh auth status`로 GitHub CLI 로그인을 확인한다. 안 되어 있으면 사용자가 `! gh auth login`을 실행해야 한다고 보고하고 중단한다.
- `git branch --show-current`로 현재 브랜치를 확인한다. base 브랜치(`main`) 자체이면 중단한다. PR의 head가 될 수 없고, main에 직접 push하지 않기 위해서다. 사용자가 새 브랜치를 만든 뒤 다시 실행하도록 안내한다.
- `git status --short`로 미커밋 변경을 확인한다. 있으면 PR에 포함되지 않는다는 점을 최종 보고에 적는다. 커밋은 대신 만들지 않는다(커밋은 `commit` 스킬의 일이고 승인이 필요하다).
- `git remote -v`로 `origin`이 있는지 확인한다. 없으면 중단한다.

### 2. 변경 범위 분석

- `git fetch origin main`으로 base를 최신화한다.
- `git log --oneline origin/main..HEAD`로 PR에 들어갈 커밋을 확인한다. 비어 있으면 "PR로 보낼 커밋이 없습니다"라고 보고하고 끝낸다.
- `git diff origin/main...HEAD --stat`과 필요한 파일의 `git diff origin/main...HEAD -- <파일>`로 실제 변경 내용을 읽는다. 커밋 메시지만 보고 쓰면 실제 변경과 어긋나기 쉽다.
- `gh pr list --head <현재 브랜치> --state open`으로 이미 열린 PR이 있는지 확인한다. 있으면 새로 만들지 말고 그 URL을 보고하고 끝낸다. 중복 PR을 만들지 않기 위해서다.

### 3. 제목과 본문 작성

언어: 사용자가 인자로 영어를 요청하면(`en`, `english`, "영문으로" 등) 영문, 그 외에는 한국어를 쓴다. 서브 에이전트는 되물을 수 없고, 이 프로젝트의 기본 언어가 한국어이기 때문이다. 제목과 본문은 같은 언어로 맞춘다.

제목: `type: 요약` 형식. type은 커밋 컨벤션과 같다(feat / fix / refactor / chore). 50자 안팎, 마침표 없음. 한국어는 `feat: 컴포넌트 카드에 코드 복사 버튼 추가`, 영문은 `feat: add copy button to component card`처럼 쓴다. 커밋이 하나면 그 메시지를 기반으로 하고, 여러 개면 전체를 대표하는 한 줄로 쓴다.

본문은 언어에 맞는 템플릿을 읽어 그 구조와 맨 끝의 서명 줄을 그대로 따른다.
- 한국어: `references/pr-template.ko.md`
- 영문: `references/pr-template.en.md`

변경 파일 목록은 diff에서 볼 수 있으므로 나열하지 않고, 리뷰어에게 필요한 "왜"와 확인 포인트를 쓴다.

테스트 항목은 추측으로 채우지 않는다. 필요하면 `bun run test`, `bun run lint`를 실행해 결과를 쓴다. 실패하면 실패 사실을 그대로 본문과 보고에 적는다.

### 4. push와 PR 생성

- 현재 브랜치를 `git push -u origin <브랜치>`로 push한다. `--force`는 쓰지 않는다. 거부되면 원인을 보고하고 중단한다.
- 본문은 heredoc 또는 임시 파일(`--body-file`)로 전달한다. 한 줄 `--body`로 넘기면 줄바꿈이 깨진다.
- `gh pr create --base main --head <브랜치> --title "<제목>" --body-file <파일>`로 생성한다. 임시 파일은 사용 후 지운다.
- 기본은 일반 PR이다. 사용자가 draft를 요청한 경우에만 `--draft`를 붙인다.

### 5. 최종 보고

사용자에게 전달되는 유일한 메시지이므로 한국어로 짧게 쓴다.

- 생성된 PR URL
- 제목과 포함된 커밋 수
- 미커밋 변경이 남아 있으면 그 사실
- 실행한 테스트 결과, 건너뛴 단계

## 하지 않는 것

- `main` 브랜치로 직접 push하지 않는다. `--force` push도 하지 않는다.
- 커밋을 만들거나 amend, reset, rebase를 하지 않는다. 코드를 수정하지 않는다. 문제를 발견하면 보고만 한다.
- `.env`, 키·토큰이 들어간 파일이 diff에 보이면 PR을 만들지 말고 해당 파일을 보고한다. 공개 저장소에서는 push 즉시 노출되기 때문이다.
- 이미 열린 PR이 있는 브랜치에 새 PR을 만들지 않는다.
