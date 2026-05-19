import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  Profile,
  CaseWithUsers,
  APPROVAL_LABELS,
  LESSON_RESULT_LABELS,
  CLOSING_SIGNAL_LABELS,
} from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, formatDateTime, calculateDDay } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import ManagerActions from "./manager-actions";
import TeacherActions from "./teacher-actions";

export default async function CaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();

  if (!profile) redirect("/login");

  const { data: caseData } = await supabase
    .from("cases_with_users")
    .select("*")
    .eq("id", id)
    .single<CaseWithUsers>();

  if (!caseData) notFound();

  const { data: teachers } = await supabase
    .from("profiles")
    .select("id, full_name, region")
    .eq("role", "teacher")
    .eq("active", true);

  const isManager = profile.role === "manager" || profile.role === "head";
  const isAssignedTeacher = caseData.teacher_id === profile.id;
  const dday = caseData.approval_status === "approved" && !caseData.lesson_result
    ? calculateDDay(caseData.approval_date)
    : null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <Link
          href="/cases"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-3"
        >
          <ArrowLeft size={14} />
          전체 케이스로 돌아가기
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              {caseData.parent_name}{" "}
              <span className="text-gray-400 font-normal">#{caseData.case_no}</span>
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {caseData.child_name} ({caseData.child_age}세) · {caseData.region ?? "지역 미정"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant={
                caseData.approval_status === "approved"
                  ? "success"
                  : caseData.approval_status === "rejected"
                  ? "danger"
                  : caseData.approval_status === "on_hold"
                  ? "neutral"
                  : "warning"
              }
            >
              {APPROVAL_LABELS[caseData.approval_status]}
            </Badge>
            {dday && (
              <Badge
                variant={
                  dday.variant === "expired" || dday.variant === "danger"
                    ? "danger"
                    : dday.variant === "warning"
                    ? "warning"
                    : "neutral"
                }
              >
                {dday.label}
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>👨‍👩‍👧 학부모 / 자녀</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3 text-sm">
              <Field label="학부모">{caseData.parent_name}</Field>
              <Field label="연락처">{caseData.parent_phone ?? "-"}</Field>
              <Field label="자녀">
                {caseData.child_name} ({caseData.child_age}세)
              </Field>
              <Field label="지역">{caseData.region ?? "-"}</Field>
              <Field label="의사 결정자">{caseData.decision_maker ?? "-"}</Field>
              <Field label="가족 정보">{caseData.family_info ?? "-"}</Field>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>💼 영업 / 사유</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3 text-sm">
              <Field label="에이전트">{caseData.agent_name}</Field>
              <Field label="신청일">{formatDate(caseData.apply_date)}</Field>
              <Field label="보류 사유">
                <Badge variant="warning">{caseData.failure_reason}</Badge>
              </Field>
              {caseData.failure_detail && (
                <Field label="상세">
                  <div className="text-gray-700 whitespace-pre-wrap">
                    {caseData.failure_detail}
                  </div>
                </Field>
              )}
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>✅ 매니저 검토</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3 text-sm">
              <Field label="상태">
                <Badge
                  variant={
                    caseData.approval_status === "approved"
                      ? "success"
                      : caseData.approval_status === "rejected"
                      ? "danger"
                      : caseData.approval_status === "on_hold"
                      ? "neutral"
                      : "warning"
                  }
                >
                  {APPROVAL_LABELS[caseData.approval_status]}
                </Badge>
              </Field>
              <Field label="승인일">{formatDateTime(caseData.approval_date)}</Field>
              <Field label="처리자">{caseData.approver_name ?? "-"}</Field>
              {caseData.rejection_reason && (
                <Field label="반려 사유">{caseData.rejection_reason}</Field>
              )}
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>👩‍🏫 교사 / 수업</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3 text-sm">
              <Field label="배정 교사">{caseData.teacher_name ?? "미배정"}</Field>
              <Field label="배정일">{formatDateTime(caseData.assigned_at)}</Field>
              <Field label="수업일">{formatDate(caseData.lesson_date)}</Field>
              <Field label="수업 시간">{caseData.lesson_time ?? "-"}</Field>
              {caseData.lesson_result && (
                <>
                  <Field label="수업 결과">
                    <Badge
                      variant={
                        caseData.lesson_result === "success"
                          ? "success"
                          : caseData.lesson_result === "failed"
                          ? "danger"
                          : "warning"
                      }
                    >
                      {LESSON_RESULT_LABELS[caseData.lesson_result]}
                    </Badge>
                  </Field>
                  {caseData.closing_signal && (
                    <Field label="클로징 신호">
                      <Badge
                        variant={
                          caseData.closing_signal === "strong"
                            ? "success"
                            : caseData.closing_signal === "medium"
                            ? "warning"
                            : "danger"
                        }
                      >
                        {CLOSING_SIGNAL_LABELS[caseData.closing_signal]}
                      </Badge>
                    </Field>
                  )}
                  {caseData.parent_feedback && (
                    <Field label="학부모 반응">
                      <div className="text-gray-700 whitespace-pre-wrap">
                        {caseData.parent_feedback}
                      </div>
                    </Field>
                  )}
                  {caseData.next_action && (
                    <Field label="다음 액션">{caseData.next_action}</Field>
                  )}
                </>
              )}
            </dl>
          </CardContent>
        </Card>
      </div>

      {isManager && caseData.approval_status === "pending" && (
        <ManagerActions
          caseId={caseData.id}
          teachers={(teachers as { id: string; full_name: string; region: string | null }[]) ?? []}
        />
      )}

      {isAssignedTeacher && !caseData.lesson_result && caseData.approval_status === "approved" && (
        <TeacherActions caseId={caseData.id} />
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <dt className="w-24 shrink-0 text-gray-500">{label}</dt>
      <dd className="flex-1 min-w-0">{children}</dd>
    </div>
  );
}
