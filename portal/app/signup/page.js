import { signup } from "@/app/actions/auth";
import Header from "@/components/Header";

export const dynamic = "force-dynamic";

export default function SignupPage({ searchParams }) {
  const error = searchParams?.error;
  const next = (searchParams?.next || "/dashboard").toString();
  return (
    <>
      <Header user={null} />
      <main className="authwrap">
        <div className="authcard">
          <h1>Create your account</h1>
          <p className="sub">A quick, secure sign-in to protect your results.</p>
          {error && <div className="alert alert-error">{error}</div>}
          <form action={signup}>
            <input type="hidden" name="next" value={next} />
            <div className="field">
              <label>Full name</label>
              <input name="name" type="text" required autoComplete="name" />
            </div>
            <div className="field">
              <label>Email</label>
              <input name="email" type="email" required autoComplete="email" />
            </div>
            <div className="field">
              <label>Phone <span className="hint">(optional — for shipping &amp; result texts)</span></label>
              <input name="phone" type="tel" autoComplete="tel" />
            </div>
            <div className="field">
              <label>Password</label>
              <input name="password" type="password" required minLength={8} autoComplete="new-password" />
              <span className="hint">At least 8 characters.</span>
            </div>
            <button className="btn btn-primary btn-block" type="submit">Create account</button>
          </form>
          <p className="alt">
            Already have an account? <a href={`/login?next=${encodeURIComponent(next)}`}>Log in</a>
          </p>
        </div>
      </main>
    </>
  );
}
