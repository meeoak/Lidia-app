"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label, Select, Textarea } from "@/components/ui/input";
import { updateApproval } from "../actions";

export default function ManagerActions({
  caseId,
  teachers,
}: {
  caseId: string;
  teachers: { id: string; full_name: string; region: string | null }[];
}) {
  const [mode, setMode] = useState<"approve" | "reject" | null>(null);
  const [teacherId, setTeacherId] = useState<string>("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleApprove() {
    setLoading(true);
    setError(null);
    const result = await updateApproval(caseId, "approved", teacherId || null);
    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      setMode(null);
    }
  }

  async function handleReject() {
    setLoading(true);
    setError(null);
    const result = await updateApproval(caseId, "rejected", null, rejectionReason);
    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      setMode(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>🎯 매니저 검토</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!mode && (
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setMode("approve")}>승인</Button>
            <Button variant="danger" onClick={() => setMode("reject")}>
              반려
            </Button>
            <Button
              variant="outline"
              onClick={async () => {
                setLoading(true);
                await updateApproval(caseId, "on_hold");
                setLoading(false);
              }}
            >
              보류
            </Button>
          </div>
        )}

        {mode === "approve" && (
          <div className="space-y-3">
            <div>
              <Label htmlFor="teacher_id">교사 배정 (선택)</Label>
              <Select
                id="teacher_id"
                value={teacherId}
                onChange={(e) => setTeacherId(e.target.value)}
              >
                <option value="">나중에 배정</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.full_name} {t.region && `(${t.region})`}
                  </option>
                ))}
              </Select>
            </div>
            {error && (
              <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2">
                {error}
              </div>
            )}
            <div className="flex gap-2">
              <Button onClick={handleApprove} disabled={loading}>
                {loading ? "처리 중..." : "승인 확정"}
              </Button>
              <Button variant="outline" onClick={() => setMode(null)}>
                취소
              </Button>
            </div>
          </div>
        )}

        {mode === "reject" && (
          <div className="space-y-3">
            <div>
              <Label htmlFor="rejection_reason" required>
                반려 사유
              </Label>
              <Textarea
                id="rejection_reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                placeholder="에이전트에게 전달될 반려 사유를 적어주세요."
              />
            </div>
            {error && (
              <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2">
                {error}
              </div>
            )}
            <div className="flex gap-2">
              <Button variant="danger" onClick={handleReject} disabled={loading || !rejectionReason}>
                {loading ? "처리 중..." : "반려 확정"}
              </Button>
              <Button variant="outline" onClick={() => setMode(null)}>
                취소
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
