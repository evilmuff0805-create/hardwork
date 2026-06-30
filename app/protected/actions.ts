"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";

async function getCurrentUserId() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) redirect("/login?next=/protected");

  return { supabase, userId: user.id };
}

export async function addTodo(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;

  const { supabase, userId } = await getCurrentUserId();
  const { error } = await supabase.from("todos").insert({ title, user_id: userId });

  if (error) redirect(`/protected?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/protected");
}

export async function toggleTodo(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const isComplete = String(formData.get("is_complete") ?? "false") === "true";
  if (!id) return;

  const { supabase, userId } = await getCurrentUserId();
  const { error } = await supabase
    .from("todos")
    .update({ is_complete: !isComplete })
    .eq("id", id)
    .eq("user_id", userId);

  if (error) redirect(`/protected?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/protected");
}

export async function deleteTodo(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const { supabase, userId } = await getCurrentUserId();
  const { error } = await supabase.from("todos").delete().eq("id", id).eq("user_id", userId);

  if (error) redirect(`/protected?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/protected");
}
