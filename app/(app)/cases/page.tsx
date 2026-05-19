import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  Profile,
  CaseWithUsers,
  APPROVAL_LABELS,
  LESSON_RESULT_LABELS,
} from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, calculateDDay } from "@/lib/utils";
import { Plus } from "lucide-react";

export default async function CasesPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();

  if (!profile) redirect("/login");

  const { data: cases } = await supabase
    .from("cases_with_users")
    .select("*")
    .order("created_at", { ascending: false })
    .returns<CaseWithUsers[]>();

  const allCases = cases ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">📋 전체 케이스</h1>
          <p className="text-sm text-gray-500 mt-1">
            총 {allCases.length}건
          </p>
        </div>
        {(profile.role === "agent" || profile.role === "manager" || profile.role === "head") && (
          <Link href="/cases/new">
            <Button>
              <Plus size={16} />
              신규 등록
            </Button>
          </Link>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          {allCases.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500">아직 등록된 케이스가 없습니다.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 text-left">
                    <th className="px-4 py-3 font-medium text-gray-600">NO</th>
                    <th className="px-4 py-3 font-medium text-gray-600">신청일</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Agent</th>
                    <th className="px-4 py-3 font-medium text-gray-600">학부모</th>
                    <th className="px-4 py-3 font-medium text-gray-600">자녀</th>
                    <th className="px-4 py-3 font-medium text-gray-600">사유</th>
                    <th className="px-4 py-3 font-medium text-gray-600">교사</th>
                    <th className="px-4 py-3 font-medium text-gray-600">승인</th>
                    <th className="px-4 py-3 font-medium text-gray-600">결과</th>
                    <th className="px-4 py-3 font-medium text-gray-600 text-center">D-Day</th>
                  </tr>
                </thead>
                <tbody>
                  {allCases.map((c) => {
                    const dday = c.approval_status === "approved" && !c.lesson_result
                      ? calculateDDay(c.approval_date)
                      : null;
                    return (
                      <tr
                        key={c.id}
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-3 font-mono text-xs text-gray-500">
                          <Link
                            href={`/cases/${c.id}`}
                            className="text-brand-600 hover:underline"
                          >
                            #{c.case_no}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {formatDate(c.apply_date)}
                        </td>
                        <td className="px-4 py-3 font-medium">{c.agent_name}</td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/cases/${c.id}`}
                            className="hover:underline"
                          >
                            {c.parent_name}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {c.child_name} ({c.child_age}세)
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {c.failure_reason}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {c.teacher_name ?? "-"}
                        </td>
                        <td className="px-4 py-3">
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
                        </td>
                        <td className="px-4 py-3">
                          {c.lesson_result ? (
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
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {dday ? (
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
                          ) : (
                            "-"
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
