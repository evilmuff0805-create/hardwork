import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import { signOut } from "../login/actions";

export default async function ProtectedPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/protected");

  return (
    <main>
      <section className="card">
        <h1>Protected route</h1>
        <p>You are signed in as {user.email ?? user.id}.</p>
        <form action={signOut}>
          <button type="submit">Sign out</button>
        </form>
      </section>
    </main>
  );
}
