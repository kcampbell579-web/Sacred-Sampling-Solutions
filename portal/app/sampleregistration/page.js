import { getUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Header from "@/components/Header";
import RegisterForm from "./RegisterForm";

export const dynamic = "force-dynamic";

export default async function Page({ searchParams }) {
  const user = await getUser();
  const id = (searchParams?.id || "").toString();
  const error = (searchParams?.error || "").toString();

  // Registration is members-only; send new customers to sign up, carrying the kit ID.
  if (!user) {
    const next = `/sampleregistration${id ? `?id=${encodeURIComponent(id)}` : ""}`;
    redirect(`/signup?next=${encodeURIComponent(next)}`);
  }

  return (
    <>
      <Header user={user} />
      <RegisterForm
        initialId={id}
        error={error}
        user={{ name: user.name, email: user.email, phone: user.phone || "" }}
      />
    </>
  );
}
