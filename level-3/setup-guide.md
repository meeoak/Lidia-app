# Level 3 - Setup Guide: Apps Script 환경 설정

> **목표**: Level 3 스크립트 적용 전 사전 준비
> **소요 시간**: 2시간
> **이 가이드 완료 후**: 모든 스크립트 적용 가능 상태

---

## 📋 사전 준비 체크리스트

시작 전 다음을 준비하세요:

- [ ] Google Workspace 또는 일반 Gmail 계정
- [ ] 운영 시트의 편집자 권한
- [ ] 매니저/본부장 이메일 주소 리스트
- [ ] 시트 URL 또는 ID

---

## 🛠️ Step 1: Apps Script 프로젝트 생성

### 1-1. 시트에서 Apps Script 열기

1. Google Sheets에서 운영 시트 열기
2. **확장 프로그램 → Apps Script**
3. 새 탭에 Apps Script 편집기 열림

### 1-2. 프로젝트 이름 설정

1. 좌측 상단 "제목 없는 프로젝트" 클릭
2. 새 이름 입력: `Lidia 운영 자동화`
3. 저장 (Ctrl+S)

### 1-3. 기본 파일 정리

기본으로 생성된 `Code.gs` 파일은 그대로 두고, 각 기능별로 새 파일 생성:

```
좌측 + 버튼 → 스크립트
파일명:
- notifications      (알림)
- daily-summary      (매일 요약)
- auto-assignment    (교사 배정)
- monthly-report     (월간 리포트)
- config             (공통 설정) ← 가장 먼저 생성
- utils              (유틸 함수)
```

---

## 🛠️ Step 2: 공통 설정 파일 (config.gs)

### 2-1. config.gs 생성

좌측 `+ 스크립트` → 이름: `config`

### 2-2. 다음 코드 입력

```javascript
/**
 * Lidia 운영 자동화 - 공통 설정
 *
 * 모든 ID와 이메일을 이 파일에서 관리합니다.
 * 다른 파일에서는 CONFIG.XXX 형태로 참조.
 */

const CONFIG = {
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 시트 정보
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  // 메인 운영 시트 ID
  // URL: https://docs.google.com/spreadsheets/d/{여기가_시트_ID}/edit
  SPREADSHEET_ID: "여기에_시트_ID_입력",

  // 시트 이름들
  SHEETS: {
    MAIN_TRACKER: "메인트래커",
    AGENT_MASTER: "에이전트마스터",
    TEACHER_MASTER: "교사마스터",
    OPTION_MASTER: "옵션마스터",
    MANAGER_DASHBOARD: "매니저대시보드",
    FORM_NEW_CASE: "폼 응답 1",
    FORM_LESSON_RESULT: "폼 응답 2",
    FORM_RECLOSE: "폼 응답 3",
    NOTIFICATION_LOG: "알림로그",
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 이메일 설정
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  EMAILS: {
    HEAD: "본부장@lidia.com",
    MANAGER: "매니저@lidia.com",
    BACKUP_MANAGER: "백업매니저@lidia.com",

    // 발신자 표시
    FROM_NAME: "Lidia 자동화",
    REPLY_TO: "noreply@lidia.com",
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 컬럼 인덱스 (1부터 시작, A=1)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  COLUMNS: {
    NO: 1,                    // A
    APPLY_DATE: 2,           // B
    AGENT: 3,                // C
    PARENT_NAME: 4,          // D
    CHILD_NAME: 5,           // E
    FAILURE_REASON: 6,       // F
    APPROVAL_DATE: 7,        // G
    MANAGER_APPROVAL: 8,     // H
    TEACHER: 9,              // I
    LESSON_DATE: 10,         // J
    LESSON_TIME: 11,         // K
    CLOSING_SIGNAL: 12,      // L
    LESSON_RESULT: 13,       // M
    PARENT_FEEDBACK: 14,     // N
    NEXT_STEP: 15,           // O
    RECLOSE_DATE: 16,        // P
    DDAY: 17,                // Q
    REGION: 18,              // R
    DECISION_MAKER: 19,      // S
    FAMILY: 20,              // T
    MEMO: 21,                // U
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 비즈니스 로직 설정
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  BUSINESS: {
    // 재클로징 기한 (일)
    RECLOSE_DEADLINE_DAYS: 3,

    // D-Day 알림 기준 (D-3 이하 알림)
    DDAY_ALERT_THRESHOLD: 3,

    // 매니저 승인 응답 기한 (시간)
    APPROVAL_TIMEOUT_HOURS: 4,

    // 교사 자동 배정 부하 한도 (주당 수업 수)
    TEACHER_MAX_LESSONS_PER_WEEK: 10,

    // 매일 알림 시간 (24시간)
    DAILY_ALERT_HOUR: 8,
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 외부 서비스 (선택)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  // 왓츠앱 API (Twilio)
  WHATSAPP: {
    ENABLED: false,  // true로 변경 시 활성화
    TWILIO_ACCOUNT_SID: "",
    TWILIO_AUTH_TOKEN: "",
    FROM_NUMBER: "whatsapp:+1234567890",
  },

  // Slack 알림 (선택)
  SLACK: {
    ENABLED: false,
    WEBHOOK_URL: "",
  },
};
```

### 2-3. 실제 값으로 변경

다음 값들을 실제 값으로 변경:

```javascript
SPREADSHEET_ID: "여기에_시트_ID_입력"
                ↓
SPREADSHEET_ID: "1ABC2def3GHI4jkl5MNO6pqr7STU8vwx9YZ"

EMAILS.HEAD: "본부장@lidia.com"
            ↓
EMAILS.HEAD: "kim.bonbu@lidia.com"
```

#### 시트 ID 찾는 법

```
시트 URL: https://docs.google.com/spreadsheets/d/1ABC2def3GHI/edit
                                                ↑
                                            이 부분이 시트 ID
```

---

## 🛠️ Step 3: 유틸 함수 (utils.gs)

### 3-1. utils.gs 생성

좌측 `+ 스크립트` → 이름: `utils`

### 3-2. 다음 코드 입력

```javascript
/**
 * 공통 유틸 함수
 */

/**
 * 메인 트래커 시트 가져오기
 */
function getMainSheet() {
  return SpreadsheetApp
    .openById(CONFIG.SPREADSHEET_ID)
    .getSheetByName(CONFIG.SHEETS.MAIN_TRACKER);
}

/**
 * 모든 데이터 가져오기 (헤더 제외)
 * @return {Array<Array>} 2차원 배열
 */
function getAllData() {
  const sheet = getMainSheet();
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  if (lastRow < 2) return [];
  return sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
}

/**
 * 에이전트 이메일 조회
 * @param {string} agentName
 * @return {string} 이메일 또는 null
 */
function getAgentEmail(agentName) {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(CONFIG.SHEETS.AGENT_MASTER);
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === agentName) {
      return data[i][1]; // B열: 이메일
    }
  }
  return null;
}

/**
 * 교사 이메일 조회
 */
function getTeacherEmail(teacherName) {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(CONFIG.SHEETS.TEACHER_MASTER);
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === teacherName) {
      return data[i][2]; // C열: 이메일
    }
  }
  return null;
}

/**
 * 날짜 포맷 (YYYY-MM-DD)
 */
function formatDate(date) {
  if (!date) return "";
  if (typeof date === "string") date = new Date(date);
  return Utilities.formatDate(date, "Asia/Jakarta", "yyyy-MM-dd");
}

/**
 * 날짜 + 요일 포맷
 */
function formatDateWithDay(date) {
  if (!date) return "";
  if (typeof date === "string") date = new Date(date);
  return Utilities.formatDate(date, "Asia/Jakarta", "yyyy-MM-dd (E)");
}

/**
 * 두 날짜 차이 (일 단위)
 */
function daysBetween(date1, date2) {
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.round((date2 - date1) / oneDay);
}

/**
 * 이메일 발송 (공통 래퍼)
 */
function sendEmail(to, subject, htmlBody, options = {}) {
  try {
    MailApp.sendEmail({
      to: to,
      subject: subject,
      htmlBody: htmlBody,
      name: CONFIG.EMAILS.FROM_NAME,
      replyTo: CONFIG.EMAILS.REPLY_TO,
      ...options
    });
    logNotification(to, subject, "성공");
    return true;
  } catch (e) {
    logNotification(to, subject, "실패: " + e.message);
    return false;
  }
}

/**
 * 알림 로그 기록
 */
function logNotification(to, subject, status) {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  let sheet = ss.getSheetByName(CONFIG.SHEETS.NOTIFICATION_LOG);

  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEETS.NOTIFICATION_LOG);
    sheet.appendRow(["시간", "수신자", "제목", "상태"]);
  }

  sheet.appendRow([
    new Date(),
    to,
    subject,
    status
  ]);
}

/**
 * 왓츠앱 메시지 발송 (Twilio API)
 * 활성화: CONFIG.WHATSAPP.ENABLED = true
 */
function sendWhatsApp(toNumber, message) {
  if (!CONFIG.WHATSAPP.ENABLED) return false;

  const url = "https://api.twilio.com/2010-04-01/Accounts/" +
              CONFIG.WHATSAPP.TWILIO_ACCOUNT_SID +
              "/Messages.json";

  const payload = {
    To: "whatsapp:" + toNumber,
    From: CONFIG.WHATSAPP.FROM_NUMBER,
    Body: message
  };

  const options = {
    method: "post",
    payload: payload,
    headers: {
      Authorization: "Basic " + Utilities.base64Encode(
        CONFIG.WHATSAPP.TWILIO_ACCOUNT_SID + ":" +
        CONFIG.WHATSAPP.TWILIO_AUTH_TOKEN
      )
    },
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(url, options);
    return response.getResponseCode() === 201;
  } catch (e) {
    Logger.log("WhatsApp 발송 실패: " + e.message);
    return false;
  }
}

/**
 * Slack 메시지 발송
 */
function sendSlack(message) {
  if (!CONFIG.SLACK.ENABLED) return false;

  const payload = {
    text: message
  };

  const options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  try {
    UrlFetchApp.fetch(CONFIG.SLACK.WEBHOOK_URL, options);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * 컬럼 인덱스 → 알파벳 (1 → A, 27 → AA)
 */
function columnToLetter(column) {
  let temp;
  let letter = "";
  while (column > 0) {
    temp = (column - 1) % 26;
    letter = String.fromCharCode(temp + 65) + letter;
    column = (column - temp - 1) / 26;
  }
  return letter;
}
```

---

## 🛠️ Step 4: 권한 승인

### 4-1. 첫 실행

1. utils.gs에서 임시 함수 추가:

```javascript
function testPermission() {
  const sheet = getMainSheet();
  Logger.log("시트 이름: " + sheet.getName());
  Logger.log("행 수: " + sheet.getLastRow());
}
```

2. 함수 선택 드롭다운에서 `testPermission` 선택
3. **실행** 버튼 클릭

### 4-2. 권한 승인 화면

```
"이 앱은 Google에서 인증되지 않았습니다"
→ 고급 클릭
→ Lidia 운영 자동화 (안전하지 않음)으로 이동
→ 다음 권한 승인:
  - Google Sheets 읽기/쓰기
  - 이메일 발송
  - 외부 서비스 연결 (왓츠앱용)
  - 트리거 생성
```

### 4-3. 실행 확인

1. Apps Script 하단 "실행 로그" 확인
2. "시트 이름: 메인트래커" 출력?
3. 정상이면 권한 설정 완료

### 4-4. 임시 함수 삭제

`testPermission` 함수 삭제.

---

## 🛠️ Step 5: 트리거 설정

### 5-1. 트리거란?

자동으로 함수를 실행하는 설정. 3가지 타입:

| 타입 | 설명 | 예시 |
|---|---|---|
| 시간 기반 | 매일/매시간 정해진 시간 | 매일 8시 D-Day 알림 |
| 폼 제출 | 폼 응답 시 즉시 실행 | 신규 신청 → 매니저 알림 |
| 편집 기반 | 셀 변경 시 즉시 실행 | 매니저 승인 → 교사 배정 |

### 5-2. 트리거 추가 방법

1. Apps Script 왼쪽 메뉴: **시계 아이콘 (트리거)**
2. **트리거 추가** (우측 하단 + 버튼)
3. 설정:

```
실행할 함수 선택:    sendDailyAlert (예시)
실행할 배포 선택:    Head
이벤트 소스 선택:    시간 기반
시간 트리거 유형:    일 단위 타이머
오전 8시 ~ 9시:    (선택)
```

4. **저장**

### 5-3. 트리거 종류별 설정

#### A. 시간 기반 트리거 (매일 8시)

```
함수: sendDailyAlert
이벤트: 시간 기반
유형: 일 단위 타이머
시간: 오전 8시 ~ 9시
```

#### B. 폼 제출 트리거

```
함수: onFormSubmit
이벤트: 스프레드시트
이벤트 유형: 양식 제출 시
```

#### C. 셀 편집 트리거

```
함수: onApprovalChange
이벤트: 스프레드시트
이벤트 유형: 수정 시
```

---

## 🛠️ Step 6: 테스트 시나리오

각 스크립트 적용 전 다음 시나리오로 테스트:

### 6-1. 이메일 발송 테스트

`utils.gs`에 임시 함수 추가:

```javascript
function testEmail() {
  sendEmail(
    CONFIG.EMAILS.MANAGER,
    "[테스트] Lidia 자동화 알림",
    "<h1>테스트 이메일</h1><p>정상 작동 확인용입니다.</p>"
  );
}
```

실행 → 매니저 이메일에 도착 확인.

### 6-2. 시트 읽기 테스트

```javascript
function testRead() {
  const data = getAllData();
  Logger.log("총 행 수: " + data.length);
  Logger.log("첫 행: " + JSON.stringify(data[0]));
}
```

실행 → 로그에 데이터 출력 확인.

### 6-3. 시트 쓰기 테스트

```javascript
function testWrite() {
  const sheet = getMainSheet();
  sheet.getRange("Z1").setValue("테스트 - " + new Date());
}
```

실행 → 시트 Z1 셀에 값 입력 확인.

---

## 🐛 디버깅 가이드

### Apps Script 로그 확인

```
1. 실행 후 하단 "실행 로그" 클릭
2. 또는: 좌측 메뉴 "실행" 아이콘
3. 최근 실행 결과 + 에러 메시지
```

### 자주 발생하는 에러

#### 1. `TypeError: Cannot read property 'XXX' of null`

**원인**: 시트나 셀이 존재하지 않음
**해결**: 시트 이름 확인, `CONFIG.SHEETS.XXX` 값 확인

#### 2. `Authorization required`

**원인**: 권한 승인 필요
**해결**: 다시 실행 → 권한 화면에서 승인

#### 3. `Exceeded maximum execution time`

**원인**: 6분 (무료) 초과
**해결**: 로직 최적화, 배치 처리

#### 4. `Service invoked too many times`

**원인**: API 호출 한도 초과
**해결**: 호출 횟수 줄이기, 다음 날 재시도

---

## 📊 사용량 모니터링

### Google Workspace 대시보드

```
admin.google.com → 보고서 → 앱
→ Apps Script
→ 실행 시간 / 발송 이메일 수 확인
```

### Apps Script 자체 대시보드

```
script.google.com → 내 프로젝트
→ Lidia 운영 자동화 → 실행
→ 최근 7일 실행 횟수/시간
```

---

## ✅ 환경 설정 완료 체크리스트

- [ ] Apps Script 프로젝트 생성
- [ ] config.gs 작성 (시트 ID, 이메일 등)
- [ ] utils.gs 작성
- [ ] 권한 승인 완료
- [ ] testEmail() 정상 실행
- [ ] testRead() 정상 실행
- [ ] testWrite() 정상 실행
- [ ] 임시 테스트 함수 삭제

---

## 📞 다음 단계

환경 설정 완료 후:

1. **[자동 알림 (notifications.gs)](./scripts/notifications.gs)** ← 최우선
2. [매일 요약 (daily-summary.gs)](./scripts/daily-summary.gs)
3. [교사 자동 배정 (auto-assignment.gs)](./scripts/auto-assignment.gs)
4. [월간 리포트 (monthly-report.gs)](./scripts/monthly-report.gs)

먼저 **notifications.gs**부터 적용!
