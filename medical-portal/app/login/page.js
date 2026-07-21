"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CLINIC } from "@/lib/clinic";
import { signIn } from "@/lib/store";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("jordan.alvarez@example.com");
  const [password, setPassword] = useState("demo1234");

  function handleSubmit(e) {
    e.preventDefault();
    signIn();
    router.push("/dashboard");
  }

  return (
    <div className="authwrap">
      <div className="authcard">
        <div className="brand">
          <span className="logo">HV</span>
          <span>
            <span className="bname">{CLINIC.short}</span>
            <span className="bsub">Patient Portal</span>
          </span>
        </div>
        <h1>Welcome back</h1>
        <p className="sub">Sign in to manage your appointments and care.</p>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
            />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          <button type="submit" className="btn btn-primary btn-block">
            Sign in
          </button>
        </form>

        <p className="alt">
          New patient? <Link href="/login">Create an account</Link>
        </p>
        <p className="demo-note">
          <strong>Demo mockup</strong> — no real login. Press <strong>Sign in</strong> with
          the pre-filled credentials to explore the portal.
        </p>
      </div>
    </div>
  );
}
