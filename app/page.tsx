import { TodoForm } from "./components/todo-form";
import { createClient } from "../lib/supabase/server";
import { addTodo, deleteTodo, toggleTodo } from "./protected/actions";

type Todo = {
  id: string;
  title: string;
  is_complete: boolean;
  inserted_at: string;
  due_bucket: "today" | "tomorrow" | "week";
};

const sections = [
  { key: "today", label: "오늘" },
  { key: "tomorrow", label: "내일" },
  { key: "week", label: "이번 주" },
] as const;

export default async function Home({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const errorMessage = typeof params.error === "string" ? params.error : undefined;
  const supabase = await createClient();
  const { data: todos, error } = await supabase
    .from("todos")
    .select("id,title,is_complete,inserted_at,due_bucket")
    .order("inserted_at", { ascending: false })
    .returns<Todo[]>();

  const todoList = todos ?? [];

  return (
    <main>
      <section className="card todo-card">
        <div className="page-header hero-header">
          <div>
            <p className="eyebrow">Personal cloud planner</p>
            <h1>오늘부터 볼 일</h1>
            <p className="hero-copy">말로 추가하고, 오늘 · 내일 · 이번 주 순서로 바로 확인해요.</p>
          </div>
        </div>

        <TodoForm action={addTodo} />

        {errorMessage ? <p role="alert" className="error-message">{errorMessage}</p> : null}
        {error ? <p role="alert" className="error-message">Run the latest public todo SQL first: {error.message}</p> : null}

        <div className="todo-sections">
          {sections.map((section) => {
            const sectionTodos = todoList.filter((todo) => (todo.due_bucket ?? "today") === section.key);

            return (
              <section className="todo-section" key={section.key}>
                <div className="section-heading">
                  <h2>{section.label}</h2>
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

                        <span className={todo.is_complete ? "todo-title complete" : "todo-title"}>{todo.title}</span>

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
