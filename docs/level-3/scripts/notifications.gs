/**
 * notifications.gs
 *
 * Lidia 운영 자동화 - 알림 시스템
 *
 * 트리거:
 * 1. onFormSubmit: 신규 폼 제출 시 매니저에게 자동 알림
 * 2. onApprovalChange: 매니저 승인 컬럼 변경 시 에이전트/교사 알림
 * 3. onResultInput: 수업 결과 입력 시 매니저/에이전트 알림
 *
 * 적용 방법:
 * 1. setup-guide.md의 환경 설정 완료
 * 2. 이 코드를 'notifications' 스크립트 파일에 복사
 * 3. 트리거 설정:
 *    - onFormSubmit: 폼 제출 트리거
 *    - onApprovalChange: 셀 편집 트리거
 *    - onResultInput: 셀 편집 트리거
 */


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 1. 신규 폼 제출 시 매니저에게 자동 알림
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * 트리거: 신규 케이스 폼 제출 시
 * 설정: 스프레드시트 → 양식 제출 시
 */
function onFormSubmit(e) {
  try {
    const responses = e.values;

    // 폼 응답 컬럼 인덱스 (폼 항목 순서)
    // 0: 타임스탬프, 1: 에이전트, 2: 학부모, 3: 학부모 연락처,
    // 4: 자녀 이름, 5: 자녀 나이, 6: 첫 만남, 7: 결과,
    // 8: 사유, 9: 상세, 10: 지역, 11: 가족, 12: 의사결정자, 13: 요청

    const data = {
      timestamp: responses[0],
      agent: responses[1],
      parentName: responses[2],
      parentPhone: responses[3],
      childName: responses[4],
      childAge: responses[5],
      firstMeeting: responses[6],
      firstResult: responses[7],
      reason: responses[8],
      detail: responses[9],
      region: responses[10],
      family: responses[11],
      decisionMaker: responses[12],
      request: responses[13],
    };

    // 매니저에게 알림 발송
    sendNewCaseAlertToManager(data);

    // 에이전트에게 접수 확인 알림
    sendNewCaseConfirmToAgent(data);

  } catch (error) {
    Logger.log("onFormSubmit 에러: " + error.message);
    sendErrorAlert("onFormSubmit", error);
  }
}


/**
 * 매니저에게 신규 케이스 알림
 */
function sendNewCaseAlertToManager(data) {
  const subject = `[🆕 신규] ${data.agent} → ${data.parentName} (${data.childName})`;

  const body = `
<div style="font-family: Arial, sans-serif; max-width: 600px;">
  <div style="background: #1A73E8; color: white; padding: 15px; border-radius: 8px 8px 0 0;">
    <h2 style="margin: 0;">🆕 신규 케이스 접수</h2>
    <p style="margin: 5px 0 0 0; opacity: 0.9;">매니저 승인을 기다리고 있습니다</p>
  </div>

  <div style="border: 1px solid #ddd; padding: 20px; border-radius: 0 0 8px 8px;">

    <h3 style="color: #1A73E8; margin-top: 0;">📋 기본 정보</h3>
    <table style="width: 100%; border-collapse: collapse;">
      <tr><td style="padding: 8px 0; color: #666;">에이전트:</td><td style="padding: 8px 0;"><strong>${data.agent}</strong></td></tr>
      <tr><td style="padding: 8px 0; color: #666;">학부모:</td><td style="padding: 8px 0;"><strong>${data.parentName}</strong></td></tr>
      <tr><td style="padding: 8px 0; color: #666;">자녀:</td><td style="padding: 8px 0;"><strong>${data.childName} (${data.childAge}세)</strong></td></tr>
      <tr><td style="padding: 8px 0; color: #666;">연락처:</td><td style="padding: 8px 0;">${data.parentPhone}</td></tr>
      <tr><td style="padding: 8px 0; color: #666;">지역:</td><td style="padding: 8px 0;">${data.region}</td></tr>
      <tr><td style="padding: 8px 0; color: #666;">의사결정자:</td><td style="padding: 8px 0;">${data.decisionMaker}</td></tr>
    </table>

    <h3 style="color: #1A73E8;">💼 영업 정보</h3>
    <table style="width: 100%; border-collapse: collapse;">
      <tr><td style="padding: 8px 0; color: #666;">첫 만남:</td><td style="padding: 8px 0;">${formatDate(data.firstMeeting)}</td></tr>
      <tr><td style="padding: 8px 0; color: #666;">1차 결과:</td><td style="padding: 8px 0;"><strong>${data.firstResult}</strong></td></tr>
      <tr><td style="padding: 8px 0; color: #666;">사유:</td><td style="padding: 8px 0;"><span style="background: #FFE599; padding: 4px 8px; border-radius: 4px;">${data.reason}</span></td></tr>
    </table>

    ${data.detail ? `
    <h3 style="color: #1A73E8;">📝 상세 메모</h3>
    <div style="background: #F8F9FA; padding: 12px; border-radius: 4px; border-left: 3px solid #1A73E8;">
      ${data.detail.replace(/\n/g, '<br>')}
    </div>
    ` : ''}

    ${data.request ? `
    <h3 style="color: #1A73E8;">🙋 에이전트 요청</h3>
    <div style="background: #FFF3CD; padding: 12px; border-radius: 4px; border-left: 3px solid #FFC107;">
      ${data.request.replace(/\n/g, '<br>')}
    </div>
    ` : ''}

    <div style="text-align: center; margin-top: 25px;">
      <a href="https://docs.google.com/spreadsheets/d/${CONFIG.SPREADSHEET_ID}/edit"
         style="background: #1A73E8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
        📊 시트에서 검토하기
      </a>
    </div>

    <hr style="margin: 25px 0; border: none; border-top: 1px solid #eee;">
    <p style="font-size: 12px; color: #999; text-align: center;">
      ⏰ 권장 검토 시간: ${CONFIG.BUSINESS.APPROVAL_TIMEOUT_HOURS}시간 이내<br>
      📅 접수: ${new Date().toLocaleString("ko-KR", {timeZone: "Asia/Jakarta"})}
    </p>
  </div>
</div>
  `;

  sendEmail(CONFIG.EMAILS.MANAGER, subject, body);
}


/**
 * 에이전트에게 접수 확인 알림
 */
function sendNewCaseConfirmToAgent(data) {
  const agentEmail = getAgentEmail(data.agent);
  if (!agentEmail) {
    Logger.log("에이전트 이메일 못 찾음: " + data.agent);
    return;
  }

  const subject = `[접수 완료] ${data.parentName} 케이스`;

  const body = `
<div style="font-family: Arial, sans-serif; max-width: 600px;">
  <h2 style="color: #34A853;">✅ 케이스 접수 완료</h2>

  <p>${data.agent}님, ${data.parentName} 학부모님 케이스가 접수되었습니다.</p>

  <div style="background: #E8F5E9; padding: 15px; border-radius: 8px; margin: 20px 0;">
    <h3 style="margin-top: 0;">📋 접수 내용</h3>
    <ul>
      <li>학부모: ${data.parentName}</li>
      <li>자녀: ${data.childName} (${data.childAge}세)</li>
      <li>사유: ${data.reason}</li>
    </ul>
  </div>

  <p><strong>다음 단계:</strong></p>
  <ol>
    <li>매니저가 ${CONFIG.BUSINESS.APPROVAL_TIMEOUT_HOURS}시간 내 검토</li>
    <li>승인 시 → 교사 자동 배정</li>
    <li>배정 완료 시 다시 알림 받으심</li>
  </ol>

  <p style="margin-top: 30px;">
    <a href="https://docs.google.com/spreadsheets/d/${CONFIG.SPREADSHEET_ID}/edit"
       style="color: #1A73E8;">
      📊 본인 시트에서 확인하기
    </a>
  </p>
</div>
  `;

  sendEmail(agentEmail, subject, body);
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 2. 매니저 승인/반려 시 알림
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * 트리거: 매니저 승인 컬럼 변경 시
 * 설정: 스프레드시트 → 수정 시
 */
function onApprovalChange(e) {
  try {
    // 편집된 셀 정보
    const range = e.range;
    const sheet = range.getSheet();

    // 메인 트래커 시트 + 매니저 승인 컬럼만 처리
    if (sheet.getName() !== CONFIG.SHEETS.MAIN_TRACKER) return;
    if (range.getColumn() !== CONFIG.COLUMNS.MANAGER_APPROVAL) return;

    const row = range.getRow();
    if (row < 2) return; // 헤더 제외

    const newValue = range.getValue();
    const oldValue = e.oldValue;

    // 변경 없으면 종료
    if (newValue === oldValue) return;

    // 해당 행 데이터 가져오기
    const rowData = sheet.getRange(row, 1, 1, sheet.getLastColumn()).getValues()[0];

    const data = {
      no: rowData[CONFIG.COLUMNS.NO - 1],
      agent: rowData[CONFIG.COLUMNS.AGENT - 1],
      parentName: rowData[CONFIG.COLUMNS.PARENT_NAME - 1],
      childName: rowData[CONFIG.COLUMNS.CHILD_NAME - 1],
      reason: rowData[CONFIG.COLUMNS.FAILURE_REASON - 1],
      teacher: rowData[CONFIG.COLUMNS.TEACHER - 1],
      newApproval: newValue,
    };

    // 승인 상태별 처리
    if (newValue === "승인") {
      handleApproved(data, row, sheet);
    } else if (newValue === "반려") {
      handleRejected(data);
    } else if (newValue === "보류") {
      handleOnHold(data);
    }

  } catch (error) {
    Logger.log("onApprovalChange 에러: " + error.message);
    sendErrorAlert("onApprovalChange", error);
  }
}


/**
 * 승인 시 처리
 */
function handleApproved(data, row, sheet) {
  // 1. 승인일 자동 입력
  sheet.getRange(row, CONFIG.COLUMNS.APPROVAL_DATE).setValue(new Date());

  // 2. 교사 자동 배정 (auto-assignment.gs)
  if (!data.teacher) {
    const assignedTeacher = autoAssignTeacher(data);
    if (assignedTeacher) {
      sheet.getRange(row, CONFIG.COLUMNS.TEACHER).setValue(assignedTeacher);
      data.teacher = assignedTeacher;
    }
  }

  // 3. 에이전트 알림
  notifyAgentApproved(data);

  // 4. 교사 알림
  if (data.teacher) {
    notifyTeacherAssigned(data);
  }
}


/**
 * 에이전트에게 승인 알림
 */
function notifyAgentApproved(data) {
  const agentEmail = getAgentEmail(data.agent);
  if (!agentEmail) return;

  const subject = `[✅ 승인] ${data.parentName} 케이스 - 교사: ${data.teacher || '배정 중'}`;

  const body = `
<div style="font-family: Arial, sans-serif; max-width: 600px;">
  <div style="background: #34A853; color: white; padding: 15px; border-radius: 8px;">
    <h2 style="margin: 0;">✅ 케이스 승인됨</h2>
  </div>

  <div style="padding: 20px;">
    <p>${data.agent}님, <strong>${data.parentName}</strong> 학부모님 케이스가 매니저 승인되었습니다.</p>

    <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
      <tr><td style="padding: 8px 0;">담당 교사:</td><td><strong style="color: #34A853;">${data.teacher || '배정 중'}</strong></td></tr>
      <tr><td style="padding: 8px 0;">자녀:</td><td>${data.childName}</td></tr>
      <tr><td style="padding: 8px 0;">사유:</td><td>${data.reason}</td></tr>
    </table>

    <div style="background: #FFF3CD; padding: 12px; border-radius: 4px; border-left: 3px solid #FFC107;">
      <strong>📋 다음 액션:</strong>
      <ol style="margin: 5px 0;">
        <li>학부모님에게 수업 일정 협의</li>
        <li>교사 ${data.teacher} 선생님과 일정 조율</li>
        <li>수업 후 ${CONFIG.BUSINESS.RECLOSE_DEADLINE_DAYS}일 내 재클로징 진행</li>
      </ol>
    </div>
  </div>
</div>
  `;

  sendEmail(agentEmail, subject, body);
}


/**
 * 교사에게 배정 알림
 */
function notifyTeacherAssigned(data) {
  const teacherEmail = getTeacherEmail(data.teacher);
  if (!teacherEmail) return;

  const subject = `[🎯 신규 배정] ${data.parentName} (${data.childName})`;

  const body = `
<div style="font-family: Arial, sans-serif; max-width: 600px;">
  <div style="background: #1A73E8; color: white; padding: 15px; border-radius: 8px;">
    <h2 style="margin: 0;">🎯 신규 수업 배정</h2>
  </div>

  <div style="padding: 20px;">
    <p>${data.teacher} 선생님, 새로운 수업이 배정되었습니다.</p>

    <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
      <tr><td style="padding: 8px 0;">학부모:</td><td><strong>${data.parentName}</strong></td></tr>
      <tr><td style="padding: 8px 0;">자녀:</td><td>${data.childName}</td></tr>
      <tr><td style="padding: 8px 0;">담당 에이전트:</td><td>${data.agent}</td></tr>
      <tr><td style="padding: 8px 0;">보류 사유:</td><td><span style="background: #FFE599; padding: 4px 8px; border-radius: 4px;">${data.reason}</span></td></tr>
    </table>

    <div style="background: #F8F9FA; padding: 12px; border-radius: 4px; margin: 15px 0;">
      <strong>💡 수업 준비 사항:</strong>
      <ul>
        <li>본인 시트에서 보류 사유별 수업 전략 확인</li>
        <li>학부모와 수업 일정 협의</li>
        <li>수업 후 결과 입력 폼 작성</li>
      </ul>
    </div>

    <p style="text-align: center; margin-top: 25px;">
      <a href="https://docs.google.com/spreadsheets/d/${CONFIG.SPREADSHEET_ID}/edit"
         style="background: #1A73E8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
        📊 시트에서 확인
      </a>
    </p>
  </div>
</div>
  `;

  sendEmail(teacherEmail, subject, body);
}


/**
 * 반려 시 처리
 */
function handleRejected(data) {
  const agentEmail = getAgentEmail(data.agent);
  if (!agentEmail) return;

  const subject = `[❌ 반려] ${data.parentName} 케이스`;

  const body = `
<div style="font-family: Arial, sans-serif; max-width: 600px;">
  <div style="background: #EA4335; color: white; padding: 15px; border-radius: 8px;">
    <h2 style="margin: 0;">❌ 케이스 반려</h2>
  </div>

  <div style="padding: 20px;">
    <p>${data.agent}님, ${data.parentName} 학부모님 케이스가 반려되었습니다.</p>

    <p>매니저와 상의 후 추가 조치를 결정해 주세요.</p>

    <div style="background: #F8F9FA; padding: 12px; border-radius: 4px;">
      <strong>가능한 다음 단계:</strong>
      <ul>
        <li>매니저 1:1 상담 요청</li>
        <li>추가 정보 보완 후 재신청</li>
        <li>다른 사유 검토 후 재시도</li>
      </ul>
    </div>
  </div>
</div>
  `;

  sendEmail(agentEmail, subject, body);
}


/**
 * 보류 시 처리
 */
function handleOnHold(data) {
  const agentEmail = getAgentEmail(data.agent);
  if (!agentEmail) return;

  const subject = `[⏸️ 보류] ${data.parentName} 케이스 - 매니저 추가 검토`;

  const body = `
<div style="font-family: Arial, sans-serif;">
  <h2>⏸️ 케이스 보류</h2>
  <p>${data.parentName} 케이스가 매니저 추가 검토 상태입니다.</p>
  <p>잠시 후 매니저로부터 추가 안내가 있을 예정입니다.</p>
</div>
  `;

  sendEmail(agentEmail, subject, body);
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 3. 수업 결과 입력 시 알림
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * 트리거: 수업 결과 컬럼 변경 시
 */
function onResultInput(e) {
  try {
    const range = e.range;
    const sheet = range.getSheet();

    if (sheet.getName() !== CONFIG.SHEETS.MAIN_TRACKER) return;
    if (range.getColumn() !== CONFIG.COLUMNS.LESSON_RESULT) return;

    const row = range.getRow();
    if (row < 2) return;

    const newValue = range.getValue();
    if (!newValue || newValue === e.oldValue) return;

    const rowData = sheet.getRange(row, 1, 1, sheet.getLastColumn()).getValues()[0];

    const data = {
      no: rowData[CONFIG.COLUMNS.NO - 1],
      agent: rowData[CONFIG.COLUMNS.AGENT - 1],
      parentName: rowData[CONFIG.COLUMNS.PARENT_NAME - 1],
      childName: rowData[CONFIG.COLUMNS.CHILD_NAME - 1],
      teacher: rowData[CONFIG.COLUMNS.TEACHER - 1],
      reason: rowData[CONFIG.COLUMNS.FAILURE_REASON - 1],
      closingSignal: rowData[CONFIG.COLUMNS.CLOSING_SIGNAL - 1],
      result: newValue,
    };

    // 결과별 처리
    if (newValue === "성공") {
      notifyLessonSuccess(data);
    } else if (newValue === "보류") {
      notifyLessonHeld(data);
    } else if (newValue === "실패") {
      notifyLessonFailed(data);
    }

  } catch (error) {
    Logger.log("onResultInput 에러: " + error.message);
  }
}


/**
 * 수업 성공 알림
 */
function notifyLessonSuccess(data) {
  const agentEmail = getAgentEmail(data.agent);
  if (!agentEmail) return;

  const subject = `[🎉 수업 성공] ${data.parentName} - 클로징 신호 ${data.closingSignal}`;

  const body = `
<div style="font-family: Arial, sans-serif; max-width: 600px;">
  <div style="background: #34A853; color: white; padding: 15px; border-radius: 8px;">
    <h2 style="margin: 0;">🎉 수업 성공!</h2>
  </div>

  <div style="padding: 20px;">
    <p><strong>${data.agent}</strong>님, 축하합니다!</p>

    <table style="width: 100%; border-collapse: collapse;">
      <tr><td>학부모:</td><td><strong>${data.parentName}</strong></td></tr>
      <tr><td>자녀:</td><td>${data.childName}</td></tr>
      <tr><td>교사:</td><td>${data.teacher}</td></tr>
      <tr><td>클로징 신호:</td><td><strong style="color: #34A853;">${data.closingSignal}</strong></td></tr>
    </table>

    <div style="background: #E8F5E9; padding: 12px; border-radius: 4px; margin: 15px 0;">
      <strong>📋 다음 액션:</strong>
      <ol>
        <li>${CONFIG.BUSINESS.RECLOSE_DEADLINE_DAYS}일 내 재클로징 시도</li>
        <li>계약 체결 진행</li>
        <li>완료 후 결과 폼 입력</li>
      </ol>
    </div>
  </div>
</div>
  `;

  sendEmail(agentEmail, subject, body);

  // 매니저에게도 CC
  sendEmail(CONFIG.EMAILS.MANAGER, `[Lidia 알림] ${subject}`, body);
}


/**
 * 수업 보류 알림
 */
function notifyLessonHeld(data) {
  const agentEmail = getAgentEmail(data.agent);
  if (!agentEmail) return;

  const subject = `[🟡 수업 보류] ${data.parentName} - ${CONFIG.BUSINESS.RECLOSE_DEADLINE_DAYS}일 내 재클로징 필요`;

  const body = `
<div style="font-family: Arial, sans-serif;">
  <h2>🟡 수업 보류</h2>
  <p>${data.parentName} 학부모님 수업이 보류 상태입니다.</p>
  <p><strong>${CONFIG.BUSINESS.RECLOSE_DEADLINE_DAYS}일 내 재클로징</strong>이 필요합니다.</p>
  <p>클로징 신호: ${data.closingSignal}</p>
</div>
  `;

  sendEmail(agentEmail, subject, body);
}


/**
 * 수업 실패 알림
 */
function notifyLessonFailed(data) {
  const agentEmail = getAgentEmail(data.agent);
  if (!agentEmail) return;

  const subject = `[🔴 수업 실패] ${data.parentName}`;

  const body = `
<div style="font-family: Arial, sans-serif;">
  <h2>🔴 수업 실패</h2>
  <p>${data.parentName} 학부모님 수업이 실패로 종료되었습니다.</p>
  <p>매니저와 사후 분석 미팅이 필요할 수 있습니다.</p>
</div>
  `;

  sendEmail(agentEmail, subject, body);
  sendEmail(CONFIG.EMAILS.MANAGER, `[Lidia 알림] ${subject}`, body);
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 에러 알림
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * 시스템 에러 발생 시 본부장에게 알림
 */
function sendErrorAlert(functionName, error) {
  const subject = `[⚠️ 시스템 에러] ${functionName}`;
  const body = `
<div style="font-family: Arial, sans-serif;">
  <h2 style="color: #EA4335;">⚠️ Apps Script 에러 발생</h2>
  <p><strong>함수:</strong> ${functionName}</p>
  <p><strong>시간:</strong> ${new Date().toLocaleString("ko-KR", {timeZone: "Asia/Jakarta"})}</p>
  <p><strong>에러 메시지:</strong></p>
  <pre style="background: #F8F9FA; padding: 12px; border-radius: 4px; overflow-x: auto;">${error.message}\n\n${error.stack || ''}</pre>
</div>
  `;

  MailApp.sendEmail({
    to: CONFIG.EMAILS.HEAD,
    subject: subject,
    htmlBody: body
  });
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 테스트 함수
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * 테스트: 신규 케이스 알림 (실제 데이터로 테스트)
 */
function testNewCaseAlert() {
  const testData = {
    agent: "GiAR",
    parentName: "테스트 학부모",
    parentPhone: "010-1234-5678",
    childName: "테스트 자녀",
    childAge: "5",
    firstMeeting: new Date(),
    firstResult: "보류",
    reason: "① 남편 반대",
    detail: "남편이 학원 보내고 싶어함. 효과 의구심.",
    region: "Jakarta Pusat",
    family: "외동",
    decisionMaker: "엄마",
    request: "여성 교사로 배정 부탁드립니다."
  };

  sendNewCaseAlertToManager(testData);
  sendNewCaseConfirmToAgent(testData);

  Logger.log("테스트 알림 발송 완료. 이메일 확인하세요.");
}


/**
 * 트리거 자동 등록 (한 번만 실행)
 */
function installTriggers() {
  // 기존 트리거 삭제
  const existing = ScriptApp.getProjectTriggers();
  existing.forEach(t => ScriptApp.deleteTrigger(t));

  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);

  // 폼 제출 트리거
  ScriptApp.newTrigger("onFormSubmit")
    .forSpreadsheet(ss)
    .onFormSubmit()
    .create();

  // 셀 편집 트리거
  ScriptApp.newTrigger("onApprovalChange")
    .forSpreadsheet(ss)
    .onEdit()
    .create();

  ScriptApp.newTrigger("onResultInput")
    .forSpreadsheet(ss)
    .onEdit()
    .create();

  Logger.log("트리거 설치 완료. 시계 아이콘에서 확인하세요.");
}
