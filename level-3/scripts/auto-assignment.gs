/**
 * auto-assignment.gs
 *
 * Lidia 운영 자동화 - 교사 자동 배정
 *
 * 작동 방식:
 * 1. 매니저가 승인 → notifications.gs의 onApprovalChange가 호출
 * 2. onApprovalChange → autoAssignTeacher() 호출
 * 3. 부하/지역/특기 고려해서 최적 교사 자동 선택
 * 4. 메인 트래커 교사 컬럼에 자동 입력
 *
 * 배정 알고리즘:
 * - 1순위: 같은 지역
 * - 2순위: 부하 적은 교사
 * - 3순위: 사유별 특기 매칭
 * - 4순위: 라운드 로빈
 */


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 메인 함수: 교사 자동 배정
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * 케이스에 가장 적합한 교사 자동 선택
 * @param {Object} caseData - 케이스 정보
 * @return {string|null} 배정된 교사 이름 또는 null
 */
function autoAssignTeacher(caseData) {
  try {
    Logger.log("=== 교사 자동 배정 시작 ===");
    Logger.log("케이스: " + JSON.stringify(caseData));

    // 1. 활성 교사 리스트 가져오기
    const teachers = getActiveTeachers();
    if (teachers.length === 0) {
      Logger.log("활성 교사 없음");
      sendNoTeacherAlert(caseData);
      return null;
    }

    // 2. 각 교사별 점수 계산
    const scoredTeachers = teachers.map(teacher => ({
      ...teacher,
      score: calculateTeacherScore(teacher, caseData),
      currentWorkload: getTeacherWorkload(teacher.name),
    }));

    // 3. 부하 한도 초과 교사 제외
    const availableTeachers = scoredTeachers.filter(t =>
      t.currentWorkload < CONFIG.BUSINESS.TEACHER_MAX_LESSONS_PER_WEEK
    );

    if (availableTeachers.length === 0) {
      Logger.log("부하 한도 초과 - 부하 적은 교사 강제 배정");
      // 부하가 가장 적은 교사 선택
      scoredTeachers.sort((a, b) => a.currentWorkload - b.currentWorkload);
      return scoredTeachers[0].name;
    }

    // 4. 점수 높은 순으로 정렬
    availableTeachers.sort((a, b) => b.score - a.score);

    // 5. 동점 시 부하 적은 교사 선택
    const topScore = availableTeachers[0].score;
    const topTeachers = availableTeachers.filter(t => t.score === topScore);
    topTeachers.sort((a, b) => a.currentWorkload - b.currentWorkload);

    const selected = topTeachers[0];

    Logger.log("배정 결과: " + selected.name + " (점수: " + selected.score + ")");

    // 6. 배정 로그 기록
    logAssignment(caseData, selected);

    return selected.name;

  } catch (error) {
    Logger.log("autoAssignTeacher 에러: " + error.message);
    sendErrorAlert("autoAssignTeacher", error);
    return null;
  }
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 교사 점수 계산
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * 교사-케이스 매칭 점수 계산
 * @return {number} 점수 (높을수록 적합)
 */
function calculateTeacherScore(teacher, caseData) {
  let score = 0;

  // 1. 지역 매칭 (가장 중요) - 30점
  if (teacher.region === caseData.region) {
    score += 30;
  } else if (isAdjacentRegion(teacher.region, caseData.region)) {
    score += 15;
  }

  // 2. 부하 (적을수록 좋음) - 최대 25점
  const workload = getTeacherWorkload(teacher.name);
  const workloadScore = Math.max(0, 25 - workload * 2);
  score += workloadScore;

  // 3. 사유별 특기 - 20점
  if (teacher.specialties) {
    const reasonCode = caseData.reason ? caseData.reason.substring(0, 1) : "";
    if (teacher.specialties.includes(reasonCode)) {
      score += 20;
    }
  }

  // 4. 자녀 연령대 특기 - 15점
  if (teacher.ageGroups) {
    const childAge = parseInt(caseData.childAge);
    if (childAge >= 0 && childAge <= 6 && teacher.ageGroups.includes("유아")) {
      score += 15;
    } else if (childAge >= 7 && childAge <= 12 && teacher.ageGroups.includes("초등")) {
      score += 15;
    }
  }

  // 5. 평점 - 최대 10점
  if (teacher.rating) {
    score += teacher.rating * 2; // 5점 만점 → 10점
  }

  // 6. 최근 성공률 - 최대 10점
  const successRate = getTeacherSuccessRate(teacher.name);
  score += successRate / 10; // 100% → 10점

  return Math.round(score);
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 교사 정보 조회
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * 활성 교사 리스트 가져오기
 * 교사마스터 시트 구조 가정:
 * A: 이름, B: 지역, C: 이메일, D: 활성, E: 특기사유, F: 연령대, G: 평점
 */
function getActiveTeachers() {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(CONFIG.SHEETS.TEACHER_MASTER);
  const data = sheet.getDataRange().getValues();

  const teachers = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[3] === true || row[3] === "TRUE") { // D열: 활성
      teachers.push({
        name: row[0],          // A: 이름
        region: row[1],        // B: 지역
        email: row[2],         // C: 이메일
        active: row[3],        // D: 활성
        specialties: row[4] || "",  // E: 특기 사유 (예: "①③⑤")
        ageGroups: row[5] || "",    // F: 연령대 (예: "유아,초등")
        rating: row[6] || 0,         // G: 평점 (5점 만점)
      });
    }
  }

  return teachers;
}


/**
 * 교사 현재 부하 (이번 주 수업 수)
 */
function getTeacherWorkload(teacherName) {
  const allData = getAllData();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 이번 주 월요일 ~ 일요일
  const monday = new Date(today);
  monday.setDate(monday.getDate() - (monday.getDay() === 0 ? 6 : monday.getDay() - 1));
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);

  let count = 0;
  allData.forEach(row => {
    const teacher = row[CONFIG.COLUMNS.TEACHER - 1];
    const lessonDate = row[CONFIG.COLUMNS.LESSON_DATE - 1];

    if (teacher === teacherName && lessonDate >= monday && lessonDate <= sunday) {
      count++;
    }
  });

  return count;
}


/**
 * 교사 성공률 (최근 30일)
 */
function getTeacherSuccessRate(teacherName) {
  const allData = getAllData();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  let total = 0;
  let success = 0;

  allData.forEach(row => {
    const teacher = row[CONFIG.COLUMNS.TEACHER - 1];
    const lessonDate = row[CONFIG.COLUMNS.LESSON_DATE - 1];
    const result = row[CONFIG.COLUMNS.LESSON_RESULT - 1];

    if (teacher === teacherName && lessonDate >= thirtyDaysAgo && result) {
      total++;
      if (result === "성공") success++;
    }
  });

  return total > 0 ? (success / total * 100) : 50; // 기본값 50%
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 지역 매칭 헬퍼
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * 인접 지역 정의
 */
const ADJACENT_REGIONS = {
  "Jakarta Pusat": ["Jakarta Selatan", "Jakarta Barat", "Jakarta Timur"],
  "Jakarta Selatan": ["Jakarta Pusat", "Jakarta Timur", "Depok"],
  "Jakarta Utara": ["Jakarta Pusat", "Jakarta Barat", "Bekasi"],
  "Jakarta Timur": ["Jakarta Pusat", "Jakarta Selatan", "Bekasi"],
  "Jakarta Barat": ["Jakarta Pusat", "Jakarta Utara", "Tangerang"],
  "Tangerang": ["Jakarta Barat"],
  "Depok": ["Jakarta Selatan"],
  "Bekasi": ["Jakarta Timur", "Jakarta Utara"],
};


/**
 * 두 지역이 인접한지 확인
 */
function isAdjacentRegion(region1, region2) {
  if (!region1 || !region2) return false;
  if (region1 === region2) return false;
  return ADJACENT_REGIONS[region1] && ADJACENT_REGIONS[region1].includes(region2);
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 배정 로그
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * 배정 결과 로그 기록
 */
function logAssignment(caseData, teacher) {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  let sheet = ss.getSheetByName("배정로그");

  if (!sheet) {
    sheet = ss.insertSheet("배정로그");
    sheet.appendRow([
      "배정 시간", "케이스 NO", "에이전트", "학부모",
      "지역", "사유", "배정 교사", "점수", "현재 부하"
    ]);
  }

  sheet.appendRow([
    new Date(),
    caseData.no || "",
    caseData.agent,
    caseData.parentName,
    caseData.region || "",
    caseData.reason || "",
    teacher.name,
    teacher.score,
    teacher.currentWorkload,
  ]);
}


/**
 * 활성 교사 없을 때 알림
 */
function sendNoTeacherAlert(caseData) {
  const subject = `[⚠️ 긴급] 교사 배정 실패 - ${caseData.parentName}`;

  const body = `
<div style="font-family: Arial, sans-serif;">
  <h2 style="color: #EA4335;">⚠️ 교사 배정 실패</h2>
  <p>다음 케이스의 자동 배정에 실패했습니다.</p>

  <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
    <tr><td>학부모:</td><td><strong>${caseData.parentName}</strong></td></tr>
    <tr><td>에이전트:</td><td>${caseData.agent}</td></tr>
    <tr><td>지역:</td><td>${caseData.region}</td></tr>
    <tr><td>사유:</td><td>${caseData.reason}</td></tr>
  </table>

  <p><strong>가능 원인:</strong></p>
  <ul>
    <li>활성 교사 없음</li>
    <li>모든 교사가 부하 한도 초과</li>
    <li>교사마스터 시트 설정 오류</li>
  </ul>

  <p><strong>조치:</strong> 매니저가 수동으로 교사 배정 필요</p>
</div>
  `;

  sendEmail(CONFIG.EMAILS.MANAGER, subject, body);
  sendEmail(CONFIG.EMAILS.HEAD, subject, body);
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 부하 분산 분석 (주기적 실행)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * 교사 부하 분산 점검 (주간)
 * 트리거: 매주 월요일 오전 9시
 */
function checkWorkloadBalance() {
  const teachers = getActiveTeachers();
  const workloads = teachers.map(t => ({
    name: t.name,
    workload: getTeacherWorkload(t.name)
  }));

  if (workloads.length === 0) return;

  const max = Math.max(...workloads.map(w => w.workload));
  const min = Math.min(...workloads.map(w => w.workload));
  const diff = max - min;

  // 편차가 5건 이상이면 경고
  if (diff >= 5) {
    const subject = "[📊 부하 분산 경고] 교사 간 편차 " + diff + "건";

    const body = `
<div style="font-family: Arial, sans-serif;">
  <h2>📊 교사 부하 분산 점검</h2>
  <p>이번 주 교사 간 수업 편차: <strong>${diff}건</strong></p>

  <h3>교사별 부하:</h3>
  <table style="width: 100%; border-collapse: collapse;">
    <tr style="background: #F8F9FA;">
      <th style="padding: 8px; text-align: left;">교사</th>
      <th style="padding: 8px; text-align: center;">수업 수</th>
      <th style="padding: 8px;">시각화</th>
    </tr>
    ${workloads.sort((a, b) => b.workload - a.workload).map(w => `
    <tr>
      <td style="padding: 8px;">${w.name}</td>
      <td style="padding: 8px; text-align: center;">${w.workload}건</td>
      <td style="padding: 8px;">
        <div style="background: #F0F0F0; height: 16px; border-radius: 4px;">
          <div style="background: ${w.workload > 8 ? '#EA4335' : w.workload > 5 ? '#FF9800' : '#34A853'};
                      width: ${w.workload * 10}%; height: 100%; border-radius: 4px;">
          </div>
        </div>
      </td>
    </tr>
    `).join('')}
  </table>

  <p style="margin-top: 20px;">
    <strong>권장 조치:</strong> 부하 높은 교사 케이스 중 일부를 부하 낮은 교사에게 재배정.
  </p>
</div>
    `;

    sendEmail(CONFIG.EMAILS.MANAGER, subject, body);
  }
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 수동 재배정
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * 매니저 메뉴: 특정 케이스 재배정
 * 시트 우클릭 메뉴에 추가 가능
 */
function manualReassign() {
  const sheet = SpreadsheetApp.getActiveSheet();
  const range = sheet.getActiveRange();
  const row = range.getRow();

  if (row < 2) {
    SpreadsheetApp.getUi().alert("데이터 행을 선택하세요.");
    return;
  }

  const rowData = sheet.getRange(row, 1, 1, sheet.getLastColumn()).getValues()[0];

  const caseData = {
    no: rowData[CONFIG.COLUMNS.NO - 1],
    agent: rowData[CONFIG.COLUMNS.AGENT - 1],
    parentName: rowData[CONFIG.COLUMNS.PARENT_NAME - 1],
    childName: rowData[CONFIG.COLUMNS.CHILD_NAME - 1],
    childAge: rowData[CONFIG.COLUMNS.CHILD_NAME - 1],
    region: rowData[CONFIG.COLUMNS.REGION - 1],
    reason: rowData[CONFIG.COLUMNS.FAILURE_REASON - 1],
  };

  const newTeacher = autoAssignTeacher(caseData);

  if (newTeacher) {
    sheet.getRange(row, CONFIG.COLUMNS.TEACHER).setValue(newTeacher);
    SpreadsheetApp.getUi().alert(`재배정 완료: ${newTeacher}`);
  } else {
    SpreadsheetApp.getUi().alert("재배정 실패. 매니저에게 알림 전송됨.");
  }
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 메뉴 등록
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * 스프레드시트 열 때 자동 메뉴 등록
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("🤖 Lidia 자동화")
    .addItem("📋 현재 케이스 재배정", "manualReassign")
    .addItem("📊 부하 분산 점검", "checkWorkloadBalance")
    .addSeparator()
    .addItem("📨 일일 요약 미리보기", "testManagerSummary")
    .addItem("📈 주간 요약 미리보기", "testWeeklySummary")
    .addSeparator()
    .addItem("⚙️ 트리거 재설치", "installAllTriggers")
    .addToUi();
}


/**
 * 모든 트리거 한 번에 설치
 */
function installAllTriggers() {
  // 기존 트리거 모두 삭제
  const existing = ScriptApp.getProjectTriggers();
  existing.forEach(t => ScriptApp.deleteTrigger(t));

  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);

  // 1. 폼 제출
  ScriptApp.newTrigger("onFormSubmit").forSpreadsheet(ss).onFormSubmit().create();

  // 2. 편집 이벤트
  ScriptApp.newTrigger("onApprovalChange").forSpreadsheet(ss).onEdit().create();
  ScriptApp.newTrigger("onResultInput").forSpreadsheet(ss).onEdit().create();

  // 3. 매일 8시
  ScriptApp.newTrigger("sendDailySummary")
    .timeBased()
    .atHour(CONFIG.BUSINESS.DAILY_ALERT_HOUR)
    .everyDays(1)
    .inTimezone("Asia/Jakarta")
    .create();

  // 4. 매주 월요일 9시 부하 점검
  ScriptApp.newTrigger("checkWorkloadBalance")
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.MONDAY)
    .atHour(9)
    .inTimezone("Asia/Jakarta")
    .create();

  // 5. 매월 1일 월간 리포트
  ScriptApp.newTrigger("sendMonthlyReport")
    .timeBased()
    .onMonthDay(1)
    .atHour(9)
    .inTimezone("Asia/Jakarta")
    .create();

  SpreadsheetApp.getUi().alert("✅ 모든 트리거 설치 완료");
  Logger.log("트리거 설치 완료: " + ScriptApp.getProjectTriggers().length + "개");
}
