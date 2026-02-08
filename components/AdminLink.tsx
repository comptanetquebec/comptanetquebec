"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export default function AdminLink() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let alive = true;

    async function run() {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;
      if (!user) {
        if (alive) setIsAdmin(false);
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .maybeSingle();

      if (!alive) return;

      if (error || !data) {
        setIsAdmin(false);
        return;
      }

      setIsAdmin(Boolean(data.is_admin));
    }

    run();

    return () => {
      alive = false;
    };
  }, []);

  if (!isAdmin) return null;

  return (
    <Link href="/admin/dossiers" className="hover:underline">
      Admin
    </Link>
  );
}
