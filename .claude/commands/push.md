---
description: 변경사항을 커밋하고 GitHub에 푸시 (Vercel 자동 배포)
argument-hint: [커밋 메시지 (선택)]
allowed-tools: Bash(git add:*), Bash(git commit:*), Bash(git push:*), Bash(git status:*), Bash(git diff:*)
---

프로젝트 폴더의 변경사항을 GitHub에 올려줘. 순서:

1. `git add -A`
2. 스테이징된 변경이 없으면(`git diff --cached --quiet`) "변경사항 없음"이라고만 알리고 종료.
3. 변경이 있으면 커밋한다. 커밋 메시지는:
   - `$ARGUMENTS` 가 있으면 그대로 사용
   - 없으면 `auto: <오늘 날짜 시간>` 형식으로 자동 생성
4. `git push`
5. 결과(커밋 해시 / 푸시 완료 여부)를 한 줄로 보고.

불필요한 설명 없이 명령만 실행하고 결과만 간단히 알려줘.
