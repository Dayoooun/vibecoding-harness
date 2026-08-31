---
name: vibecoding-harness
description: 소상공인 가게 홈페이지를 만들 때 쓰는 지침. 결과물의 구조와 품질 하한선을 고정한다.
실측일: 2026-08-29
확인 계정: 없음 (공식 문서 기준 작성. 실계정 확인 전이다)
확인 화면: v0.app/docs/design-systems-2 (SKILL.md·v0.json 스키마), v0.app/docs/instructions
미검증: 이 파일이 v0 임포트에서 실제로 어떻게 읽히는지는 확인하지 않았다. docs/instructor-design-system.md 절차 B 가 그것을 재는 spike 다
metadata:
  v0.kind: design-system
---

# 바이브코딩 지침 하네스

가게 홈페이지를 만든다. 아래 파일을 순서대로 읽고 그대로 따른다.

## 반드시 읽는 것

1. `common/00-core.md` — 결과물의 역할 구조와 정보위계. **이것이 정본이다.**
2. `common/20-rules.md` — 항상 적용하는 짧은 규칙.
3. `checklists/common-5.md` — 결과물이 만족해야 하는 최소 조건 5가지.

## v0 에서만 추가로 읽는 것

4. `v0/30-tech-layer.md` — 코드 규칙·디자인 토큰·애니메이션.
5. `checklists/v0-2.md` — v0 결과물에만 적용하는 추가 조건 2가지.

## 적용 순서

`common/00-core.md` 의 역할 구조를 먼저 확정하고, 그 구조를 채우는 방식으로 만든다. 구조를 정하기 전에 화면을 그리지 않는다.

`common/` 에는 코드·색상값·애니메이션 지시가 없다. 그것은 `v0/30-tech-layer.md` 에만 있고, 코드를 노출하지 않는 도구에서는 적용하지 않는다.

결과물을 낸 뒤 `checklists/common-5.md` 의 5항목을 스스로 점검한다. 미달 항목이 있으면 그 항목에 적힌 재생성 프롬프트를 적용한다.
