"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isSignedIn } from "@/lib/store";

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    router.replace(isSignedIn() ? "/dashboard" : "/login");
  }, [router]);
  return null;
}
