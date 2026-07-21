"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CLINIC } from "@/lib/clinic";
import { getPatient, signOut } from "@/lib/store";

const NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/schedule", label: "Schedule" },
  { href: "/appointments", label: "Appointments" },
  { href: "/records", label: "Records" },
  { href: "/profile", label: "Profile" },
];

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const patient = typeof window !== "undefined" ? getPatient() : null;

  function handleSignOut() {
    signOut();
    router.push("/login");
  }

  return (
    <header className="hdr">
      <div className="wrap navrow">
        <Link href="/dashboard" className="brand">
          <span className="logo">HV</span>
          <span>
            <span className="bname">{CLINIC.short}</span>
            <span className="bsub">Patient Portal</span>
          </span>
        </Link>
        <div className="spacer" />
        <nav className="navlinks">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={pathname === n.href ? "active" : ""}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <span className="who">{patient?.firstName ? `Hi, ${patient.firstName}` : ""}</span>
        <button className="linkbtn" onClick={handleSignOut}>
          Sign out
        </button>
      </div>
    </header>
  );
}
