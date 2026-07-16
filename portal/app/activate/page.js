import { requireUser } from "@/lib/auth";
import { activateKit } from "@/app/actions/kit";
import Header from "@/components/Header";

export const dynamic = "force-dynamic";

export default async function Activate({ searchParams }) {
  const user = await requireUser();
  const error = searchParams?.error;
  const kit = (searchParams?.kit || "").toString();

  return (
    <>
      <Header user={user} />
      <main className="page">
        <div className="narrow">
          <a className="backlink" href="/dashboard">← Back to dashboard</a>
          <div className="card">
            <span className="eyebrow">Step 2 · Activate</span>
            <h1 className="mt" style={{ marginBottom: 8 }}>Register your Kit ID</h1>
            <p className="muted" style={{ marginBottom: 18 }}>
              Find the Kit ID on your insert card or sample bottle (it looks like{" "}
              <span className="mono">SSS-ESS-0001</span>).
            </p>
            {error && <div className="alert alert-error">{error}</div>}
            <form action={activateKit}>
              <div className="field">
                <label>Kit ID</label>
                <input
                  name="kit_id"
                  defaultValue={kit}
                  placeholder="SSS-XXX-0000"
                  required
                  autoCapitalize="characters"
                  style={{ textTransform: "uppercase", fontFamily: "var(--mono)" }}
                />
              </div>
              <button className="btn btn-primary btn-block" type="submit">Activate kit</button>
            </form>
          </div>
        </div>
      </main>
    </>
  );
}
