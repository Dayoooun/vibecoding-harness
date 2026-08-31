# 변경 이력

강의록은 지침의 특정 태그를 기준으로 쓰인다. 지침을 고치면 여기에 적고 태그를 올린다. 강의를 다시 열 때 어느 지침으로 진행했는지 이 문서로 대조한다.

형식: [Keep a Changelog](https://keepachangelog.com/ko/1.1.0/) · 버전: [유의적 버전](https://semver.org/lang/ko/)

## [Unreleased]

### 추가
- 레포 골격 — `README.md`, `LICENSE`(MIT), `manifest.json`, `SKILL.md`, `v0.json`, `.gitignore`/`.gitattributes`, CI 워크플로
- `scripts/check-harness.mjs` — 문서 형식 검사기. 매니페스트 정합, 레포 경량성, 기술층 누수, 어투, 참조 그래프, 실측 신선도, 본문 분량·구조·형식 3요소를 검사한다
- `common/`, `v0/`, `checklists/` 골격

### 미완
- `common/00-core.md` 공통층 정본 (Phase 2)
- `common/10-long-prompt.md`, `common/20-rules.md`, `v0/30-tech-layer.md` (Phase 3)
- `checklists/common-5.md`, `checklists/v0-2.md` (Phase 4)
- `docs/instructor-design-system.md` — v0 실계정 spike 결과 반영 후 확정 (Phase 5)
