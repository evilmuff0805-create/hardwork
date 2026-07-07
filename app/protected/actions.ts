"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";

const todoPath = "/";

function redirectWithError(message: string) {
  redirect(`${todoPath}?error=${encodeURIComponent(message)}`);
}

export async function addTodo(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const dueBucket = String(formData.get("due_bucket") ?? "today");
  const safeDueBucket = ["today", "tomorrow", "week"].includes(dueBucket) ? dueBucket : "today";
  if (!title) return;

  const supabase = await createClient();
  const { error } = await supabase.from("todos").insert({ title, due_bucket: safeDueBucket });

  if (error) redirectWithError(error.message);
  revalidatePath(todoPath);
}

export async function toggleTodo(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const isComplete = String(formData.get("is_complete") ?? "false") === "true";
  if (!id) return;

  const supabase = await createClient();
  const { error } = await supabase.from("todos").update({ is_complete: !isComplete }).eq("id", id);

  if (error) redirectWithError(error.message);
  revalidatePath(todoPath);
}

export async function deleteTodo(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  const { error } = await supabase.from("todos").delete().eq("id", id);

  if (error) redirectWithError(error.message);
  revalidatePath(todoPath);
}
