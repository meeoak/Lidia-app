import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Profile, CaseWithUsers, APPROVAL_LABELS, LESSON_RESULT_LABELS } from "@/lib/types";
import { KpiCard } from "@/components/ui/kpi-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, calculateDDay } from "@/lib/utils";
import { ClipboardList, CheckCircle, AlertCircle, Clock, Plus } from "lucide-react";

export default async function AgentDashboard({ profile }: { profile: Profile }) {
  const supabase = await createClient();

  const { data: cases } = await supabase
    .from("cases_with_users")
    .select("*")
    .eq("agent_id", profile.id)
    .order("created_at", { ascending: false })
    .returns<CaseWithUsers[]>();

  const myCases = cases ?? [];

  const inProgress = myCases.filter(
    (c) => c.approval_status === "approved" && !c.lesson_result
  );

  const pending = myCases.filter((c) => c.approval_status === "pending");

  const urgentCases = inProgress
    .map((c) => ({ ...c, dday: calculateDDay(c.approval_date) }))
    .filter((c) => c.dday.variant === "danger" || c.dday.variant === "expired")
    .sort((a, b) => a.dday.remaining - b.dday.remaining);

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const thisMonthSuccess = myCases.filter(
    (c) =>
      c.lesson_result === "success" &&
      c.lesson_date &&
      new Date(c.lesson_date) >= startOfMonth
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">👋 {profile.full_name}님의 오늘</h1>
          <p className="text-sm text-gray-500 mt-1">진행 중인 본인 케이스 현황입니다.</p>
        </div>
        <Link href="/cases/new">
          <Button>
            <Plus size={16} />
            신규 신청
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="진행 중" value={inProgress.length} icon={<ClipboardList size={20} />} variant="info" />
        <KpiCard label="승인 대기" value={pending.length} icon={<Clock size={20} />} variant="warning" />
        <KpiCard
          label="D-Day 임박"
          value={urgentCases.length}
          icon={<AlertCircle size={20} />}
          variant="danger"
        />
        <KpiCard
          label="이번 달 성공"
          value={thisMonthSuccess.length}
          icon={<CheckCircle size={20} />}
          variant="success"
        />
      </div>

      {urgentCases.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>🚨 오늘 액션 필요</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {urgentCases.map((c) => (
                <Link
                  key={c.id}
                  href={`/cases/${c.id}`}
                  className="block p-4 rounded-lg border-l-4 border-red-500 bg-red-50 hover:bg-red-100 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900">
                        {c.parent_name} ({c.child_name}, {c.child_age}세)
                      </div>
                      <div className="text-sm text-gray-600 mt-1 space-y-0.5">
                        <div>💼 사유: {c.failure_reason}</div>
                        <div>👩‍🏫 교사: {c.teacher_name ?? "배정 중"}</div>
                        <div>📅 마지막 수업: {formatDate(c.lesson_date)}</div>
                      </div>
                    </div>
                    <Badge variant="danger">{c.dday.label}</Badge>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>📝 내 케이스</CardTitle>
        </CardHeader>
        <CardContent>
          {myCases.length === 0 ? (
            <div className="py-12 text-center">
              <ClipboardList className="mx-auto text-gray-400" size={40} />
              <p className="mt-3 text-sm text-gray-500">아직 등록된 케이스가 없습니다.</p>
              <Link href="/cases/new" className="inline-block mt-4">
                <Button size="sm">
                  <Plus size={16} />
                  첫 케이스 등록
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {myCases.slice(0, 10).map((c) => (
                <Link
                  key={c.id}
                  href={`/cases/${c.id}`}
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">
                      {c.parent_name}{" "}
                      <span className="text-gray-500 font-normal">({c.child_name})</span>
                    </div>
                    <div className="text-sm text-gray-500 mt-0.5">
                      {c.failure_reason} · {formatDate(c.apply_date)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        c.approval_status === "approved"
                          ? "success"
                          : c.approval_status === "rejected"
                          ? "danger"
                          : c.approval_status === "on_hold"
                          ? "neutral"
                          : "warning"
                      }
                    >
                      {APPROVAL_LABELS[c.approval_status]}
                    </Badge>
                    {c.lesson_result && (
                      <Badge
                        variant={
                          c.lesson_result === "success"
                            ? "success"
                            : c.lesson_result === "failed"
                            ? "danger"
                            : "warning"
                        }
                      >
                        {LESSON_RESULT_LABELS[c.lesson_result]}
                      </Badge>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
