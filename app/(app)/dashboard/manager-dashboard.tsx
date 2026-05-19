import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Profile, CaseWithUsers, APPROVAL_LABELS } from "@/lib/types";
import { KpiCard } from "@/components/ui/kpi-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate, calculateDDay } from "@/lib/utils";
import { Clock, CheckCircle, AlertCircle, TrendingUp } from "lucide-react";

export default async function ManagerDashboard({ profile }: { profile: Profile }) {
  const supabase = await createClient();

  const { data: cases } = await supabase
    .from("cases_with_users")
    .select("*")
    .order("created_at", { ascending: false })
    .returns<CaseWithUsers[]>();

  const allCases = cases ?? [];

  const pending = allCases.filter((c) => c.approval_status === "pending");
  const inProgress = allCases.filter(
    (c) => c.approval_status === "approved" && !c.lesson_result
  );

  const urgentCases = inProgress
    .map((c) => ({ ...c, dday: calculateDDay(c.approval_date) }))
    .filter((c) => c.dday.variant === "danger" || c.dday.variant === "warning" || c.dday.variant === "expired")
    .sort((a, b) => a.dday.remaining - b.dday.remaining);

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const thisMonthSuccess = allCases.filter(
    (c) =>
      c.lesson_result === "success" &&
      c.lesson_date &&
      new Date(c.lesson_date) >= startOfMonth
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">📊 운영 대시보드</h1>
        <p className="text-sm text-gray-500 mt-1">
          {profile.full_name}님, 오늘도 화이팅하세요!
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="승인 대기"
          value={pending.length}
          icon={<Clock size={20} />}
          variant="warning"
        />
        <KpiCard
          label="진행 중"
          value={inProgress.length}
          icon={<TrendingUp size={20} />}
          variant="info"
        />
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
            <CardTitle className="flex items-center gap-2">
              🚨 즉시 액션 필요
              <Badge variant="danger">{urgentCases.length}건</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto -mx-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-y border-gray-200 bg-gray-50 text-left">
                    <th className="px-6 py-2 font-medium text-gray-600">NO</th>
                    <th className="px-3 py-2 font-medium text-gray-600">Agent</th>
                    <th className="px-3 py-2 font-medium text-gray-600">학부모</th>
                    <th className="px-3 py-2 font-medium text-gray-600">사유</th>
                    <th className="px-3 py-2 font-medium text-gray-600">교사</th>
                    <th className="px-6 py-2 font-medium text-gray-600 text-center">D-Day</th>
                  </tr>
                </thead>
                <tbody>
                  {urgentCases.slice(0, 10).map((c) => (
                    <tr key={c.id} className="border-b border-gray-100">
                      <td className="px-6 py-3 font-mono text-xs text-gray-500">
                        #{c.case_no}
                      </td>
                      <td className="px-3 py-3 font-medium">{c.agent_name}</td>
                      <td className="px-3 py-3">
                        <Link
                          href={`/cases/${c.id}`}
                          className="text-brand-600 hover:underline"
                        >
                          {c.parent_name} ({c.child_name})
                        </Link>
                      </td>
                      <td className="px-3 py-3 text-gray-600">{c.failure_reason}</td>
                      <td className="px-3 py-3 text-gray-600">{c.teacher_name ?? "미배정"}</td>
                      <td className="px-6 py-3 text-center">
                        <Badge
                          variant={
                            c.dday.variant === "expired"
                              ? "danger"
                              : c.dday.variant === "danger"
                              ? "danger"
                              : "warning"
                          }
                        >
                          {c.dday.label}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            ⏳ 승인 대기
            <Badge variant="warning">{pending.length}건</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pending.length === 0 ? (
            <p className="text-sm text-gray-500 py-4 text-center">
              승인 대기 중인 케이스가 없습니다.
            </p>
          ) : (
            <div className="space-y-2">
              {pending.slice(0, 10).map((c) => (
                <Link
                  key={c.id}
                  href={`/cases/${c.id}`}
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">
                      {c.parent_name}{" "}
                      <span className="text-gray-500 font-normal">
                        ({c.child_name}, {c.child_age}세)
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 mt-0.5">
                      {c.agent_name} · {c.failure_reason} · {formatDate(c.apply_date)}
                    </div>
                  </div>
                  <Badge variant="warning">{APPROVAL_LABELS[c.approval_status]}</Badge>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
