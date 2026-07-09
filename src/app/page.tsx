"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUser } from "@/lib/auth";

export default function HomePage() {
  const router = useRouter();
  const user = getUser();

  useEffect(() => {
    if (user) {
      router.push("/dashboard");
    } else {
      router.push("/login");
    }
  }, [router, user]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-slate-600">Loading...</div>
    </div>
  );
}
