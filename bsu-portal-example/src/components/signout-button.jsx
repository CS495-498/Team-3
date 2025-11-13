"use client";

import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
export default function SignOutButton() {
  const router = useRouter();

  const handleSignOut = async () => {
    await fetch("/auth/Signout", { method: "POST" });
    router.push("/login");
    router.refresh(); // optional, ensures session is cleared in server components
  };

  return (
    <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
      <span>Sign out</span>
    </DropdownMenuItem>
  );
}