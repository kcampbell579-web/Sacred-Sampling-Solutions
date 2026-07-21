"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "./Header";
import { CLINIC } from "@/lib/clinic";
import { isSignedIn } from "@/lib/store";

// Wraps authenticated pages: guards the (fake) session and renders chrome.
export default function Shell({ children }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isSignedIn()) {
      router.replace("/login");
      return;
    }
    setReady(true);
  }, [router]);

  if (!ready) return null;

  return (
    <>
      <Header />
      <main className="wrap page">{children}</main>
      <footer className="foot">
        <div className="wrap cols">
          <div>
            <strong>{CLINIC.name}</strong> · {CLINIC.address}
          </div>
          <div>
            {CLINIC.phone} · {CLINIC.hours}
          </div>
        </div>
      </footer>
    </>
  );
}
