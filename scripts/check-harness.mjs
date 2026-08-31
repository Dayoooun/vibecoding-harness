#!/usr/bin/env node
/**
 * 지침 문서의 형식을 검사한다. 수강생 산출물은 검사하지 않는다.
 *
 * 산출물 검증은 checklists/ 의 7항목이 전담한다. 이 스크립트가 잡는 것은
 * "지침 문서가 규격대로 쓰였는가"뿐이다. 둘은 다른 층위다.
 *
 *   node scripts/check-harness.mjs            # 전체 검사
 *   node scripts/check-harness.mjs --skeleton # 본문 미집필 상태 검사(구조·매니페스트만)
 *
 * 종료코드 0 = 통과, 1 = 실패.
 */
import { readFileSync, existsSync, statSync, readdirSync } from "node:fs";
import { join, dirname, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SKELETON = process.argv.includes("--skeleton");

const errors = [];
const warnings = [];
const fail = (m) => errors.push(m);
const warn = (m) => warnings.push(m);

const read = (rel) => readFileSync(join(ROOT, rel), "utf8");
const has = (rel) => existsSync(join(ROOT, rel));

/** 마크다운 마크업을 걷어낸 본문 글자수. 분량 검사는 이 값으로 한다. */
function plainLength(md) {
  return md
    .replace(/^---\n[\s\S]*?\n---\n/, "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/[*_`>|-]/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\s+/g, "")
    .length;
}

/** 프론트매터 블록만 떼어낸다. 실측일 헤더 검사용. */
function frontmatter(md) {
  const m = md.match(/^---\n([\s\S]*?)\n---/);
  return m ? m[1] : null;
}

/** 파일을 재귀로 모은다. */
function walk(rel) {
  const abs = join(ROOT, rel);
  if (!existsSync(abs)) return [];
  return readdirSync(abs, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(join(rel, e.name)) : [join(rel, e.name)],
  );
}

// ─────────────────────────────────────────────────────────────
// 1. 매니페스트 정합 — 항목의 path 가 전부 실재해야 한다.
//    선례(build-gpts-instructions.cjs)는 없으면 경고하고 continue 했다.
//    원격 fetch 경로에서 그 동작은 네트워크 장애를 조용한 누락으로 바꾼다.
//    여기서는 실패한다.
// ─────────────────────────────────────────────────────────────
let manifest = null;
if (!has("manifest.json")) {
  fail("manifest.json 이 없다");
} else {
  try {
    manifest = JSON.parse(read("manifest.json"));
  } catch (e) {
    fail(`manifest.json 파싱 실패: ${e.message}`);
  }
}

if (manifest) {
  if (!Array.isArray(manifest.items) || manifest.items.length === 0) {
    fail("manifest.json 의 items 가 비어 있다");
  } else {
    const seen = new Set();
    for (const it of manifest.items) {
      for (const k of ["id", "path", "kind", "title", "desc"]) {
        if (!it?.[k]) fail(`manifest 항목에 ${k} 가 없다: ${JSON.stringify(it)}`);
      }
      if (it?.id) {
        if (seen.has(it.id)) fail(`manifest id 중복: ${it.id}`);
        seen.add(it.id);
      }
      if (it?.path && !has(it.path)) fail(`manifest 가 가리키는 파일이 없다: ${it.path}`);
    }
  }
}

// ─────────────────────────────────────────────────────────────
// 2. 레포 경량성 — git 추적 파일 합계 1MB 미만, 미디어 0건.
//    .git 은 제외한다(du 는 .git 을 포함해 판정이 흔들린다).
// ─────────────────────────────────────────────────────────────
const MEDIA = /\.(png|jpe?g|webp|gif|mp4|mov|pdf|zip|ico|woff2?|ttf)$/i;
try {
  const tracked = execFileSync("git", ["ls-files", "-z"], { cwd: ROOT, encoding: "utf8" })
    .split("\0")
    .filter(Boolean);
  if (tracked.length > 0) {
    let total = 0;
    for (const f of tracked) {
      if (MEDIA.test(f)) fail(`미디어 파일이 추적되고 있다: ${f}`);
      const abs = join(ROOT, f);
      if (existsSync(abs)) total += statSync(abs).size;
    }
    if (total >= 1024 * 1024) {
      fail(`추적 파일 합계가 1MB 이상이다: ${(total / 1024).toFixed(1)}KB`);
    }
  }
} catch {
  warn("git ls-files 를 실행할 수 없어 경량성 검사를 건너뛴다");
}

// ─────────────────────────────────────────────────────────────
// 3. 기술층 누수 — common/ 과 checklists/ 에 코드·색상·기술 어휘가 없어야 한다.
//    ChatGPT Sites 는 코드를 노출하지 않으므로 여기 섞이면 그 경로가 깨진다.
//    checklists/ 를 포함하는 이유: 재생성 프롬프트가 두 도구 모두에서 성립해야 한다.
// ─────────────────────────────────────────────────────────────
const TECH_EN = [
  "animation", "transition", "keyframes", "framer", "tailwind",
  "css", "flex", "grid-template", "hover", "opacity", "z-index",
  "viewport", "breakpoint", "component", "props",
];
// px·rem 은 premium·remind 같은 단어에 걸리므로 단어경계 또는 숫자 인접일 때만 본다.
const TECH_UNIT = /(?<![A-Za-z])\d+\s?(px|rem|vh|vw)(?![A-Za-z])/i;
const HEX = /#[0-9a-fA-F]{3,8}\b/;
const FENCE = /^\s*```/m;
// 한국어 누수 — 영문 어휘를 피해 우회하는 경우를 잡는다.
const TECH_KO = [
  "부드럽게 나타", "서서히 나타", "페이드", "그림자를", "모서리를 둥글",
  "둥근 모서리", "여백을 16", "여백을 24", "애니메이션", "전환 효과",
  "호버", "그라데이션", "트랜지션",
];
const TONE_KO = ["하세요", "해두세요", "해보세요", "하십시오", "해주세요"];

function checkLeak(rel) {
  if (!has(rel)) return;
  const md = read(rel);
  const body = md.replace(/^---\n[\s\S]*?\n---\n/, "");

  if (FENCE.test(body)) fail(`${rel}: 코드펜스가 있다 (기술층 누수)`);
  if (HEX.test(body)) fail(`${rel}: HEX 색상값이 있다 (기술층 누수)`);
  const unit = body.match(TECH_UNIT);
  if (unit) fail(`${rel}: 치수 단위가 있다 — "${unit[0]}" (기술층 누수)`);

  const lower = body.toLowerCase();
  for (const w of TECH_EN) {
    const re = new RegExp(`(?<![a-z])${w}(?![a-z])`, "i");
    if (re.test(lower)) fail(`${rel}: 기술 어휘 "${w}" 가 있다 (기술층 누수)`);
  }
  for (const w of TECH_KO) {
    if (body.includes(w)) fail(`${rel}: 한국어 기술 표현 "${w}" 가 있다 (기술층 누수)`);
  }
}

const commonFiles = walk("common").filter((f) => f.endsWith(".md"));
const checklistFiles = walk("checklists").filter((f) => f.endsWith(".md"));
for (const f of [...commonFiles, ...checklistFiles]) checkLeak(f);

// ─────────────────────────────────────────────────────────────
// 4. 어투 — 지침은 에이전트 행동 규칙이다.
//    "~하세요" 는 사람 조언이라 에이전트가 사용자에게 그대로 읊는다.
//    근거: 강의 레포 docs/gpts/README.md 판별법.
//    checklists/ 는 사람이 읽는 문서이므로 대상이 아니다.
// ─────────────────────────────────────────────────────────────
for (const f of [...commonFiles, ...walk("v0").filter((x) => x.endsWith(".md"))]) {
  const body = read(f).replace(/^---\n[\s\S]*?\n---\n/, "");
  for (const w of TONE_KO) {
    if (body.includes(w)) fail(`${f}: 사용자 조언 어투 "${w}" 가 있다 — "~한다" 로 쓴다`);
  }
}

// ─────────────────────────────────────────────────────────────
// 5. 참조 그래프 — 수강생 경로가 Design System 을 참조하지 않아야 한다.
//    강사 보너스 경로가 실패해도 수강생이 영향받지 않음을 문장이 아니라
//    참조 0건으로 증명한다.
// ─────────────────────────────────────────────────────────────
const DS_REFS = ["design system", "design-system", "v0.json", "SKILL.md", "디자인 시스템"];
for (const f of [...commonFiles, ...checklistFiles]) {
  const body = read(f);
  for (const w of DS_REFS) {
    if (body.toLowerCase().includes(w.toLowerCase())) {
      fail(`${f}: 수강생 경로가 강사 전용 자산 "${w}" 를 참조한다`);
    }
  }
}

// ─────────────────────────────────────────────────────────────
// 6. 실측 신선도 — 도구 의존부는 화면이 바뀌면 삭는다.
//    90일 경고 / 180일 실패. v0·Sites 모두 분기 단위로 UI 가 바뀐 이력이 있어
//    한 분기를 경고, 두 분기를 실패로 둔다.
// ─────────────────────────────────────────────────────────────
const DATED = [
  "SKILL.md",
  "v0.json",
  ...walk("v0").filter((f) => f.endsWith(".md")),
  ...walk("docs").filter((f) => f.endsWith(".md")),
];
const DAY = 86400000;
for (const f of DATED) {
  if (!has(f)) continue;
  const raw = read(f);
  const m = raw.match(/실측일["\s:]+(\d{4}-\d{2}-\d{2})/);
  if (!m) {
    fail(`${f}: 실측일 헤더가 없다 (도구 의존부는 필수)`);
    continue;
  }
  const age = (Date.now() - new Date(m[1]).getTime()) / DAY;
  if (age > 180) fail(`${f}: 실측일이 ${Math.floor(age)}일 지났다 (180일 초과)`);
  else if (age > 90) warn(`${f}: 실측일이 ${Math.floor(age)}일 지났다 (90일 경과 — 재확인 권장)`);
}

// ─────────────────────────────────────────────────────────────
// 이하 본문 검사. --skeleton 에서는 건너뛴다.
// ─────────────────────────────────────────────────────────────
if (!SKELETON) {
  // 7. 긴 프롬프트 분량 — 2,000~4,000자.
  if (has("common/10-long-prompt.md")) {
    const n = plainLength(read("common/10-long-prompt.md"));
    if (n < 2000 || n > 4000) {
      fail(`common/10-long-prompt.md: 본문 ${n}자 — 2,000~4,000자여야 한다`);
    }
  }

  // 8. 짧은 규칙 — 최상위 불릿 5~8개, 각 2줄 이하.
  if (has("common/20-rules.md")) {
    const body = read("common/20-rules.md").replace(/^---\n[\s\S]*?\n---\n/, "");
    const blocks = body.split(/\n(?=- )/).filter((b) => b.trim().startsWith("- "));
    if (blocks.length < 5 || blocks.length > 8) {
      fail(`common/20-rules.md: 규칙 ${blocks.length}개 — 5~8개여야 한다`);
    }
    blocks.forEach((b, i) => {
      const lines = b.trim().split("\n").filter((l) => l.trim());
      if (lines.length > 2) fail(`common/20-rules.md: 규칙 ${i + 1}이 ${lines.length}줄 — 2줄 이하여야 한다`);
    });
  }

  // 9. 체크리스트 구조 — 2파일, 5+2 항목, 재생성 프롬프트 1:1.
  //    항목은 `### N.` 헤딩, 재생성 프롬프트는 그 아래 인용 블록으로 센다.
  const CL = [
    { file: "checklists/common-5.md", want: 5 },
    { file: "checklists/v0-2.md", want: 2 },
  ];
  for (const { file, want } of CL) {
    if (!has(file)) { fail(`${file} 이 없다`); continue; }
    const body = read(file);
    const items = [...body.matchAll(/^###\s+\d+\.\s*(.+)$/gm)];
    if (items.length !== want) {
      fail(`${file}: 항목 ${items.length}개 — ${want}개여야 한다`);
    }
    const regen = [...body.matchAll(/^>\s*재생성 프롬프트/gm)];
    if (regen.length !== items.length) {
      fail(`${file}: 항목 ${items.length}개인데 재생성 프롬프트 ${regen.length}개 — 1:1 이어야 한다`);
    }

    // 10. 항목 형식 3요소 — 관찰 위치 + 관찰 대상 + 이진 술어.
    //     술어 종결로 판정한다. "보기 좋다" 는 여기서 걸린다.
    //     목록은 닫혀 있다. 새 술어가 필요하면 여기 추가하되,
    //     정도를 묻는 말(좋다/낫다/편하다)은 넣지 않는다 — 그걸 넣는 순간
    //     이 검사는 아무것도 걸러내지 못한다.
    const PREDICATE = /(보인다|보이지 않는다|나타난다|나타나지 않는다|있다|없다|이상이다|일치한다|들어온다|들어오지 않는다|생기지 않는다|적혀 있다|열린다|걸린다|걸리지 않는다|늘어나지 않는다|이어진다|이어지지 않는다|바뀐다|바뀌지 않는다)\.?\s*$/;
    for (const [, text] of items) {
      if (!PREDICATE.test(text.trim())) {
        fail(`${file}: 항목이 이진 술어로 끝나지 않는다 — "${text.trim()}"`);
      }
    }

    // 11. 주관 표현 블랙리스트 (병존. 단독으로는 불충분하다)
    const SUBJ = ["자연스럽", "예쁘", "깔끔", "세련", "멋지", "감각적", "고급스", "보기 좋", "어울린", "조화롭"];
    for (const w of SUBJ) {
      if (body.includes(w)) fail(`${file}: 주관 표현 "${w}" 가 있다`);
    }
  }

  // 12. Sites 합격 규칙 문장 — 어느 항목까지 채점하는지가 문서에 있어야 한다.
  if (has("checklists/common-5.md")) {
    const body = read("checklists/common-5.md");
    if (!/Sites/.test(body) || !/5항목/.test(body)) {
      fail("checklists/common-5.md: 도구별 합격 규칙 문장이 없다 (Sites 는 5항목만으로 판정)");
    }
  }

  // 13. 역할 슬롯 목록 — 공통층이 구조를 사전 지시해야 AC-13 판정이 성립한다.
  if (has("common/00-core.md")) {
    const body = read("common/00-core.md");
    const ROLES = ["히어로", "소개", "제공목록", "신뢰요소", "위치", "연락"];
    const missing = ROLES.filter((r) => !body.includes(r));
    if (missing.length) fail(`common/00-core.md: 역할 슬롯 누락 — ${missing.join(", ")}`);
  }
}

// ─────────────────────────────────────────────────────────────
for (const w of warnings) console.log(`⚠️  ${w}`);
if (errors.length) {
  for (const e of errors) console.log(`❌ ${e}`);
  console.log(`\n실패 ${errors.length}건${SKELETON ? " (--skeleton 모드)" : ""}`);
  process.exit(1);
}
console.log(`✅ 통과${SKELETON ? " (--skeleton 모드 — 본문 검사는 건너뜀)" : ""}${warnings.length ? ` · 경고 ${warnings.length}건` : ""}`);
