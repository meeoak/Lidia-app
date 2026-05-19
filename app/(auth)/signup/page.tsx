"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { signUp } from "../actions";

export default function SignupPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError(null);
    setLoading(true);
    const result = await signUp(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>회원가입</CardTitle>
        <CardDescription>Lidia 시작하기</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="full_name" required>
              이름
            </Label>
            <Input id="full_name" name="full_name" required placeholder="홍길동" />
          </div>

          <div>
            <Label htmlFor="email" required>
              이메일
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>

          <div>
            <Label htmlFor="password" required>
              비밀번호
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              placeholder="6자 이상"
              autoComplete="new-password"
            />
          </div>

          <div>
            <Label htmlFor="role" required>
              역할
            </Label>
            <Select id="role" name="role" required defaultValue="agent">
              <option value="agent">에이전트 (영업)</option>
              <option value="teacher">교사 (빔블)</option>
              <option value="manager">매니저</option>
              <option value="head">본부장</option>
            </Select>
            <p className="mt-1 text-xs text-gray-500">실제 운영 시 매니저/본부장 권한은 본부에서 별도 부여</p>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "가입 중..." : "회원가입"}
          </Button>

          <div className="text-center text-sm text-gray-600">
            이미 계정이 있으신가요?{" "}
            <Link href="/login" className="text-brand-600 hover:underline font-medium">
              로그인
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
