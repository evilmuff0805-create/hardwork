"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";

const todoPath = "/";
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

function redirectWithError(message: string) {
  redirect(`${todoPath}?error=${encodeURIComponent(message)}`);
}

function redirectWithNotice(message: string) {
  redirect(`${todoPath}?notice=${encodeURIComponent(message)}`);
}

function todayDateValue() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export async function addTodo(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const dueDate = String(formData.get("due_date") ?? "");
  const safeDueDate = datePattern.test(dueDate) ? dueDate : todayDateValue();
  if (!title) return;

  const supabase = await createClient();
  const { error } = await supabase.from("todos").insert({ title, due_date: safeDueDate });

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

// Deletes exactly what the "지난 주 완료" section shows: completed todos whose
// due date is before today in Asia/Seoul. Todos without a due date are treated
// as today by the UI, so they are excluded here too.
export async function clearPastCompletedTodos() {
  const supabase = await createClient();
  const { error, count } = await supabase
    .from("todos")
    .delete({ count: "exact" })
    .eq("is_complete", true)
    .not("due_date", "is", null)
    .lt("due_date", todayDateValue());

  if (error) redirectWithError(error.message);

  revalidatePath(todoPath);
  redirectWithNotice(`지난 완료 ${count ?? 0}개를 지웠어요.`);
}
