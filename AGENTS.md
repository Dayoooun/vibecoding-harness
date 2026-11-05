# vibecoding-harness — 말로 홈페이지를 만드는 수업의 지침 정본

## 왜 있나

- 누구를 위한 무엇인가: 수강생이 v0 또는 ChatGPT Sites 로 가게 홈페이지를 만들 때, 누가 하든 같은 구조와 같은 품질 하한선이 나오게 하는 지침 문서 묶음(README).
- 수강생 경로: `common/10-long-prompt.md` 를 채워 한 번에 붙여넣고, `checklists/common-5.md`(v0 는 `checklists/v0-2.md` 추가)로 채점한다.

## 구조

```
common/       도구 불변부 — 00-core.md(공통층 정본) · 10-long-prompt.md · 20-rules.md
checklists/   도구 불변부 — common-5.md · v0-2.md (항목별 재생성 프롬프트 포함)
v0/           도구 의존부 — 30-tech-layer.md (코드 규칙·디자인 토큰·애니메이션, v0 전용)
docs/         도구 의존부 — instructor-design-system.md(강사용) · two-rater-check.md
SKILL.md v0.json   도구 의존부(루트)
manifest.json      산출물 목록의 단일 원본. 검사기가 읽는다
scripts/check-harness.mjs   문서 형식 검사기
```

## 명령

|할 일|명령|
|---|---|
|설치|없음 (package.json·의존성 없음. Node 22 만 필요 — CI 기준)|
|형식 검사|`node scripts/check-harness.mjs`|
|본문 미집필 상태 검사|`node scripts/check-harness.mjs --skeleton` (구조·매니페스트만, 본문 검사 생략)|
|테스트|별도 테스트 없음. 위 검사기가 유일한 게이트|
|배포|없음 (지침 문서 레포)|

## 배포와 확인

- CI(`.github/workflows/check.yml`)는 main push·PR 에서 Node 22 로 `node scripts/check-harness.mjs` 만 돈다.
- 종료코드 0 = 통과, 1 = 실패. 경고(실측일 90일 경과 등)는 통과를 막지 않는다.

## 검사기가 막는 것 — 지침을 고치기 전에 읽는다

- `common/`·`checklists/` 에 기술층 누수 금지: 코드펜스, HEX 색상값, 치수 단위(px·rem·vh·vw), 기술 어휘(css·hover·animation 등), 한국어 우회 표현(페이드·호버·애니메이션 등). Sites 경로가 깨진다.
- `common/`·`v0/` 는 "~한다" 어투. "하세요·해주세요" 같은 사용자 조언 어투 금지.
- 수강생 경로(`common/`·`checklists/`)는 Design System·`v0.json`·`SKILL.md` 를 참조하지 않는다.
- 도구 의존부(`SKILL.md`·`v0.json`·`v0/`·`docs/`)는 `실측일` 헤더 필수. 90일 경고, 180일 실패.
- `manifest.json` 의 모든 path 가 실재해야 한다. git 추적 파일 합계 1MB 미만, 미디어 파일 0건.
- 본문 규격: 긴 프롬프트 2,000~4,000자, 짧은 규칙 5~8개·각 2줄 이하, 체크리스트 5+2 항목·재생성 프롬프트 1:1, 항목은 이진 술어로 끝나고 주관 표현 금지, `common/00-core.md` 에 역할 슬롯 6개.

## 이 저장소에서 승인이 필요한 일

- 지침 문구 변경의 병합 — 강의 진행과 직결되므로 임의 변경을 병합하지 않는다. PR 병합 여부는 강사가 판단한다(README 기여 절).

## 하지 않는 것

- 체크리스트 항목이 검사에 걸렸다고 검사기 술어 목록을 넓히지 않는다 — 항목을 고친다. 목록 변경은 항목 변경과 같은 커밋에 넣지 않고, 왜 기존 술어로 표현할 수 없는지 커밋 본문에 적는다(README).
- 정도를 묻는 술어(좋다·낫다·편하다)를 술어 목록에 넣지 않는다.
- 요금·사용 한도 숫자를 문서에 적지 않는다 — 공식 문서 링크로 보낸다(README).
- 코드 규칙·디자인 토큰·애니메이션 지시를 `v0/` 밖에 두지 않는다.

## 사고 이력

- `cdbf942` 실측일 헤더가 보지 않은 화면을 확인했다고 적고 있었다 → 확인하지 않은 것은 확인했다고 쓰지 않는다.
- `06ad4fd`→`7fed398` `--check` 왕복 검증용 임시 변경을 넣었다가 revert → 검사기 왕복 검증 변경은 남기지 않고 되돌린다.
