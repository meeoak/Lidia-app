export type UserRole = "head" | "manager" | "agent" | "teacher";
export type ApprovalStatus = "pending" | "approved" | "rejected" | "on_hold";
export type LessonResult = "success" | "on_hold" | "failed" | "no_show";
export type ClosingSignal = "strong" | "medium" | "weak";
export type RecloseResult = "success" | "in_progress" | "failed";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  region: string | null;
  phone: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Case {
  id: string;
  case_no: number;
  agent_id: string;
  apply_date: string;
  parent_name: string;
  parent_phone: string | null;
  child_name: string;
  child_age: number | null;
  failure_reason: string;
  failure_detail: string | null;
  region: string | null;
  decision_maker: string | null;
  family_info: string | null;
  approval_status: ApprovalStatus;
  approval_date: string | null;
  approved_by: string | null;
  rejection_reason: string | null;
  teacher_id: string | null;
  assigned_at: string | null;
  lesson_date: string | null;
  lesson_time: string | null;
  lesson_result: LessonResult | null;
  closing_signal: ClosingSignal | null;
  parent_feedback: string | null;
  next_action: string | null;
  reclose_date: string | null;
  reclose_result: RecloseResult | null;
  reclose_note: string | null;
  manager_note: string | null;
  created_at: string;
  updated_at: string;
}

export interface CaseWithUsers extends Case {
  agent_name: string;
  agent_email: string;
  teacher_name: string | null;
  teacher_email: string | null;
  approver_name: string | null;
  d_day_remaining: number | null;
}

export const FAILURE_REASONS = [
  "① 남편 반대",
  "② 큰 지출 부담",
  "③ 우선순위 미흡",
  "④ 결정 지연",
  "⑤ 효과 의구심",
  "⑥ 학원/방문 대안 고려",
  "⑦ 자녀 거부",
  "⑧ 가격 부담",
  "⑨ 기타",
] as const;

export const REGIONS = [
  "Jakarta Pusat",
  "Jakarta Selatan",
  "Jakarta Utara",
  "Jakarta Timur",
  "Jakarta Barat",
  "Tangerang",
  "Depok",
  "Bekasi",
] as const;

export const DECISION_MAKERS = ["엄마", "아빠", "부부공동", "기타가족"] as const;

export const ROLE_LABELS: Record<UserRole, string> = {
  head: "본부장",
  manager: "매니저",
  agent: "에이전트",
  teacher: "교사",
};

export const APPROVAL_LABELS: Record<ApprovalStatus, string> = {
  pending: "승인 대기",
  approved: "승인",
  rejected: "반려",
  on_hold: "보류",
};

export const LESSON_RESULT_LABELS: Record<LessonResult, string> = {
  success: "성공",
  on_hold: "보류",
  failed: "실패",
  no_show: "미진행",
};

export const CLOSING_SIGNAL_LABELS: Record<ClosingSignal, string> = {
  strong: "강",
  medium: "중",
  weak: "약",
};
