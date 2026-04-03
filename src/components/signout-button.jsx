"use client";

import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/Supabase/client.js";

export default function SignOutButton() {
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await fetch("/auth/Signout", { method: "POST" });
    await supabase.auth.signOut();
    sessionStorage.removeItem("currentUser");
    sessionStorage.removeItem("userRole");
    router.replace("/login");
    router.refresh();
  };

  return (
    <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
      <span>Sign out</span>
    </DropdownMenuItem>
  );
}
