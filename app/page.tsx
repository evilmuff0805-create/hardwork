import { TodoForm } from "./components/todo-form";
import { createClient } from "../lib/supabase/server";
import { addTodo, deleteTodo, toggleTodo } from "./protected/actions";

type Todo = {
  id: string;
  title: string;
  is_complete: boolean;
  inserted_at: string;
  due_date: string | null;
};

type SectionKey = "today" | "tomorrow" | "week" | "later";

const sections: Array<{ key: SectionKey; label: string; helper: string }> = [
  { key: "today", label: "오늘", helper: "지금 바로 볼 일" },
  { key: "tomorrow", label: "내일", helper: "하루 뒤 자동 이동" },
  { key: "week", label: "이번 주", helper: "이번 주 안에 할 일" },
  { key: "later", label: "나중", helper: "이번 주 이후" },
];

function seoulDateValue(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function endOfWeekDateValue(date: Date) {
  const seoulDayName = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Seoul", weekday: "short" }).format(date);
  const dayIndex = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(seoulDayName);
  const daysUntilSunday = dayIndex >= 0 ? 6 - dayIndex : 0;
  return seoulDateValue(addDays(date, daysUntilSunday));
}

function getSectionKey(dueDate: string | null, today: string, tomorrow: string, weekEnd: string): SectionKey {
  const normalizedDueDate = dueDate ?? today;
  if (normalizedDueDate <= today) return "today";
  if (normalizedDueDate === tomorrow) return "tomorrow";
  if (normalizedDueDate <= weekEnd) return "week";
  return "later";
}

function formatTodoDate(dueDate: string | null) {
  if (!dueDate) return "날짜 없음";
  const date = new Date(`${dueDate}T00:00:00`);
  const day = ["일", "월", "화", "수", "목", "금", "토"][date.getDay()];
  return `${date.getMonth() + 1}/${date.getDate()} (${day})`;
}

export default async function Home({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const errorMessage = typeof params.error === "string" ? params.error : undefined;
  const now = new Date();
  const today = seoulDateValue(now);
  const tomorrow = seoulDateValue(addDays(now, 1));
  const weekEnd = endOfWeekDateValue(now);
  const supabase = await createClient();
  const { data: todos, error } = await supabase
    .from("todos")
    .select("id,title,is_complete,inserted_at,due_date")
    .order("due_date", { ascending: true, nullsFirst: true })
    .order("inserted_at", { ascending: false })
    .returns<Todo[]>();

  const todoList = todos ?? [];

  return (
    <main>
      <section className="card todo-card">
        <div className="page-header hero-header">
          <div>
            <p className="eyebrow">Neon cloud planner</p>
            <h1>오늘부터 한눈에</h1>
            <p className="hero-copy">“금요일에 점심 식사”처럼 말하면 날짜를 알아듣고, 시간이 지나면 오늘 · 내일 · 이번 주로 자동 재정렬돼요.</p>
          </div>
        </div>

        <TodoForm action={addTodo} />

        {errorMessage ? <p role="alert" className="error-message">{errorMessage}</p> : null}
        {error ? <p role="alert" className="error-message">Run the latest public todo SQL first: {error.message}</p> : null}

        <div className="todo-sections">
          {sections.map((section) => {
            const sectionTodos = todoList.filter((todo) => getSectionKey(todo.due_date, today, tomorrow, weekEnd) === section.key);

            return (
              <section className="todo-section" key={section.key}>
                <div className="section-heading">
                  <div>
                    <h2>{section.label}</h2>
                    <p>{section.helper}</p>
                  </div>
                  <span>{sectionTodos.length}</span>
                </div>

                {sectionTodos.length > 0 ? (
                  <ul className="todo-list">
                    {sectionTodos.map((todo) => (
                      <li className="todo-item" key={todo.id}>
                        <form action={toggleTodo}>
                          <input type="hidden" name="id" value={todo.id} />
                          <input type="hidden" name="is_complete" value={String(todo.is_complete)} />
                          <button className="check-button" type="submit" aria-label={todo.is_complete ? "Mark incomplete" : "Mark complete"}>
                            {todo.is_complete ? "✓" : "○"}
                          </button>
                        </form>

                        <div className="todo-copy">
                          <span className={todo.is_complete ? "todo-title complete" : "todo-title"}>{todo.title}</span>
                          <span className="todo-date">{formatTodoDate(todo.due_date)}</span>
                        </div>

                        <form action={deleteTodo}>
                          <input type="hidden" name="id" value={todo.id} />
                          <button className="danger-button" type="submit">Delete</button>
                        </form>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="empty-state compact">아직 없어요.</p>
                )}
              </section>
            );
          })}
        </div>
      </section>
    </main>
  );
}
