import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Profile, CaseWithUsers } from "@/lib/types";
import { KpiCard } from "@/components/ui/kpi-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { Calendar, BookOpen, Users } from "lucide-react";

const STRATEGY_BY_REASON: Record<string, string> = {
  "①": "자녀 반응 영상 확보 + 엄마 즉시 공유, '즐거움' 강조",
  "②": "분할 결제/체험 옵션 제안, 가성비 시각화",
  "③": "자녀 성장 포인트 적극 발견 및 칭찬",
  "④": "의사 결정 데드라인 명시, 한정 조건 제시",
  "⑤": "구체적 의심 포인트 직접 시연, 데이터 기반 효과",
  "⑥": "1:1 vs 그룹 차이 시연, 맞춤 학습 사례",
  "⑦": "자녀 좋아하는 캐릭터 활용, 게임 요소 도입",
  "⑧": "매니저 상담 권유, 할인 옵션 안내",
  "⑨": "매니저 인계, 구체적 거부 사유 파악",
};

function getStrategy(reason: string): string {
  const key = reason?.charAt(0);
  return STRATEGY_BY_REASON[key] ?? "본인 시트에서 보류 사유별 전략 확인";
}

export default async function TeacherDashboard({ profile }: { profile: Profile }) {
  const supabase = await createClient();

  const { data: cases } = await supabase
    .from("cases_with_users")
    .select("*")
    .eq("teacher_id", profile.id)
    .order("lesson_date", { ascending: true })
    .returns<CaseWithUsers[]>();

  const myCases = cases ?? [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split("T")[0];

  const monday = new Date(today);
  monday.setDate(monday.getDate() - ((today.getDay() + 6) % 7));
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);

  const todayLessons = myCases.filter((c) => c.lesson_date === todayStr);

  const thisWeekLessons = myCases.filter(
    (c) =>
      c.lesson_date &&
      new Date(c.lesson_date) >= monday &&
      new Date(c.lesson_date) <= sunday
  );

  const totalCompleted = myCases.filter((c) => c.lesson_result).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">👩‍🏫 {profile.full_name}님의 오늘</h1>
        <p className="text-sm text-gray-500 mt-1">
          {formatDate(today.toISOString())}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <KpiCard
          label="오늘 수업"
          value={todayLessons.length}
          icon={<Calendar size={20} />}
          variant="info"
        />
        <KpiCard
          label="이번 주"
          value={thisWeekLessons.length}
          icon={<BookOpen size={20} />}
          variant="default"
        />
        <KpiCard
          label="누적 수업"
          value={totalCompleted}
          icon={<Users size={20} />}
          variant="success"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>📅 오늘 일정</CardTitle>
        </CardHeader>
        <CardContent>
          {todayLessons.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">
              오늘 예정된 수업이 없습니다.
            </p>
          ) : (
            <div className="space-y-4">
              {todayLessons.map((c) => (
                <Link
                  key={c.id}
                  href={`/cases/${c.id}`}
                  className="block p-4 rounded-lg border-l-4 border-brand-500 bg-brand-50 hover:bg-brand-100 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900">
                        {c.lesson_time ?? "시간 미정"} · {c.parent_name} (
                        {c.child_name}, {c.child_age}세)
                      </div>
                      <div className="text-sm text-gray-700 mt-2 space-y-1">
                        <div>
                          📍 <span className="text-gray-600">지역:</span>{" "}
                          {c.region ?? "-"}
                        </div>
                        <div>
                          🚨 <span className="text-gray-600">보류 사유:</span>{" "}
                          <Badge variant="warning" className="ml-1">
                            {c.failure_reason}
                          </Badge>
                        </div>
                        <div className="mt-2 p-2 bg-white rounded border border-gray-200">
                          <span className="font-medium text-gray-700">💡 수업 전략:</span>{" "}
                          <span className="text-gray-600">
                            {getStrategy(c.failure_reason)}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-2">
                          Agent: {c.agent_name}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>📆 이번 주 일정</CardTitle>
        </CardHeader>
        <CardContent>
          {thisWeekLessons.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">
              이번 주 예정된 수업이 없습니다.
            </p>
          ) : (
            <div className="space-y-2">
              {thisWeekLessons.map((c) => (
                <Link
                  key={c.id}
                  href={`/cases/${c.id}`}
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-16 text-center">
                      <div className="text-xs text-gray-500">
                        {c.lesson_date
                          ? new Date(c.lesson_date).toLocaleDateString("ko-KR", {
                              weekday: "short",
                            })
                          : "-"}
                      </div>
                      <div className="text-sm font-medium">
                        {c.lesson_date
                          ? new Date(c.lesson_date).toLocaleDateString("ko-KR", {
                              month: "numeric",
                              day: "numeric",
                            })
                          : "-"}
                      </div>
                    </div>
                    <div>
                      <div className="font-medium text-sm">
                        {c.lesson_time ?? "-"} · {c.parent_name} ({c.child_name})
                      </div>
                      <div className="text-xs text-gray-500">{c.region}</div>
                    </div>
                  </div>
                  {c.lesson_result ? (
                    <Badge variant="success">완료</Badge>
                  ) : (
                    <Badge variant="info">예정</Badge>
                  )}
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
