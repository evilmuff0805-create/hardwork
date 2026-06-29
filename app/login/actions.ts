"use server";

import { redirect } from "next/navigation";
import { getSafeRedirectPath } from "../../lib/safe-redirect";
import { createClient } from "../../lib/supabase/server";

export async function signInWithOtp(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const next = getSafeRedirectPath(formData.get("next"));
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`);
  redirect("/login?message=Check your email for a sign-in link.");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
