# vibecoding-harness — intent·증거·게이트·독립 review·로컬 지식을 잇는 작은 런타임

## 왜 있나

- 누구를 위한 무엇인가: 소비 프로젝트의 intent(원하는 결과와 범위), 증거, 개발 게이트, 독립 review, 검증된 로컬 지식을 연결하는 Codex·Claude Code 공용 런타임. 정본은 `knowledge/` OKF 문서다.
- 지금 상태: 개발 중. Codex·Claude Code 전체 live matrix(release install → selected root → native development → gates → K1 readback)는 README 기준 전부 `unverified`다.

## 구조

```
scripts/      harness.mjs(제품 명령) · release.mjs · install.mjs · check-harness.mjs · run-tests.mjs
knowledge/    release의 bundled defaults 정본(OKF 개념 문서 + index.md, log.md)
SKILL.md      얇은 공통 진입점
adapters/ profiles/ schemas/ templates/ checklists/ common/   런타임 부품
tests/        unit · integration · e2e (visual-matrix, native-live)
docs/         instructor-design-system.md, two-rater-check.md
manifest.json v0.json v0/
```

## 명령

|할 일|명령|
|---|---|
|설치|`npm ci --ignore-scripts` (CI 기준)|
|개발 실행|`node "$R/scripts/harness.mjs" init --project "$PROJECT" --json` (R = 선택된 release realpath)|
|구조 검사|`npm run check`|
|테스트|`npm test` (unit+integration). 개별: `npm run test:unit` · `npm run test:integration` · `npm run test:e2e` · `npm run test:visual` · `npm run test:native`|
|릴리스 빌드·검증|`node scripts/release.mjs build --source-root "$PWD" --output "$RELEASE"` → `node scripts/release.mjs validate --release-root "$RELEASE"`|
|배포|미확인 (README: 설치·runner·지식 승격은 commit/push/PR/deploy를 자동으로 하지 않는다)|

## 배포와 확인

- 어디에 도나: 배포 대상 미확인. `scripts/install.mjs` 가 release를 `--home` 격리 디렉터리 또는 `--personal` home에 설치한다.
- 자동/수동: CI(`.github/workflows/check.yml`)는 main push·PR에서 `npm run check`, `npm test` 만 돈다. 설치는 수동.
- 배포 확인: 설치 후 `--finalize` 가 `ready` 를 반환해야 활성화 검증 완료. `activation_pending` 은 검증 통과가 아니다.

## 이 저장소에서 승인이 필요한 일

- `node scripts/install.mjs ... --personal` — 사용자 personal home에 쓴다. 명시 선택일 때만.
- 소비 프로젝트에 대한 commit·push·PR·deploy, 원격 쓰기 — README가 별도 승인 없이는 하지 않는다고 규정.

## 하지 않는 것

- 빈 intent·가짜 승인으로 시작하지 않는다 — 입력이 비거나 scope 승인이 없으면 `draft`/`blocked` 에서 멈추는 계약이다.
- release 출력 디렉터리를 소스 안에 두지 않는다 — 미리 존재하지 않아야 한다(README).
- mock receipt·capability probe·`--help`/version 결과를 설치 검증이나 provider 지원의 증거로 쓰지 않는다 — README가 live matrix 증거로 인정하지 않는다.
- 기존 `AGENTS.md`·`CLAUDE.md`·사용자 지식을 덮어쓰지 않는다 — 설치 계약상 owner conflict면 중단.
- 소스 `knowledge/` 와 설치 후 learned knowledge `K` 를 섞지 않는다 — release가 링크를 `knowledge-default/` 로 다시 쓴다.
- 도구 부재·timeout·미실행을 pass로 보고하지 않는다 — `passed`/`failed`/`blocked`/`unverified`/`not_applicable` 은 서로 다른 상태다.

## 사고 이력

- `cdbf942` 실측일 헤더가 보지 않은 화면을 확인했다고 적고 있었다 → 확인하지 않은 것은 확인했다고 쓰지 않는다.
- `06ad4fd`→`7fed398` `--check` 왕복 검증용 임시 변경을 넣었다가 revert → 검사기 왕복 검증 변경은 남기지 않고 되돌린다.
