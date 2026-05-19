"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ApprovalStatus, ClosingSignal, LessonResult } from "@/lib/types";

export async function createCase(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const payload = {
    agent_id: user.id,
    apply_date: (formData.get("apply_date") as string) || new Date().toISOString().split("T")[0],
    parent_name: formData.get("parent_name") as string,
    parent_phone: (formData.get("parent_phone") as string) || null,
    child_name: formData.get("child_name") as string,
    child_age: Number(formData.get("child_age")) || null,
    failure_reason: formData.get("failure_reason") as string,
    failure_detail: (formData.get("failure_detail") as string) || null,
    region: (formData.get("region") as string) || null,
    decision_maker: (formData.get("decision_maker") as string) || null,
    family_info: (formData.get("family_info") as string) || null,
    approval_status: "pending" as ApprovalStatus,
  };

  const { data, error } = await supabase
    .from("cases")
    .insert(payload)
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/cases");
  redirect(`/cases/${data.id}`);
}

export async function updateApproval(
  caseId: string,
  status: ApprovalStatus,
  teacherId?: string | null,
  rejectionReason?: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const update: Record<string, unknown> = {
    approval_status: status,
    approved_by: user.id,
  };

  if (status === "approved") {
    update.approval_date = new Date().toISOString();
    if (teacherId) {
      update.teacher_id = teacherId;
      update.assigned_at = new Date().toISOString();
    }
  } else if (status === "rejected") {
    update.rejection_reason = rejectionReason ?? null;
  }

  const { error } = await supabase.from("cases").update(update).eq("id", caseId);
  if (error) return { error: error.message };

  revalidatePath(`/cases/${caseId}`);
  revalidatePath("/dashboard");
  revalidatePath("/cases");
  return { success: true };
}

export async function updateLessonResult(
  caseId: string,
  data: {
    lesson_date?: string;
    lesson_time?: string;
    lesson_result?: LessonResult;
    closing_signal?: ClosingSignal;
    parent_feedback?: string;
    next_action?: string;
  }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const { error } = await supabase
    .from("cases")
    .update(data)
    .eq("id", caseId);
  if (error) return { error: error.message };

  revalidatePath(`/cases/${caseId}`);
  revalidatePath("/dashboard");
  return { success: true };
}

export async function assignTeacher(caseId: string, teacherId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("cases")
    .update({
      teacher_id: teacherId,
      assigned_at: new Date().toISOString(),
    })
    .eq("id", caseId);

  if (error) return { error: error.message };

  revalidatePath(`/cases/${caseId}`);
  revalidatePath("/dashboard");
  return { success: true };
}
