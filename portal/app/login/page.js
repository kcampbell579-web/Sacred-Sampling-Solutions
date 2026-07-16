import { login } from "@/app/actions/auth";
import Header from "@/components/Header";

export const dynamic = "force-dynamic";

export default function LoginPage({ searchParams }) {
  const error = searchParams?.error;
  const next = (searchParams?.next || "/dashboard").toString();
  return (
    <>
      <Header user={null} />
      <main className="authwrap">
        <div className="authcard">
          <h1>Log in</h1>
          <p className="sub">Welcome back. Enter your details to continue.</p>
          {error && <div className="alert alert-error">{error}</div>}
          <form action={login}>
            <input type="hidden" name="next" value={next} />
            <div className="field">
              <label>Email</label>
              <input name="email" type="email" required autoComplete="email" />
            </div>
            <div className="field">
              <label>Password</label>
              <input name="password" type="password" required autoComplete="current-password" />
            </div>
            <button className="btn btn-primary btn-block" type="submit">Log in</button>
          </form>
          <p className="alt">
            New here? <a href={`/signup?next=${encodeURIComponent(next)}`}>Create an account</a>
          </p>
        </div>
      </main>
    </>
  );
}
