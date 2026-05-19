# Lidia 시트 운영 시스템 - 단계적 도입 가이드

> **대상**: 영업 에이전트 10명+, 빔블 교사 10명+ 운영하는 Lidia 본부장님과 매니저
> **목표**: 현재 단일 시트의 한계를 극복하고, 역할별 최적화된 운영 시스템으로 단계적 전환

---

## 📋 패키지 개요

이 패키지는 Google Sheets 운영을 **3단계 레벨로 점진적 고도화**하기 위한 완전한 자료 모음입니다.

```
Week 1-2  →  Level 1 (Google Sheets 기본 기능)
Week 3-6  →  Level 2 (역할별 시트 분리)
Week 7-12 →  Level 3 (Apps Script 자동화)
```

각 레벨은 **이전 레벨 위에 쌓이는 구조**이므로, 단계를 건너뛰지 마세요.

---

## 🗂️ 디렉토리 구조

```
Lidia-app/
├── README.md                     ← 이 파일 (전체 개요)
├── roadmap.md                    ← 12주 단계별 로드맵
│
├── level-1/                      ← Week 1-2: Google Sheets 기본
│   ├── README.md
│   ├── 01-dropdowns-validation.md     ← 드롭다운 + 입력 검증
│   ├── 02-conditional-formatting.md   ← 조건부 서식 (자동 색상)
│   ├── 03-d-day-formulas.md           ← D-Day 자동 계산
│   ├── 04-role-based-filters.md       ← 역할별 필터 뷰
│   └── 05-sheet-protection.md         ← 시트 보호 설정
│
├── level-2/                      ← Week 3-6: 역할별 시트 분리
│   ├── README.md
│   ├── 01-agent-view.md               ← 에이전트 전용 시트
│   ├── 02-teacher-view.md             ← 교사 전용 시트
│   ├── 03-manager-dashboard.md        ← 매니저 대시보드
│   └── 04-input-forms.md              ← 입력 폼 분리
│
├── level-3/                      ← Week 7-12: 자동화
│   ├── README.md
│   ├── setup-guide.md                 ← Apps Script 설치 가이드
│   └── scripts/
│       ├── notifications.gs           ← 자동 알림 (이메일/왓츠앱)
│       ├── auto-assignment.gs         ← 교사 자동 배정
│       ├── daily-summary.gs           ← 매일 요약 알림
│       └── monthly-report.gs          ← 월간 자동 리포트
│
└── templates/                    ← CSV 템플릿
    ├── tracker-template.csv           ← 메인 트래커 템플릿
    └── operations-guide.csv           ← 운영 가이드 템플릿
```

---

## 🚀 시작하기 (Quick Start)

### 1단계: 로드맵 확인
[`roadmap.md`](./roadmap.md)를 먼저 읽으세요. 12주 일정과 각 주차별 산출물이 정리되어 있어요.

### 2단계: Level 1 시작
[`level-1/README.md`](./level-1/README.md)로 이동해 5가지 기본 기능을 순서대로 적용하세요.
- 예상 소요 시간: 2-3시간
- 필요 권한: 시트 편집자

### 3단계: 운영하며 발견한 불편함 → Level 2
2주 운영 후 가장 불편한 부분부터 Level 2로 전환합니다.
- 가장 효과 큰 것: **매니저 대시보드** 또는 **에이전트 전용 시트**

### 4단계: 반복 작업 → Level 3 자동화
손이 가장 많이 가는 작업부터 Apps Script로 자동화합니다.
- 가장 효과 큰 것: **D-Day 자동 알림** 또는 **신규 신청 알림**

---

## ⚙️ 사전 준비 사항

### 필수
- [ ] Google 계정 (조직용 Workspace 권장)
- [ ] 기존 운영 시트 백업 (Sheets > 파일 > 사본 만들기)
- [ ] 팀원 이메일 리스트 (에이전트/교사/매니저)

### 권장
- [ ] 팀원별 역할 정의 (편집 가능 범위)
- [ ] 알림 채널 정리 (이메일 vs 왓츠앱)
- [ ] 월간 리포트 수신자 목록

---

## 📊 레벨별 효과 요약

| 항목 | Level 1 | Level 2 | Level 3 |
|---|---|---|---|
| **구축 시간** | 2-3시간 | 1-2주 | 2-4주 |
| **학습 부담** | 낮음 | 중간 | 매니저 1명 학습 |
| **실수 감소** | 30% ↓ | 60% ↓ | 90% ↓ |
| **확인 시간** | 50% ↓ | 80% ↓ | 95% ↓ |
| **확장성** | ~20명 | ~50명 | 100명+ |

---

## 🆘 트러블슈팅

### "수식이 작동하지 않아요"
→ [`level-1/03-d-day-formulas.md`](./level-1/03-d-day-formulas.md)의 "자주 발생하는 오류" 섹션 확인

### "Apps Script 권한 오류"
→ [`level-3/setup-guide.md`](./level-3/setup-guide.md)의 "권한 설정" 섹션 확인

### "필터 뷰가 다른 사람에게도 보여요"
→ [`level-1/04-role-based-filters.md`](./level-1/04-role-based-filters.md)의 "개인 필터 vs 공유 필터" 섹션 확인

---

## 📞 다음 단계

각 레벨 적용 후 다음을 점검하세요:

1. **Level 1 완료 체크리스트**: [`level-1/README.md`](./level-1/README.md) 하단
2. **Level 2 완료 체크리스트**: [`level-2/README.md`](./level-2/README.md) 하단
3. **Level 3 완료 체크리스트**: [`level-3/README.md`](./level-3/README.md) 하단

준비됐다면 **[로드맵](./roadmap.md)**부터 확인하세요!
