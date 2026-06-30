import { getSafeRedirectPath } from "../../lib/safe-redirect";
import { signInWithOtp } from "./actions";

export default async function Login({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const next = getSafeRedirectPath(typeof params.next === "string" ? params.next : undefined);
  const message = typeof params.message === "string" ? params.message : undefined;
  const error = typeof params.error === "string" ? params.error : undefined;

  return (
    <main>
      <section className="card">
        <h1>Sign in</h1>
        <p>Enter your email and Supabase will send you a magic link.</p>
        <form action={signInWithOtp}>
          <input type="hidden" name="next" value={next} />
          <label htmlFor="email">Email address</label>
          <input id="email" name="email" type="email" required placeholder="you@example.com" />
          <button type="submit">Send magic link</button>
        </form>
        {message ? <p role="status">{message}</p> : null}
        {error ? <p role="alert">{error}</p> : null}
      </section>
    </main>
  );
}
