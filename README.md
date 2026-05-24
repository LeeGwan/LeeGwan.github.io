# Flect Security Lab

영어(메인) + 한국어 이중 언어 보안 기술 블로그입니다. Jekyll로 만들어졌고,
GitHub Pages에 올리면 무료로 운영됩니다. 글은 마크다운 파일만 쓰면 됩니다.

---

## 1. 가장 빠른 시작 (컴퓨터 설치 없이, GitHub만으로)

미리보기 없이 그냥 바로 인터넷에 띄우고 싶다면 이 방법이 제일 쉽습니다.

1. GitHub 가입 후, 새 저장소(repository)를 만듭니다.
   - 블로그 주소를 `아이디.github.io` 로 쓰려면 → 저장소 이름을 **`아이디.github.io`** 로
     (예: 깃허브 아이디가 `flect` 면 저장소 이름 `flect.github.io`)
2. 이 폴더 안의 **모든 파일**을 그 저장소에 업로드합니다.
   - 저장소 페이지 → `Add file` → `Upload files` → 파일 전부 끌어다 놓기 → `Commit`
3. 저장소 → `Settings` → `Pages` → Source를 `Deploy from a branch`,
   Branch를 `main` / `(root)` 으로 두고 저장.
4. 1~2분 뒤 `https://아이디.github.io` 로 접속하면 블로그가 보입니다.

> 저장소 이름을 `아이디.github.io` 가 아닌 다른 이름(예: `blog`)으로 했다면,
> `_config.yml` 의 `baseurl` 을 `"/blog"` 처럼 저장소 이름으로 바꿔야 합니다.

### 먼저 바꿔야 할 곳 (`_config.yml`)
- `github_username` → 본인 GitHub 아이디
- `email` → 본인 이메일
- (필요시) `baseurl`

---

## 2. 내 컴퓨터에서 미리보기 (선택, 권장)

글을 올리기 전에 결과를 미리 보고 싶을 때 씁니다. Ruby 설치가 한 번 필요합니다.

### 설치
- **Windows**: <https://rubyinstaller.org> 에서 "Ruby+Devkit" 최신 버전 설치
  (설치 마지막에 뜨는 검은 창에서 엔터 눌러 `ridk install`까지 완료)
- **macOS**: 터미널에서 `brew install ruby` (Homebrew 필요)
- 설치 확인: 터미널에 `ruby -v` 입력 시 버전이 나오면 성공

### 실행 (이 폴더에서)
```bash
gem install bundler
bundle install
bundle exec jekyll serve
```
그러면 터미널에 `http://127.0.0.1:4000` 주소가 뜹니다. 브라우저로 열면 미리보기 끝.
글을 고치고 저장하면 자동으로 다시 빌드됩니다. (한국어는 `http://127.0.0.1:4000/ko/`)

종료는 터미널에서 `Ctrl + C`.

---

## 3. 새 글 쓰는 법 (핵심!)

글 하나 = **영어 파일 1개 + 한국어 파일 1개**. 두 파일에 **같은 `ref`** 를 넣는 게
가장 중요합니다. 그래야 우상단 언어 버튼이 두 글을 짝지어 줍니다.

### (1) 영어 글 — `_en/` 폴더에 새 파일
파일 이름 예시: `_en/2026-06-01-my-first-analysis.md`
```markdown
---
title: "My First Analysis"
date: 2026-06-01
category: "Windows Internals"   # 사이드바에서 묶이는 그룹 이름
weight: 2                        # 그룹 안 정렬 순서(작을수록 위)
ref: my-first-analysis           # ★ 한글판과 똑같이!
tags: [Windows, Reversing]
summary: "One-line summary shown under the title."
---

* TOC
{:toc}

## [0x00] Overview

Write your content in Markdown here.
```

### (2) 한국어 글 — `_ko/` 폴더에 새 파일
파일 이름 예시: `_ko/2026-06-01-my-first-analysis.md`
```markdown
---
title: "나의 첫 분석"
date: 2026-06-01
category: "Windows Internals"
weight: 2
ref: my-first-analysis           # ★ 영어판과 똑같이!
tags: [Windows, Reversing]
summary: "제목 아래 보이는 한 줄 요약."
---

* TOC
{:toc}

## [0x00] 개요

여기에 마크다운으로 내용을 씁니다.
```

### 머리말(front matter) 항목 설명
| 항목 | 뜻 |
|------|----|
| `title` | 글 제목 |
| `date` | 작성일 (`YYYY-MM-DD`) — 목록 정렬에 사용 |
| `category` | 사이드바에서 묶일 그룹 이름 (자유롭게) |
| `weight` | 같은 그룹 안에서의 순서 (숫자) |
| `ref` | **번역 짝 식별자. 영/한 같은 값.** 언어 토글이 이걸로 연결 |
| `tags` | 태그 목록. `Tags` 페이지에 자동 분류됨 |
| `summary` | 제목 아래/목록에 보이는 한 줄 설명 |

> `layout` 과 `lang` 은 폴더(`_en`/`_ko`)에 따라 자동으로 붙으므로 안 써도 됩니다.

### 마크다운 팁
- 인라인 코드: `` `IoAllocateMdl` `` → `IoAllocateMdl`
- 코드 블록: 백틱 3개로 감싸고 언어 지정 (` ```c `, ` ```python ` 등) → 색칠 자동
- 목차: 글 맨 위 `* TOC` + `{:toc}` 두 줄이면 `##` 제목들로 목차 자동 생성
- 이미지: `assets/img/` 에 그림을 넣고 `![설명](/assets/img/그림.png)`

---

## 4. 폴더 구조 한눈에

```
_config.yml          전역 설정 (제목/아이디/baseurl 등)
_data/translations.yml  버튼·라벨 번역
_en/                 영어 글들 (.md)
_ko/                 한국어 글들 (.md)
_layouts/            페이지 뼈대 (보통 안 건드림)
_includes/           네비/사이드바/푸터 조각 (보통 안 건드림)
assets/css/          디자인 (색을 바꾸려면 style.css 맨 위 :root)
assets/img/          이미지 넣는 곳
index.html / ko/index.html   영/한 홈
about.md  / ko/about.md      영/한 소개
tags.html / ko/tags.html     영/한 태그 모음
```

색을 바꾸고 싶으면 `assets/css/style.css` 맨 위의 `:root` 안 색상 값만 고치면 됩니다.
(`--accent` 가 포인트 컬러, `--nav` 가 상단 바 색입니다.)

---

## 5. 자주 막히는 곳
- **사이트는 떴는데 디자인이 깨짐** → `_config.yml` 의 `baseurl` 이 저장소 이름과
  안 맞는 경우입니다. `아이디.github.io` 저장소면 `baseurl: ""`, 그 외엔 `"/저장소이름"`.
- **언어 버튼을 눌렀는데 홈으로만 감** → 두 글의 `ref` 값이 서로 다른 경우입니다. 똑같이 맞추세요.
- **글이 사이드바/목록에 안 보임** → 파일이 `_en` 또는 `_ko` 폴더 안에 있는지, 머리말
  `---` 이 위아래로 정확히 있는지 확인하세요.
