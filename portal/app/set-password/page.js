import { setPassword } from "@/app/actions/auth";
import Header from "@/components/Header";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function SetPasswordPage({ searchParams }) {
  const token = (searchParams?.token || "").toString();
  const error = (searchParams?.error || "").toString();

  let valid = false;
  let email = "";
  if (token) {
    try {
      const rows = await sql`
        select u.email, p.expires_at
        from password_resets p join users u on u.id = p.user_id
        where p.token = ${token}`;
      if (rows.length && new Date(rows[0].expires_at) > new Date()) {
        valid = true;
        email = rows[0].email;
      }
    } catch {
      valid = false;
    }
  }

  return (
    <>
      <Header user={null} />
      <main className="authwrap">
        <div className="authcard">
          <h1>Set your password</h1>
          {valid ? (
            <>
              <p className="sub">Create a password to finish setting up your account{email ? ` for ${email}` : ""}.</p>
              {error && <div className="alert alert-error">{error}</div>}
              <form action={setPassword}>
                <input type="hidden" name="token" value={token} />
                <div className="field">
                  <label>New password</label>
                  <input name="password" type="password" minLength={8} required autoComplete="new-password" placeholder="At least 8 characters" />
                </div>
                <button className="btn btn-primary btn-block" type="submit">Set password &amp; sign in</button>
              </form>
            </>
          ) : (
            <>
              <div className="alert alert-error">{error || "This link is invalid or has expired."}</div>
              <p className="sub" style={{ marginTop: 12 }}>
                If your setup link has expired, <a href="https://www.sacredsamplingsolutions.com/contact">contact us</a> and we&rsquo;ll send a new one, or <a href="/login">log in</a> if you already have a password.
              </p>
            </>
          )}
        </div>
      </main>
    </>
  );
}
