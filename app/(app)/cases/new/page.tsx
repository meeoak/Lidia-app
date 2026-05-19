"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FAILURE_REASONS, REGIONS, DECISION_MAKERS } from "@/lib/types";
import { createCase } from "../actions";

export default function NewCasePage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError(null);
    setLoading(true);
    const result = await createCase(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">📝 신규 케이스 신청</h1>
        <p className="text-sm text-gray-500 mt-1">
          보류된 학부모 케이스를 등록합니다. 등록 후 매니저 승인을 거쳐 교사가 배정됩니다.
        </p>
      </div>

      <form action={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>학부모 / 자녀 정보</CardTitle>
            <CardDescription>케이스의 기본 정보를 입력합니다.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="parent_name" required>
                  학부모 이름
                </Label>
                <Input id="parent_name" name="parent_name" required placeholder="Ibu Dewi" />
              </div>
              <div>
                <Label htmlFor="parent_phone">학부모 연락처</Label>
                <Input id="parent_phone" name="parent_phone" placeholder="0812-3456-7890" />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="child_name" required>
                  자녀 이름
                </Label>
                <Input id="child_name" name="child_name" required placeholder="Rafi" />
              </div>
              <div>
                <Label htmlFor="child_age" required>
                  자녀 나이
                </Label>
                <Input
                  id="child_age"
                  name="child_age"
                  type="number"
                  min={0}
                  max={15}
                  required
                  placeholder="5"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="region">거주 지역</Label>
                <Select id="region" name="region" defaultValue="">
                  <option value="">선택하세요</option>
                  {REGIONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="decision_maker">의사 결정자</Label>
                <Select id="decision_maker" name="decision_maker" defaultValue="">
                  <option value="">선택하세요</option>
                  {DECISION_MAKERS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="family_info">가족 정보</Label>
              <Input
                id="family_info"
                name="family_info"
                placeholder="예: 외동 / 형제 있음 / 자매 있음"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>영업 활동 결과</CardTitle>
            <CardDescription>1차 영업 결과 및 보류 사유를 입력합니다.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="apply_date" required>
                첫 만남 일자
              </Label>
              <Input
                id="apply_date"
                name="apply_date"
                type="date"
                required
                defaultValue={new Date().toISOString().split("T")[0]}
              />
            </div>

            <div>
              <Label htmlFor="failure_reason" required>
                보류 사유
              </Label>
              <Select id="failure_reason" name="failure_reason" required defaultValue="">
                <option value="" disabled>
                  선택하세요
                </option>
                {FAILURE_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <Label htmlFor="failure_detail">상세 사유 (자유 기술)</Label>
              <Textarea
                id="failure_detail"
                name="failure_detail"
                rows={4}
                placeholder="학부모의 구체적인 우려사항, 특별 요청 등을 적어주세요."
              />
            </div>
          </CardContent>
        </Card>

        {error && (
          <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex items-center justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            취소
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "등록 중..." : "케이스 등록"}
          </Button>
        </div>
      </form>
    </div>
  );
}
