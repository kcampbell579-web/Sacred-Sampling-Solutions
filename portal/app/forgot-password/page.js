import { requestPasswordReset } from "@/app/actions/auth";
import Header from "@/components/Header";

export const dynamic = "force-dynamic";
export const metadata = { title: "Reset password — Sacred Sampling Solutions" };

export default function ForgotPasswordPage({ searchParams }) {
  const sent = (searchParams?.sent || "") === "1";
  return (
    <>
      <Header user={null} />
      <main className="authwrap">
        <div className="authcard">
          <h1>Reset your password</h1>
          {sent ? (
            <>
              <p className="sub">
                If an account exists for that email, we&rsquo;ve sent a link to set a new password.
                Check your inbox &mdash; and your spam folder, just in case.
              </p>
              <a className="btn btn-primary btn-block" href="/login">Back to log in</a>
            </>
          ) : (
            <>
              <p className="sub">Enter your email and we&rsquo;ll send you a link to choose a new password.</p>
              <form action={requestPasswordReset}>
                <div className="field">
                  <label>Email</label>
                  <input name="email" type="email" required autoComplete="email" />
                </div>
                <button className="btn btn-primary btn-block" type="submit">Send reset link</button>
              </form>
              <p className="alt"><a href="/login">Back to log in</a></p>
            </>
          )}
        </div>
      </main>
    </>
  );
}
