/**
 * monthly-report.gs
 *
 * Lidia 운영 자동화 - 월간 자동 리포트
 *
 * 작동:
 * - 매월 1일 오전 9시 자동 실행
 * - 전월 데이터 집계
 * - PDF 자동 생성
 * - 본부장 + 매니저에게 이메일 발송
 *
 * 트리거 설정:
 * - 시간 기반 → 월 단위 타이머 → 1일 → 오전 9-10시
 * - 함수: sendMonthlyReport
 */


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 메인 함수
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * 매월 1일 자동 실행
 */
function sendMonthlyReport() {
  try {
    Logger.log("=== 월간 리포트 생성 시작: " + new Date() + " ===");

    // 1. 전월 데이터 수집
    const reportData = collectMonthlyData();

    // 2. 임시 시트에 리포트 작성
    const reportSheet = createReportSheet(reportData);

    // 3. PDF 생성
    const pdfBlob = generatePDF(reportSheet, reportData);

    // 4. Google Drive에 저장
    const folder = getOrCreateFolder("Lidia 월간 리포트");
    const file = folder.createFile(pdfBlob);

    // 5. 본부장에게 이메일 발송
    sendReportEmail(file, reportData);

    // 6. 임시 시트 삭제
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    ss.deleteSheet(reportSheet);

    Logger.log("=== 월간 리포트 완료 ===");

  } catch (error) {
    Logger.log("sendMonthlyReport 에러: " + error.message);
    sendErrorAlert("sendMonthlyReport", error);
  }
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 1. 데이터 수집
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function collectMonthlyData() {
  const allData = getAllData();

  // 전월 시작/종료일
  const today = new Date();
  const firstOfThisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastOfLastMonth = new Date(firstOfThisMonth);
  lastOfLastMonth.setDate(lastOfLastMonth.getDate() - 1);
  const firstOfLastMonth = new Date(lastOfLastMonth.getFullYear(), lastOfLastMonth.getMonth(), 1);

  // 전전월 (비교용)
  const firstOfPrevMonth = new Date(firstOfLastMonth);
  firstOfPrevMonth.setMonth(firstOfPrevMonth.getMonth() - 1);
  const lastOfPrevMonth = new Date(firstOfLastMonth);
  lastOfPrevMonth.setDate(lastOfPrevMonth.getDate() - 1);

  Logger.log("리포트 기간: " + formatDate(firstOfLastMonth) + " ~ " + formatDate(lastOfLastMonth));

  // 데이터 분류
  const data = {
    period: {
      start: firstOfLastMonth,
      end: lastOfLastMonth,
      label: Utilities.formatDate(firstOfLastMonth, "Asia/Jakarta", "yyyy년 MM월"),
    },
    previousPeriod: {
      start: firstOfPrevMonth,
      end: lastOfPrevMonth,
    },
    totals: {
      applications: 0,
      approved: 0,
      rejected: 0,
      lessonsCompleted: 0,
      success: 0,
      failed: 0,
      held: 0,
    },
    previousTotals: {
      applications: 0,
      success: 0,
    },
    byAgent: {},
    byTeacher: {},
    byReason: {},
    byRegion: {},
    byDecisionMaker: {},
    byClosingSignal: { 강: 0, 중: 0, 약: 0 },
    timeline: {},  // 일자별 데이터
    insights: [],
  };

  // 전월 데이터
  allData.forEach(row => {
    const applyDate = row[CONFIG.COLUMNS.APPLY_DATE - 1];
    const lessonDate = row[CONFIG.COLUMNS.LESSON_DATE - 1];
    const approval = row[CONFIG.COLUMNS.MANAGER_APPROVAL - 1];
    const result = row[CONFIG.COLUMNS.LESSON_RESULT - 1];
    const closingSignal = row[CONFIG.COLUMNS.CLOSING_SIGNAL - 1];

    const agent = row[CONFIG.COLUMNS.AGENT - 1];
    const teacher = row[CONFIG.COLUMNS.TEACHER - 1];
    const reason = row[CONFIG.COLUMNS.FAILURE_REASON - 1];
    const region = row[CONFIG.COLUMNS.REGION - 1];
    const decisionMaker = row[CONFIG.COLUMNS.DECISION_MAKER - 1];

    // 전월 신청
    if (applyDate >= firstOfLastMonth && applyDate <= lastOfLastMonth) {
      data.totals.applications++;

      // 일자별 (히스토그램)
      const day = formatDate(applyDate);
      data.timeline[day] = (data.timeline[day] || 0) + 1;

      // 에이전트별
      if (!data.byAgent[agent]) {
        data.byAgent[agent] = { applied: 0, success: 0, failed: 0, held: 0, total: 0 };
      }
      data.byAgent[agent].applied++;

      // 사유별
      if (reason) {
        data.byReason[reason] = (data.byReason[reason] || 0) + 1;
      }

      // 지역별
      if (region) {
        data.byRegion[region] = (data.byRegion[region] || 0) + 1;
      }

      // 의사결정자별
      if (decisionMaker) {
        data.byDecisionMaker[decisionMaker] = (data.byDecisionMaker[decisionMaker] || 0) + 1;
      }

      // 승인/반려
      if (approval === "승인") data.totals.approved++;
      if (approval === "반려") data.totals.rejected++;
    }

    // 전월 수업 완료
    if (lessonDate >= firstOfLastMonth && lessonDate <= lastOfLastMonth && result) {
      data.totals.lessonsCompleted++;

      // 결과별
      if (result === "성공") data.totals.success++;
      else if (result === "실패") data.totals.failed++;
      else if (result === "보류") data.totals.held++;

      // 에이전트별 결과
      if (data.byAgent[agent]) {
        if (result === "성공") data.byAgent[agent].success++;
        else if (result === "실패") data.byAgent[agent].failed++;
        else if (result === "보류") data.byAgent[agent].held++;
      }

      // 교사별
      if (teacher) {
        if (!data.byTeacher[teacher]) {
          data.byTeacher[teacher] = { total: 0, success: 0 };
        }
        data.byTeacher[teacher].total++;
        if (result === "성공") data.byTeacher[teacher].success++;
      }

      // 클로징 신호
      if (closingSignal && data.byClosingSignal.hasOwnProperty(closingSignal)) {
        data.byClosingSignal[closingSignal]++;
      }
    }

    // 전전월 (비교용)
    if (applyDate >= firstOfPrevMonth && applyDate <= lastOfPrevMonth) {
      data.previousTotals.applications++;
      if (result === "성공") data.previousTotals.success++;
    }
  });

  // 인사이트 자동 생성
  data.insights = generateInsights(data);

  return data;
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 2. 인사이트 자동 생성
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function generateInsights(data) {
  const insights = [];

  // 1. 전월 대비 신청 변화
  if (data.previousTotals.applications > 0) {
    const change = data.totals.applications - data.previousTotals.applications;
    const pct = (change / data.previousTotals.applications * 100).toFixed(1);
    insights.push({
      type: change >= 0 ? "positive" : "negative",
      title: "신청 건수 변화",
      description: `전월 대비 ${change >= 0 ? '▲' : '▼'} ${Math.abs(change)}건 (${pct}%)`,
    });
  }

  // 2. 성공률
  const successRate = data.totals.applications > 0
    ? (data.totals.success / data.totals.applications * 100).toFixed(1)
    : 0;
  insights.push({
    type: successRate >= 40 ? "positive" : "negative",
    title: "성공률",
    description: `${successRate}% (목표: 40% 이상)`,
  });

  // 3. 가장 많은 실패 사유
  if (Object.keys(data.byReason).length > 0) {
    const topReason = Object.entries(data.byReason)
      .sort((a, b) => b[1] - a[1])[0];
    insights.push({
      type: "info",
      title: "가장 많은 보류 사유",
      description: `${topReason[0]} (${topReason[1]}건, ${(topReason[1] / data.totals.applications * 100).toFixed(0)}%)`,
    });
  }

  // 4. 최고 성과 에이전트
  if (Object.keys(data.byAgent).length > 0) {
    const topAgent = Object.entries(data.byAgent)
      .filter(([_, perf]) => perf.applied >= 3)
      .map(([name, perf]) => ({
        name,
        rate: perf.applied > 0 ? perf.success / perf.applied : 0,
        ...perf
      }))
      .sort((a, b) => b.rate - a.rate)[0];

    if (topAgent) {
      insights.push({
        type: "positive",
        title: "최고 성과 에이전트",
        description: `${topAgent.name}: ${topAgent.success}/${topAgent.applied} (${(topAgent.rate * 100).toFixed(0)}%)`,
      });
    }
  }

  // 5. 교사 부하 편차
  if (Object.keys(data.byTeacher).length > 0) {
    const workloads = Object.values(data.byTeacher).map(t => t.total);
    const max = Math.max(...workloads);
    const min = Math.min(...workloads);
    if (max - min >= 5) {
      insights.push({
        type: "warning",
        title: "교사 부하 편차",
        description: `최대 ${max}건 vs 최소 ${min}건 (차이 ${max - min}건) - 분산 필요`,
      });
    }
  }

  // 6. 클로징 신호 분포
  const totalSignals = Object.values(data.byClosingSignal).reduce((a, b) => a + b, 0);
  if (totalSignals > 0) {
    const strongPct = (data.byClosingSignal.강 / totalSignals * 100).toFixed(0);
    insights.push({
      type: strongPct >= 40 ? "positive" : "info",
      title: "강한 클로징 신호",
      description: `${strongPct}% (강 ${data.byClosingSignal.강}건 / 전체 ${totalSignals}건)`,
    });
  }

  return insights;
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 3. 리포트 시트 생성
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function createReportSheet(data) {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheetName = "월간리포트_" + Utilities.formatDate(data.period.start, "Asia/Jakarta", "yyyyMM");

  // 기존 시트 삭제
  const existing = ss.getSheetByName(sheetName);
  if (existing) ss.deleteSheet(existing);

  const sheet = ss.insertSheet(sheetName);

  // ━━━ 표지 ━━━
  sheet.getRange("A1:H1").merge()
    .setValue("📊 Lidia 월간 운영 리포트")
    .setFontSize(24)
    .setFontWeight("bold")
    .setBackground("#1A73E8")
    .setFontColor("#FFFFFF")
    .setHorizontalAlignment("center");

  sheet.getRange("A2:H2").merge()
    .setValue(data.period.label + " (" + formatDate(data.period.start) + " ~ " + formatDate(data.period.end) + ")")
    .setFontSize(14)
    .setBackground("#E3F2FD")
    .setHorizontalAlignment("center");

  // ━━━ 핵심 KPI ━━━
  let row = 4;
  sheet.getRange(`A${row}:H${row}`).merge()
    .setValue("핵심 KPI")
    .setFontSize(16)
    .setFontWeight("bold")
    .setBackground("#F8F9FA");

  row++;
  const kpis = [
    ["📋 신청", data.totals.applications, data.previousTotals.applications],
    ["✅ 승인", data.totals.approved, "-"],
    ["❌ 반려", data.totals.rejected, "-"],
    ["🎉 성공", data.totals.success, data.previousTotals.success],
    ["💔 실패", data.totals.failed, "-"],
    ["⏸️ 보류", data.totals.held, "-"],
  ];

  sheet.getRange(row, 1, 1, 4).setValues([["지표", "전월", "전전월", "변화"]])
    .setFontWeight("bold").setBackground("#F8F9FA");
  row++;

  kpis.forEach(kpi => {
    const change = typeof kpi[2] === "number" ? kpi[1] - kpi[2] : "-";
    const changeStr = typeof change === "number"
      ? (change >= 0 ? `▲ ${change}` : `▼ ${Math.abs(change)}`)
      : "-";

    sheet.getRange(row, 1, 1, 4).setValues([[kpi[0], kpi[1], kpi[2], changeStr]]);
    row++;
  });

  // ━━━ 인사이트 ━━━
  row += 2;
  sheet.getRange(`A${row}:H${row}`).merge()
    .setValue("💡 핵심 인사이트")
    .setFontSize(16)
    .setFontWeight("bold")
    .setBackground("#FFF3E0");

  row++;
  data.insights.forEach(insight => {
    const colors = {
      positive: "#E8F5E9",
      negative: "#FFEBEE",
      warning: "#FFF3E0",
      info: "#E3F2FD",
    };

    sheet.getRange(row, 1).setValue(insight.title).setFontWeight("bold");
    sheet.getRange(row, 2, 1, 7).merge().setValue(insight.description);
    sheet.getRange(row, 1, 1, 8).setBackground(colors[insight.type]);
    row++;
  });

  // ━━━ 에이전트별 성과 ━━━
  row += 2;
  sheet.getRange(`A${row}:H${row}`).merge()
    .setValue("👤 에이전트별 성과")
    .setFontSize(16).setFontWeight("bold").setBackground("#F8F9FA");

  row++;
  sheet.getRange(row, 1, 1, 6).setValues([
    ["에이전트", "신청", "성공", "실패", "보류", "성공률"]
  ]).setFontWeight("bold").setBackground("#F8F9FA");
  row++;

  Object.entries(data.byAgent)
    .sort((a, b) => b[1].success - a[1].success)
    .forEach(([agent, perf]) => {
      const rate = perf.applied > 0 ? (perf.success / perf.applied * 100).toFixed(0) + "%" : "0%";
      sheet.getRange(row, 1, 1, 6).setValues([[
        agent, perf.applied, perf.success, perf.failed, perf.held, rate
      ]]);
      row++;
    });

  // ━━━ 교사별 성과 ━━━
  row += 2;
  sheet.getRange(`A${row}:H${row}`).merge()
    .setValue("👩‍🏫 교사별 성과").setFontSize(16).setFontWeight("bold").setBackground("#F8F9FA");

  row++;
  sheet.getRange(row, 1, 1, 4).setValues([
    ["교사", "총 수업", "성공", "성공률"]
  ]).setFontWeight("bold").setBackground("#F8F9FA");
  row++;

  Object.entries(data.byTeacher)
    .sort((a, b) => b[1].total - a[1].total)
    .forEach(([teacher, perf]) => {
      const rate = perf.total > 0 ? (perf.success / perf.total * 100).toFixed(0) + "%" : "0%";
      sheet.getRange(row, 1, 1, 4).setValues([[
        teacher, perf.total, perf.success, rate
      ]]);
      row++;
    });

  // ━━━ 실패 사유 분포 ━━━
  row += 2;
  sheet.getRange(`A${row}:H${row}`).merge()
    .setValue("📊 보류 사유 분포").setFontSize(16).setFontWeight("bold").setBackground("#F8F9FA");

  row++;
  sheet.getRange(row, 1, 1, 3).setValues([
    ["사유", "건수", "비율"]
  ]).setFontWeight("bold").setBackground("#F8F9FA");
  row++;

  Object.entries(data.byReason)
    .sort((a, b) => b[1] - a[1])
    .forEach(([reason, count]) => {
      const pct = (count / data.totals.applications * 100).toFixed(0) + "%";
      sheet.getRange(row, 1, 1, 3).setValues([[reason, count, pct]]);
      row++;
    });

  // ━━━ 지역별 분포 ━━━
  row += 2;
  sheet.getRange(`A${row}:H${row}`).merge()
    .setValue("🗺️ 지역별 분포").setFontSize(16).setFontWeight("bold").setBackground("#F8F9FA");

  row++;
  sheet.getRange(row, 1, 1, 2).setValues([["지역", "건수"]])
    .setFontWeight("bold").setBackground("#F8F9FA");
  row++;

  Object.entries(data.byRegion)
    .sort((a, b) => b[1] - a[1])
    .forEach(([region, count]) => {
      sheet.getRange(row, 1, 1, 2).setValues([[region, count]]);
      row++;
    });

  // ━━━ 컬럼 너비 조정 ━━━
  sheet.setColumnWidth(1, 200);
  for (let i = 2; i <= 8; i++) {
    sheet.setColumnWidth(i, 100);
  }

  return sheet;
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 4. PDF 생성
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function generatePDF(sheet, data) {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const url = "https://docs.google.com/spreadsheets/d/" + ss.getId() + "/export?";
  const params = {
    format: "pdf",
    gid: sheet.getSheetId(),
    portrait: "true",
    size: "A4",
    fitw: "true",
    sheetnames: "false",
    printtitle: "false",
    pagenumbers: "true",
    gridlines: "false",
    fzr: "false",
    top_margin: "0.5",
    bottom_margin: "0.5",
    left_margin: "0.5",
    right_margin: "0.5",
  };

  const queryString = Object.keys(params)
    .map(k => k + "=" + params[k])
    .join("&");

  const fullUrl = url + queryString;

  const response = UrlFetchApp.fetch(fullUrl, {
    headers: {
      Authorization: "Bearer " + ScriptApp.getOAuthToken()
    }
  });

  const pdfBlob = response.getBlob();
  const fileName = "Lidia_월간리포트_" + Utilities.formatDate(data.period.start, "Asia/Jakarta", "yyyyMM") + ".pdf";
  pdfBlob.setName(fileName);

  return pdfBlob;
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 5. Drive 폴더 관리
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function getOrCreateFolder(folderName) {
  const folders = DriveApp.getFoldersByName(folderName);
  if (folders.hasNext()) {
    return folders.next();
  }
  return DriveApp.createFolder(folderName);
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 6. 이메일 발송
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function sendReportEmail(pdfFile, data) {
  const subject = `[📊 월간 리포트] ${data.period.label}`;

  const successRate = data.totals.applications > 0
    ? (data.totals.success / data.totals.applications * 100).toFixed(1)
    : 0;

  const body = `
<div style="font-family: Arial, sans-serif; max-width: 700px;">
  <div style="background: linear-gradient(135deg, #1A73E8, #34A853); color: white; padding: 30px; border-radius: 8px;">
    <h1 style="margin: 0;">📊 ${data.period.label} 운영 리포트</h1>
    <p style="margin: 10px 0 0 0; opacity: 0.95; font-size: 16px;">
      ${formatDate(data.period.start)} ~ ${formatDate(data.period.end)}
    </p>
  </div>

  <!-- 핵심 KPI -->
  <div style="margin: 25px 0;">
    <h2 style="color: #1A73E8;">🎯 핵심 성과</h2>
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="background: #E3F2FD; padding: 20px; text-align: center; border-radius: 8px;">
          <div style="font-size: 36px; font-weight: bold; color: #1A73E8;">${data.totals.applications}</div>
          <div style="color: #666;">📋 신청</div>
        </td>
        <td style="width: 10px;"></td>
        <td style="background: #E8F5E9; padding: 20px; text-align: center; border-radius: 8px;">
          <div style="font-size: 36px; font-weight: bold; color: #34A853;">${data.totals.success}</div>
          <div style="color: #666;">✅ 성공</div>
        </td>
        <td style="width: 10px;"></td>
        <td style="background: #FFF3E0; padding: 20px; text-align: center; border-radius: 8px;">
          <div style="font-size: 36px; font-weight: bold; color: #FF9800;">${successRate}%</div>
          <div style="color: #666;">📊 성공률</div>
        </td>
      </tr>
    </table>
  </div>

  <!-- 인사이트 -->
  <h2 style="color: #1A73E8;">💡 핵심 인사이트</h2>
  ${data.insights.map(insight => {
    const colors = {
      positive: { bg: "#E8F5E9", border: "#34A853" },
      negative: { bg: "#FFEBEE", border: "#EA4335" },
      warning: { bg: "#FFF3E0", border: "#FF9800" },
      info: { bg: "#E3F2FD", border: "#1A73E8" },
    };
    const color = colors[insight.type];
    return `
    <div style="background: ${color.bg}; border-left: 4px solid ${color.border};
                padding: 15px; border-radius: 4px; margin: 10px 0;">
      <strong>${insight.title}</strong><br>
      <span style="color: #555;">${insight.description}</span>
    </div>
    `;
  }).join('')}

  <!-- 최고 성과 에이전트 -->
  <h2 style="color: #1A73E8; margin-top: 30px;">🏆 최고 성과 에이전트 TOP 3</h2>
  <ol>
    ${Object.entries(data.byAgent)
      .filter(([_, p]) => p.applied >= 3)
      .map(([name, p]) => ({
        name,
        applied: p.applied,
        success: p.success,
        rate: p.applied > 0 ? p.success / p.applied : 0
      }))
      .sort((a, b) => b.rate - a.rate)
      .slice(0, 3)
      .map(a => `
      <li>
        <strong>${a.name}</strong>:
        ${a.success}/${a.applied}건 성공 (${(a.rate * 100).toFixed(0)}%)
      </li>
    `).join('')}
  </ol>

  <!-- 상세 리포트 -->
  <div style="background: #F8F9FA; padding: 20px; border-radius: 8px; margin-top: 30px;">
    <h3 style="margin-top: 0;">📎 첨부 파일</h3>
    <p>전체 상세 리포트는 첨부된 PDF를 확인하세요.</p>
    <ul>
      <li>에이전트별 상세 성과</li>
      <li>교사별 상세 성과</li>
      <li>지역별/사유별/의사결정자별 분석</li>
      <li>일자별 추이</li>
    </ul>
  </div>

  <!-- 다음 달 액션 아이템 -->
  <div style="background: #E8F5E9; padding: 20px; border-radius: 8px; margin-top: 20px;">
    <h3 style="margin-top: 0;">📋 다음 달 권장 액션</h3>
    <ul>
      <li>최다 사유에 대한 대응 전략 회의</li>
      <li>저성과 에이전트 1:1 코칭</li>
      <li>교사 부하 분산 점검</li>
      <li>지역별 신규 교사 채용 검토</li>
    </ul>
  </div>

  <hr style="margin: 30px 0;">
  <p style="text-align: center; color: #999; font-size: 11px;">
    매월 1일 오전 9시 자동 발송 | 본부장 + 매니저
  </p>
</div>
  `;

  // PDF 첨부 + 발송
  MailApp.sendEmail({
    to: CONFIG.EMAILS.HEAD,
    cc: CONFIG.EMAILS.MANAGER,
    subject: subject,
    htmlBody: body,
    attachments: [pdfFile.getBlob()],
    name: CONFIG.EMAILS.FROM_NAME
  });

  logNotification(CONFIG.EMAILS.HEAD, subject, "성공 (PDF 첨부)");
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 테스트 함수
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * 테스트: 월간 리포트 즉시 생성
 */
function testMonthlyReport() {
  Logger.log("월간 리포트 테스트 시작");
  sendMonthlyReport();
  Logger.log("월간 리포트 테스트 완료");
}


/**
 * 트리거 설치
 */
function installMonthlyReportTrigger() {
  const existing = ScriptApp.getProjectTriggers();
  existing.forEach(t => {
    if (t.getHandlerFunction() === "sendMonthlyReport") {
      ScriptApp.deleteTrigger(t);
    }
  });

  ScriptApp.newTrigger("sendMonthlyReport")
    .timeBased()
    .onMonthDay(1)
    .atHour(9)
    .inTimezone("Asia/Jakarta")
    .create();

  Logger.log("매월 1일 9시 트리거 설치 완료");
}
