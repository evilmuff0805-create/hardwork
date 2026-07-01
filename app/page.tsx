import Link from "next/link";
import { createClient } from "../lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <main>
      <section className="card">
        <h1>Supabase Auth is ready</h1>
        <p>
          {user ? `Signed in as ${user.email ?? user.id}.` : "Sign in to access protected content."}
        </p>
        <p>
          <Link href={user ? "/protected" : "/login"}>{user ? "Open protected route" : "Sign in"}</Link>
        </p>
      </section>
    </main>
  );
}
