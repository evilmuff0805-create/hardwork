import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import { signOut } from "../login/actions";
import { addTodo, deleteTodo, toggleTodo } from "./actions";

type Todo = {
  id: string;
  title: string;
  is_complete: boolean;
  inserted_at: string;
};

export default async function ProtectedPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const errorMessage = typeof params.error === "string" ? params.error : undefined;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/protected");

  const { data: todos, error } = await supabase
    .from("todos")
    .select("id,title,is_complete,inserted_at")
    .order("inserted_at", { ascending: false })
    .returns<Todo[]>();

  return (
    <main>
      <section className="card todo-card">
        <div className="page-header">
          <div>
            <p className="eyebrow">Signed in as {user.email ?? user.id}</p>
            <h1>My todos</h1>
          </div>
          <form action={signOut}>
            <button className="secondary-button" type="submit">Sign out</button>
          </form>
        </div>

        <form className="todo-form" action={addTodo}>
          <label htmlFor="title">New todo</label>
          <div className="inline-form-row">
            <input id="title" name="title" type="text" required maxLength={160} placeholder="Add a task..." />
            <button type="submit">Add</button>
          </div>
        </form>

        {errorMessage ? <p role="alert" className="error-message">{errorMessage}</p> : null}
        {error ? <p role="alert" className="error-message">Run the Supabase todo table SQL first: {error.message}</p> : null}

        <ul className="todo-list">
          {(todos ?? []).map((todo) => (
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

        {!error && (todos ?? []).length === 0 ? <p className="empty-state">No todos yet. Add your first task above.</p> : null}
      </section>
    </main>
  );
}
