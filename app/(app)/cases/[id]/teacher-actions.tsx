"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { updateLessonResult } from "../actions";
import { LessonResult, ClosingSignal } from "@/lib/types";

export default function TeacherActions({ caseId }: { caseId: string }) {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [lessonDate, setLessonDate] = useState(new Date().toISOString().split("T")[0]);
  const [lessonTime, setLessonTime] = useState("");
  const [result, setResult] = useState<LessonResult>("on_hold");
  const [signal, setSignal] = useState<ClosingSignal>("medium");
  const [feedback, setFeedback] = useState("");
  const [nextAction, setNextAction] = useState("");

  async function handleSubmit() {
    setLoading(true);
    setError(null);
    const res = await updateLessonResult(caseId, {
      lesson_date: lessonDate,
      lesson_time: lessonTime || undefined,
      lesson_result: result,
      closing_signal: signal,
      parent_feedback: feedback || undefined,
      next_action: nextAction || undefined,
    });
    setLoading(false);
    if (res.error) {
      setError(res.error);
    } else {
      setShowForm(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>✍️ 수업 결과 입력</CardTitle>
        <CardDescription>수업 종료 후 결과를 입력해 주세요.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!showForm && (
          <Button onClick={() => setShowForm(true)}>수업 결과 입력하기</Button>
        )}

        {showForm && (
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="lesson_date" required>
                  수업 일자
                </Label>
                <Input
                  id="lesson_date"
                  type="date"
                  value={lessonDate}
                  onChange={(e) => setLessonDate(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="lesson_time">수업 시간</Label>
                <Input
                  id="lesson_time"
                  type="time"
                  value={lessonTime}
                  onChange={(e) => setLessonTime(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="result" required>
                수업 결과
              </Label>
              <Select
                id="result"
                value={result}
                onChange={(e) => setResult(e.target.value as LessonResult)}
              >
                <option value="success">✅ 성공 (계약 의사 확인)</option>
                <option value="on_hold">🟡 보류 (재클로징 필요)</option>
                <option value="failed">❌ 실패</option>
                <option value="no_show">⏸️ 미진행</option>
              </Select>
            </div>

            <div>
              <Label htmlFor="signal" required>
                클로징 신호
              </Label>
              <Select
                id="signal"
                value={signal}
                onChange={(e) => setSignal(e.target.value as ClosingSignal)}
              >
                <option value="strong">🟢 강 (높은 관심)</option>
                <option value="medium">🟡 중</option>
                <option value="weak">🔴 약</option>
              </Select>
            </div>

            <div>
              <Label htmlFor="feedback">학부모 반응</Label>
              <Textarea
                id="feedback"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={3}
                placeholder="구체적 발언, 우려사항, 긍정 신호 등"
              />
            </div>

            <div>
              <Label htmlFor="next_action">다음 액션 권장</Label>
              <Input
                id="next_action"
                value={nextAction}
                onChange={(e) => setNextAction(e.target.value)}
                placeholder="예: 즉시 재클로징 / 1주일 후 재접근"
              />
            </div>

            {error && (
              <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2">
                {error}
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? "저장 중..." : "결과 저장"}
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>
                취소
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
