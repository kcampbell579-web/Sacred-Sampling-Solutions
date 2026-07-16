import { getUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Header from "@/components/Header";

export const dynamic = "force-dynamic";

export default async function Page({ searchParams }) {
  const user = await getUser();
  const kit = (searchParams?.kit || "").toString().trim();
  const activateNext = kit ? `/activate?kit=${encodeURIComponent(kit)}` : "/activate";

  if (user) redirect(activateNext);

  return (
    <>
      <Header user={null} />
      <main className="authwrap">
        <div className="authcard">
          <span className="eyebrow">Activate your kit</span>
          <h1>Welcome — let&rsquo;s unlock your results.</h1>
          <p className="sub">
            Create an account (or log in) to register your kit, add your sample details, and view your certified report.
          </p>
          {kit && (
            <div className="alert alert-ok">
              Kit <b>{kit}</b> is ready to activate once you&rsquo;re signed in.
            </div>
          )}
          <a className="btn btn-primary btn-block" href={`/signup?next=${encodeURIComponent(activateNext)}`}>
            Create an account
          </a>
          <p className="alt">
            Already have one? <a href={`/login?next=${encodeURIComponent(activateNext)}`}>Log in</a>
          </p>
        </div>
      </main>
    </>
  );
}
