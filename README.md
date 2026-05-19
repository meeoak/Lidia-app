# Lidia 운영 시스템

영업 에이전트와 빔블 교사를 위한 통합 운영 SaaS.
보류된 학부모 케이스를 신청부터 재클로징까지 한 곳에서 추적합니다.

## ✨ 주요 기능

- **역할 기반 접근**: 본부장 / 매니저 / 에이전트 / 교사 각각의 최적화된 뷰
- **케이스 추적**: 신청 → 매니저 승인 → 교사 배정 → 수업 → 재클로징
- **D-Day 자동 계산**: 재클로징 3일 데드라인 카운트다운
- **권한 분리 (RLS)**: 에이전트는 본인 케이스, 교사는 배정된 케이스만 조회

## 🛠️ 기술 스택

- **프레임워크**: Next.js 14 (App Router) + TypeScript
- **DB / 인증**: Supabase (PostgreSQL + Auth + RLS)
- **UI**: Tailwind CSS + 자체 컴포넌트
- **배포**: Vercel 권장

## 🚀 시작하기

### 1. 저장소 클론 후 의존성 설치

```bash
git clone <repo-url>
cd Lidia-app
npm install
```

### 2. Supabase 프로젝트 생성

1. [supabase.com](https://supabase.com)에서 새 프로젝트 생성
2. **Project Settings → API**에서 URL과 anon key 복사

### 3. 환경 변수 설정

```bash
cp .env.example .env.local
```

`.env.local`을 열어 본인 Supabase 정보로 채웁니다:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### 4. 데이터베이스 마이그레이션

Supabase Dashboard → **SQL Editor**에서 순서대로 실행:

```
supabase/migrations/001_schema.sql   ← 테이블, 트리거, 뷰
supabase/migrations/002_rls.sql      ← Row Level Security 정책
supabase/seed.sql                    ← (선택) 데모 데이터
```

### 5. 개발 서버 실행

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000) 접속

### 6. 첫 사용자 가입

- `/signup`에서 회원가입 시 역할 선택
- 데모 시 매니저/본부장으로 가입해서 권한 확인
- 실제 운영 시 매니저/본부장은 Supabase Dashboard에서 수동 부여

## 📁 프로젝트 구조

```
app/
├── (auth)/              ← 로그인/회원가입
├── (app)/               ← 인증 필요 영역
│   ├── dashboard/       ← 역할별 대시보드 (자동 분기)
│   │   ├── manager-dashboard.tsx
│   │   ├── agent-dashboard.tsx
│   │   └── teacher-dashboard.tsx
│   └── cases/           ← 케이스 관리
│       ├── new/         ← 신규 등록 폼
│       └── [id]/        ← 상세 + 매니저/교사 액션
├── layout.tsx
├── page.tsx             ← 랜딩 페이지
└── globals.css

components/
├── ui/                  ← 기본 UI (button, input, card 등)
└── sidebar.tsx          ← 사이드바 + 모바일 네비

lib/
├── supabase/            ← Supabase 클라이언트
├── types.ts             ← TypeScript 타입 + enum 매핑
└── utils.ts             ← cn, formatDate, calculateDDay

supabase/
├── migrations/
│   ├── 001_schema.sql   ← 스키마
│   └── 002_rls.sql      ← RLS 정책
└── seed.sql             ← 데모 데이터

docs/                    ← 운영 가이드 (Sheets 기반 단계적 도입)
├── README.md
├── roadmap.md
├── level-1/             ← Sheets 기본 기능
├── level-2/             ← 역할별 시트 분리
├── level-3/             ← Apps Script 자동화
└── templates/
```

## 👤 역할별 권한

| 액션 | 본부장 | 매니저 | 에이전트 | 교사 |
|---|---|---|---|---|
| 전체 케이스 조회 | ✅ | ✅ | 본인만 | 배정만 |
| 케이스 생성 | ✅ | ✅ | ✅ | ❌ |
| 승인/반려 | ✅ | ✅ | ❌ | ❌ |
| 교사 배정 | ✅ | ✅ | ❌ | ❌ |
| 수업 결과 입력 | ✅ | ✅ | ❌ | 배정만 |

권한은 Supabase RLS로 강제됩니다 (앱 레벨이 아닌 DB 레벨).

## 🌐 Vercel 배포

```bash
# 1. Vercel CLI 설치
npm i -g vercel

# 2. 배포
vercel

# 3. 환경 변수 입력 (CLI 안내에 따라)
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

또는 Vercel Dashboard에서 GitHub 연동 → 자동 배포.

## 📚 운영 가이드

[docs/](./docs)에 Google Sheets 기반 단계적 도입 가이드가 있습니다.
웹앱과 별개로, 작은 팀에서 Sheets로 시작하고 싶을 때 참고하세요.

## 🧪 데모 시나리오

1. **본부장**으로 회원가입
2. **에이전트**로 또 다른 계정 회원가입 (다른 브라우저/시크릿)
3. 에이전트로: 신규 케이스 등록
4. 본부장으로: 케이스 승인 + 교사 배정
5. **교사**로 또 다른 계정 회원가입
6. 교사로: 본인 일정 확인 + 수업 결과 입력

## 📜 라이선스

Proprietary. 내부 운영 전용.
