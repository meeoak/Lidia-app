/**
 * daily-summary.gs
 *
 * Lidia 운영 자동화 - 매일 요약 알림
 *
 * 트리거:
 * - 매일 아침 8시 자동 실행
 * - 매니저: 전체 요약 (어제 완료 + D-Day 임박 + 미처리)
 * - 에이전트: 본인 D-Day 임박 케이스
 * - 교사: 오늘 수업 일정
 * - 본부장: 주간 요약 (월요일만)
 *
 * 적용 방법:
 * 1. 이 코드를 'daily-summary' 스크립트 파일에 복사
 * 2. 트리거 설정: 시간 기반 → 일 단위 타이머 → 오전 8-9시
 *    - 함수: sendDailySummary
 */


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 메인 함수 (트리거)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * 매일 아침 8시 실행되는 메인 함수
 */
function sendDailySummary() {
  try {
    Logger.log("=== 매일 요약 시작: " + new Date() + " ===");

    // 1. 매니저 요약
    sendManagerDailySummary();

    // 2. 에이전트별 요약
    sendAgentDailyAlerts();

    // 3. 교사별 오늘 일정
    sendTeacherDailySchedule();

    // 4. 본부장 주간 요약 (월요일만)
    if (new Date().getDay() === 1) {
      sendHeadWeeklySummary();
    }

    Logger.log("=== 매일 요약 완료 ===");

  } catch (error) {
    Logger.log("sendDailySummary 에러: " + error.message);
    sendErrorAlert("sendDailySummary", error);
  }
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 1. 매니저 일일 요약
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function sendManagerDailySummary() {
  const allData = getAllData();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // 데이터 분류
  const ddayAlerts = [];      // D-Day 임박 (D-3 이하)
  const pendingApprovals = []; // 승인 대기
  const completedYesterday = []; // 어제 완료
  const noResponseTeachers = []; // 응답 없는 교사

  allData.forEach(row => {
    const status = row[CONFIG.COLUMNS.MANAGER_APPROVAL - 1];
    const result = row[CONFIG.COLUMNS.LESSON_RESULT - 1];
    const lessonDate = row[CONFIG.COLUMNS.LESSON_DATE - 1];
    const applyDate = row[CONFIG.COLUMNS.APPLY_DATE - 1];

    const item = {
      no: row[CONFIG.COLUMNS.NO - 1],
      agent: row[CONFIG.COLUMNS.AGENT - 1],
      parent: row[CONFIG.COLUMNS.PARENT_NAME - 1],
      child: row[CONFIG.COLUMNS.CHILD_NAME - 1],
      teacher: row[CONFIG.COLUMNS.TEACHER - 1],
      reason: row[CONFIG.COLUMNS.FAILURE_REASON - 1],
      result: result,
      lessonDate: lessonDate,
    };

    // D-Day 임박
    if (applyDate && status === "승인" && !result) {
      const daysLeft = CONFIG.BUSINESS.RECLOSE_DEADLINE_DAYS -
                       daysBetween(applyDate, today);
      if (daysLeft <= CONFIG.BUSINESS.DDAY_ALERT_THRESHOLD) {
        item.dday = daysLeft >= 0 ? `D-${daysLeft}` : "마감";
        ddayAlerts.push(item);
      }
    }

    // 승인 대기
    if (status === "대기") {
      const hoursPending = (today - new Date(applyDate)) / (1000 * 60 * 60);
      item.hoursPending = Math.floor(hoursPending);
      pendingApprovals.push(item);
    }

    // 어제 완료
    if (lessonDate && formatDate(lessonDate) === formatDate(yesterday) && result) {
      completedYesterday.push(item);
    }

    // 수업일 지났는데 결과 미입력
    if (lessonDate && lessonDate < yesterday && !result && status === "승인") {
      const daysOverdue = daysBetween(lessonDate, today);
      if (daysOverdue >= 1) {
        item.daysOverdue = daysOverdue;
        noResponseTeachers.push(item);
      }
    }
  });

  // 이메일 본문 구성
  const subject = `[📊 일일 요약] ${formatDateWithDay(today)} - 액션 ${ddayAlerts.length + pendingApprovals.length}건`;

  let body = `
<div style="font-family: Arial, sans-serif; max-width: 700px;">
  <div style="background: #1A73E8; color: white; padding: 20px; border-radius: 8px;">
    <h1 style="margin: 0;">📊 Lidia 일일 운영 요약</h1>
    <p style="margin: 5px 0 0 0; opacity: 0.9;">${formatDateWithDay(today)}</p>
  </div>

  <!-- KPI 카드 -->
  <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
    <tr>
      <td style="background: #FFF3CD; padding: 15px; text-align: center; border-radius: 8px; width: 33%;">
        <div style="font-size: 32px; font-weight: bold; color: #FF6F00;">${ddayAlerts.length}</div>
        <div style="font-size: 12px; color: #666;">🔴 D-Day 임박</div>
      </td>
      <td style="width: 1%;"></td>
      <td style="background: #E3F2FD; padding: 15px; text-align: center; border-radius: 8px; width: 33%;">
        <div style="font-size: 32px; font-weight: bold; color: #1A73E8;">${pendingApprovals.length}</div>
        <div style="font-size: 12px; color: #666;">⏳ 승인 대기</div>
      </td>
      <td style="width: 1%;"></td>
      <td style="background: #E8F5E9; padding: 15px; text-align: center; border-radius: 8px; width: 33%;">
        <div style="font-size: 32px; font-weight: bold; color: #34A853;">${completedYesterday.length}</div>
        <div style="font-size: 12px; color: #666;">✅ 어제 완료</div>
      </td>
    </tr>
  </table>
  `;

  // 1. D-Day 임박 케이스
  if (ddayAlerts.length > 0) {
    body += `
  <h2 style="color: #EA4335; border-bottom: 2px solid #EA4335; padding-bottom: 8px;">
    🚨 즉시 액션 필요 (D-Day 임박)
  </h2>
  <table style="width: 100%; border-collapse: collapse;">
    <tr style="background: #F8F9FA;">
      <th style="padding: 10px; text-align: left;">NO</th>
      <th style="padding: 10px; text-align: left;">Agent</th>
      <th style="padding: 10px; text-align: left;">학부모</th>
      <th style="padding: 10px; text-align: left;">사유</th>
      <th style="padding: 10px; text-align: center;">D-Day</th>
    </tr>
    ${ddayAlerts.map(item => `
    <tr style="border-bottom: 1px solid #eee;">
      <td style="padding: 10px;">${item.no}</td>
      <td style="padding: 10px;"><strong>${item.agent}</strong></td>
      <td style="padding: 10px;">${item.parent} (${item.child})</td>
      <td style="padding: 10px;">${item.reason || '-'}</td>
      <td style="padding: 10px; text-align: center;">
        <span style="background: ${item.dday === '마감' ? '#EA4335' : '#FF6F00'};
                     color: white; padding: 4px 10px; border-radius: 12px; font-weight: bold;">
          ${item.dday}
        </span>
      </td>
    </tr>
    `).join('')}
  </table>
    `;
  }

  // 2. 승인 대기
  if (pendingApprovals.length > 0) {
    body += `
  <h2 style="color: #FF9800; border-bottom: 2px solid #FF9800; padding-bottom: 8px; margin-top: 30px;">
    ⏳ 승인 대기 (${pendingApprovals.length}건)
  </h2>
  <table style="width: 100%; border-collapse: collapse;">
    <tr style="background: #F8F9FA;">
      <th style="padding: 10px; text-align: left;">NO</th>
      <th style="padding: 10px; text-align: left;">Agent</th>
      <th style="padding: 10px; text-align: left;">학부모</th>
      <th style="padding: 10px; text-align: left;">사유</th>
      <th style="padding: 10px; text-align: center;">경과</th>
    </tr>
    ${pendingApprovals.sort((a, b) => b.hoursPending - a.hoursPending).map(item => `
    <tr style="border-bottom: 1px solid #eee;
               ${item.hoursPending > CONFIG.BUSINESS.APPROVAL_TIMEOUT_HOURS ? 'background: #FFEBEE;' : ''}">
      <td style="padding: 10px;">${item.no}</td>
      <td style="padding: 10px;"><strong>${item.agent}</strong></td>
      <td style="padding: 10px;">${item.parent} (${item.child})</td>
      <td style="padding: 10px;">${item.reason || '-'}</td>
      <td style="padding: 10px; text-align: center;
                 color: ${item.hoursPending > CONFIG.BUSINESS.APPROVAL_TIMEOUT_HOURS ? '#EA4335' : '#666'};">
        ${item.hoursPending}시간 ${item.hoursPending > CONFIG.BUSINESS.APPROVAL_TIMEOUT_HOURS ? '⚠️' : ''}
      </td>
    </tr>
    `).join('')}
  </table>
    `;
  }

  // 3. 미응답 교사
  if (noResponseTeachers.length > 0) {
    body += `
  <h2 style="color: #FF9800; border-bottom: 2px solid #FF9800; padding-bottom: 8px; margin-top: 30px;">
    ⚠️ 수업 결과 미입력 (${noResponseTeachers.length}건)
  </h2>
  <ul>
    ${noResponseTeachers.map(item => `
    <li>${item.teacher} - ${item.parent} (${item.child}) - ${item.daysOverdue}일 경과</li>
    `).join('')}
  </ul>
    `;
  }

  // 4. 어제 완료
  if (completedYesterday.length > 0) {
    body += `
  <h2 style="color: #34A853; border-bottom: 2px solid #34A853; padding-bottom: 8px; margin-top: 30px;">
    ✅ 어제 완료 (${completedYesterday.length}건)
  </h2>
  <ul>
    ${completedYesterday.map(item => `
    <li>
      <strong>${item.parent}</strong> (${item.child}) -
      ${item.teacher} -
      <span style="color: ${item.result === '성공' ? '#34A853' : item.result === '실패' ? '#EA4335' : '#FF9800'};">
        ${item.result}
      </span>
    </li>
    `).join('')}
  </ul>
    `;
  }

  // 푸터
  body += `
  <hr style="margin: 30px 0;">
  <p style="text-align: center;">
    <a href="https://docs.google.com/spreadsheets/d/${CONFIG.SPREADSHEET_ID}/edit"
       style="background: #1A73E8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
      📊 시트로 이동
    </a>
  </p>

  <p style="text-align: center; color: #999; font-size: 11px; margin-top: 30px;">
    이 메일은 매일 아침 8시에 자동 발송됩니다.<br>
    수신 거부: 본부장에게 요청
  </p>
</div>
  `;

  sendEmail(CONFIG.EMAILS.MANAGER, subject, body);
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 2. 에이전트별 일일 알림
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function sendAgentDailyAlerts() {
  const allData = getAllData();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 에이전트별 그룹화
  const agentCases = {};

  allData.forEach(row => {
    const agent = row[CONFIG.COLUMNS.AGENT - 1];
    const status = row[CONFIG.COLUMNS.MANAGER_APPROVAL - 1];
    const result = row[CONFIG.COLUMNS.LESSON_RESULT - 1];
    const applyDate = row[CONFIG.COLUMNS.APPLY_DATE - 1];

    if (!agent) return;

    if (status === "승인" && !result && applyDate) {
      const daysLeft = CONFIG.BUSINESS.RECLOSE_DEADLINE_DAYS -
                       daysBetween(applyDate, today);

      if (daysLeft <= CONFIG.BUSINESS.DDAY_ALERT_THRESHOLD) {
        if (!agentCases[agent]) agentCases[agent] = [];
        agentCases[agent].push({
          parent: row[CONFIG.COLUMNS.PARENT_NAME - 1],
          child: row[CONFIG.COLUMNS.CHILD_NAME - 1],
          teacher: row[CONFIG.COLUMNS.TEACHER - 1],
          reason: row[CONFIG.COLUMNS.FAILURE_REASON - 1],
          dday: daysLeft >= 0 ? `D-${daysLeft}` : "마감",
        });
      }
    }
  });

  // 각 에이전트에게 알림
  Object.keys(agentCases).forEach(agent => {
    const cases = agentCases[agent];
    if (cases.length === 0) return;

    const agentEmail = getAgentEmail(agent);
    if (!agentEmail) return;

    const subject = `[🚨 ${agent}] 오늘 액션 필요 ${cases.length}건`;

    const body = `
<div style="font-family: Arial, sans-serif; max-width: 600px;">
  <h2 style="color: #EA4335;">🚨 오늘 액션 필요</h2>
  <p>${agent}님, D-Day 임박 케이스가 ${cases.length}건 있습니다.</p>

  ${cases.map(c => `
  <div style="border: 1px solid #ddd; padding: 15px; border-radius: 8px; margin: 10px 0;">
    <h3 style="margin: 0;">${c.parent} (${c.child})</h3>
    <table style="margin-top: 10px;">
      <tr><td style="color: #666; padding: 4px 10px 4px 0;">D-Day:</td>
          <td><span style="background: #EA4335; color: white; padding: 2px 8px; border-radius: 4px;">${c.dday}</span></td></tr>
      <tr><td style="color: #666; padding: 4px 10px 4px 0;">교사:</td>
          <td>${c.teacher}</td></tr>
      <tr><td style="color: #666; padding: 4px 10px 4px 0;">사유:</td>
          <td>${c.reason}</td></tr>
    </table>
  </div>
  `).join('')}

  <p style="margin-top: 20px;">
    <a href="https://docs.google.com/spreadsheets/d/${CONFIG.SPREADSHEET_ID}/edit"
       style="background: #1A73E8; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
      📊 내 시트로 이동
    </a>
  </p>
</div>
    `;

    sendEmail(agentEmail, subject, body);
  });
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 3. 교사별 오늘 일정
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function sendTeacherDailySchedule() {
  const allData = getAllData();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const teacherSchedule = {};

  allData.forEach(row => {
    const teacher = row[CONFIG.COLUMNS.TEACHER - 1];
    const lessonDate = row[CONFIG.COLUMNS.LESSON_DATE - 1];

    if (!teacher || !lessonDate) return;

    if (formatDate(lessonDate) === formatDate(today)) {
      if (!teacherSchedule[teacher]) teacherSchedule[teacher] = [];
      teacherSchedule[teacher].push({
        time: row[CONFIG.COLUMNS.LESSON_TIME - 1] || "시간 미정",
        parent: row[CONFIG.COLUMNS.PARENT_NAME - 1],
        child: row[CONFIG.COLUMNS.CHILD_NAME - 1],
        agent: row[CONFIG.COLUMNS.AGENT - 1],
        reason: row[CONFIG.COLUMNS.FAILURE_REASON - 1],
        region: row[CONFIG.COLUMNS.REGION - 1],
      });
    }
  });

  // 각 교사에게 알림
  Object.keys(teacherSchedule).forEach(teacher => {
    const schedules = teacherSchedule[teacher];
    if (schedules.length === 0) return;

    const teacherEmail = getTeacherEmail(teacher);
    if (!teacherEmail) return;

    schedules.sort((a, b) => a.time.localeCompare(b.time));

    const subject = `[📅 ${teacher}] 오늘 수업 ${schedules.length}건`;

    const body = `
<div style="font-family: Arial, sans-serif; max-width: 600px;">
  <h2 style="color: #1A73E8;">📅 오늘 수업 일정</h2>
  <p>${teacher} 선생님, 오늘 ${schedules.length}건의 수업이 있습니다.</p>

  ${schedules.map((s, idx) => `
  <div style="border-left: 4px solid #1A73E8; padding: 15px; margin: 15px 0; background: #F8F9FA;">
    <h3 style="margin: 0; color: #1A73E8;">${idx + 1}. ${s.time} - ${s.parent} (${s.child})</h3>

    <table style="margin-top: 10px; width: 100%;">
      <tr>
        <td style="padding: 4px 0; width: 100px; color: #666;">📍 지역:</td>
        <td>${s.region || '-'}</td>
      </tr>
      <tr>
        <td style="padding: 4px 0; color: #666;">🚨 보류 사유:</td>
        <td><span style="background: #FFE599; padding: 2px 8px; border-radius: 4px;">${s.reason}</span></td>
      </tr>
      <tr>
        <td style="padding: 4px 0; color: #666;">👤 Agent:</td>
        <td>${s.agent}</td>
      </tr>
    </table>
  </div>
  `).join('')}

  <div style="background: #E3F2FD; padding: 15px; border-radius: 8px; margin-top: 20px;">
    <strong>💡 수업 전 체크리스트:</strong>
    <ul>
      <li>본인 시트에서 사유별 수업 전략 확인</li>
      <li>학부모 메모 확인 (이전 수업 기록)</li>
      <li>수업 후 결과 폼 입력 잊지 말기</li>
    </ul>
  </div>

  <p style="margin-top: 20px;">
    <a href="https://docs.google.com/spreadsheets/d/${CONFIG.SPREADSHEET_ID}/edit"
       style="background: #1A73E8; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
      📊 내 시트로 이동
    </a>
  </p>
</div>
    `;

    sendEmail(teacherEmail, subject, body);
  });
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 4. 본부장 주간 요약 (월요일만)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function sendHeadWeeklySummary() {
  const allData = getAllData();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 지난주 (월요일~일요일)
  const lastSunday = new Date(today);
  lastSunday.setDate(lastSunday.getDate() - 1);
  const lastMonday = new Date(lastSunday);
  lastMonday.setDate(lastMonday.getDate() - 6);

  // 지난주 데이터 집계
  let totalApplications = 0;
  let totalSuccess = 0;
  let totalFailed = 0;
  let totalHeld = 0;

  const agentPerformance = {};
  const teacherWorkload = {};
  const reasonDistribution = {};

  allData.forEach(row => {
    const applyDate = row[CONFIG.COLUMNS.APPLY_DATE - 1];
    const result = row[CONFIG.COLUMNS.LESSON_RESULT - 1];
    const agent = row[CONFIG.COLUMNS.AGENT - 1];
    const teacher = row[CONFIG.COLUMNS.TEACHER - 1];
    const reason = row[CONFIG.COLUMNS.FAILURE_REASON - 1];

    if (!applyDate) return;

    // 지난주 신청
    if (applyDate >= lastMonday && applyDate <= lastSunday) {
      totalApplications++;

      if (!agentPerformance[agent]) {
        agentPerformance[agent] = { applied: 0, success: 0 };
      }
      agentPerformance[agent].applied++;

      if (reason) {
        reasonDistribution[reason] = (reasonDistribution[reason] || 0) + 1;
      }
    }

    // 지난주 결과
    const lessonDate = row[CONFIG.COLUMNS.LESSON_DATE - 1];
    if (lessonDate && lessonDate >= lastMonday && lessonDate <= lastSunday) {
      if (result === "성공") {
        totalSuccess++;
        if (agentPerformance[agent]) agentPerformance[agent].success++;
      } else if (result === "실패") {
        totalFailed++;
      } else if (result === "보류") {
        totalHeld++;
      }

      if (teacher) {
        teacherWorkload[teacher] = (teacherWorkload[teacher] || 0) + 1;
      }
    }
  });

  const successRate = totalApplications > 0
    ? (totalSuccess / totalApplications * 100).toFixed(1)
    : 0;

  const subject = `[📈 주간 요약] ${formatDate(lastMonday)} ~ ${formatDate(lastSunday)}`;

  let body = `
<div style="font-family: Arial, sans-serif; max-width: 700px;">
  <div style="background: linear-gradient(135deg, #1A73E8, #34A853); color: white; padding: 25px; border-radius: 8px;">
    <h1 style="margin: 0;">📈 주간 운영 요약</h1>
    <p style="margin: 5px 0 0 0; opacity: 0.95;">${formatDate(lastMonday)} ~ ${formatDate(lastSunday)}</p>
  </div>

  <!-- 주간 KPI -->
  <table style="width: 100%; border-collapse: collapse; margin: 25px 0;">
    <tr>
      <td style="background: #E3F2FD; padding: 20px; text-align: center; border-radius: 8px;">
        <div style="font-size: 36px; font-weight: bold; color: #1A73E8;">${totalApplications}</div>
        <div style="color: #666;">📋 신규 신청</div>
      </td>
      <td style="width: 10px;"></td>
      <td style="background: #E8F5E9; padding: 20px; text-align: center; border-radius: 8px;">
        <div style="font-size: 36px; font-weight: bold; color: #34A853;">${totalSuccess}</div>
        <div style="color: #666;">✅ 성공</div>
      </td>
      <td style="width: 10px;"></td>
      <td style="background: #FFF3E0; padding: 20px; text-align: center; border-radius: 8px;">
        <div style="font-size: 36px; font-weight: bold; color: #FF9800;">${successRate}%</div>
        <div style="color: #666;">📊 성공률</div>
      </td>
    </tr>
  </table>

  <!-- 에이전트별 성과 -->
  <h2 style="color: #1A73E8; border-bottom: 2px solid #1A73E8; padding-bottom: 8px;">
    👤 에이전트별 성과
  </h2>
  <table style="width: 100%; border-collapse: collapse;">
    <tr style="background: #F8F9FA;">
      <th style="padding: 10px; text-align: left;">에이전트</th>
      <th style="padding: 10px; text-align: center;">신청</th>
      <th style="padding: 10px; text-align: center;">성공</th>
      <th style="padding: 10px; text-align: center;">성공률</th>
    </tr>
    ${Object.entries(agentPerformance)
      .sort((a, b) => b[1].success - a[1].success)
      .map(([agent, perf]) => {
        const rate = perf.applied > 0 ? (perf.success / perf.applied * 100).toFixed(0) : 0;
        return `
    <tr style="border-bottom: 1px solid #eee;">
      <td style="padding: 10px;"><strong>${agent}</strong></td>
      <td style="padding: 10px; text-align: center;">${perf.applied}</td>
      <td style="padding: 10px; text-align: center; color: #34A853;">${perf.success}</td>
      <td style="padding: 10px; text-align: center;">
        <span style="color: ${rate >= 50 ? '#34A853' : rate >= 30 ? '#FF9800' : '#EA4335'};
                     font-weight: bold;">
          ${rate}%
        </span>
      </td>
    </tr>
        `;
      }).join('')}
  </table>

  <!-- 교사별 부하 -->
  <h2 style="color: #1A73E8; border-bottom: 2px solid #1A73E8; padding-bottom: 8px; margin-top: 30px;">
    👩‍🏫 교사별 수업 수
  </h2>
  <table style="width: 100%; border-collapse: collapse;">
    <tr style="background: #F8F9FA;">
      <th style="padding: 10px; text-align: left;">교사</th>
      <th style="padding: 10px; text-align: center;">수업 수</th>
      <th style="padding: 10px;">부하</th>
    </tr>
    ${Object.entries(teacherWorkload)
      .sort((a, b) => b[1] - a[1])
      .map(([teacher, count]) => {
        const load = count / CONFIG.BUSINESS.TEACHER_MAX_LESSONS_PER_WEEK * 100;
        return `
    <tr style="border-bottom: 1px solid #eee;">
      <td style="padding: 10px;"><strong>${teacher}</strong></td>
      <td style="padding: 10px; text-align: center;">${count}건</td>
      <td style="padding: 10px;">
        <div style="background: #F0F0F0; border-radius: 10px; height: 20px; overflow: hidden;">
          <div style="background: ${load > 80 ? '#EA4335' : load > 50 ? '#FF9800' : '#34A853'};
                      width: ${Math.min(load, 100)}%; height: 100%;">
          </div>
        </div>
      </td>
    </tr>
        `;
      }).join('')}
  </table>

  <!-- 실패 사유 분포 -->
  <h2 style="color: #1A73E8; border-bottom: 2px solid #1A73E8; padding-bottom: 8px; margin-top: 30px;">
    📊 실패 사유 분포
  </h2>
  <table style="width: 100%; border-collapse: collapse;">
    ${Object.entries(reasonDistribution)
      .sort((a, b) => b[1] - a[1])
      .map(([reason, count]) => {
        const pct = (count / totalApplications * 100).toFixed(0);
        return `
    <tr>
      <td style="padding: 8px 10px; width: 250px;">${reason}</td>
      <td style="padding: 8px 10px;">
        <div style="display: flex; align-items: center;">
          <div style="background: #1A73E8; height: 16px; width: ${pct}%;
                      min-width: 4px; border-radius: 4px; margin-right: 10px;"></div>
          <span style="color: #666;">${count}건 (${pct}%)</span>
        </div>
      </td>
    </tr>
        `;
      }).join('')}
  </table>

  <hr style="margin: 30px 0;">
  <p style="text-align: center; color: #999; font-size: 11px;">
    매주 월요일 아침 자동 발송 | 본부장 전용
  </p>
</div>
  `;

  sendEmail(CONFIG.EMAILS.HEAD, subject, body);
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 테스트 함수
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * 테스트: 매니저 일일 요약만 발송
 */
function testManagerSummary() {
  sendManagerDailySummary();
  Logger.log("테스트 발송 완료");
}

/**
 * 테스트: 본부장 주간 요약 발송 (월요일 아닌 날에도)
 */
function testWeeklySummary() {
  sendHeadWeeklySummary();
  Logger.log("주간 요약 테스트 발송 완료");
}

/**
 * 트리거 자동 설치 (한 번만 실행)
 */
function installDailySummaryTrigger() {
  // 기존 트리거 삭제 (해당 함수만)
  const existing = ScriptApp.getProjectTriggers();
  existing.forEach(t => {
    if (t.getHandlerFunction() === "sendDailySummary") {
      ScriptApp.deleteTrigger(t);
    }
  });

  // 매일 아침 8시 트리거
  ScriptApp.newTrigger("sendDailySummary")
    .timeBased()
    .atHour(CONFIG.BUSINESS.DAILY_ALERT_HOUR)
    .everyDays(1)
    .inTimezone("Asia/Jakarta")
    .create();

  Logger.log("매일 아침 8시 트리거 설치 완료");
}
