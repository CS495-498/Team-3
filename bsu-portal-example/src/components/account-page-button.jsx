"use client";

import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
export default function AccountPageButton() {
    const router = useRouter();

    const accountPageHandler = async() => {
        await fetch("/account/account-page", { method: "GET"})
        router.push("/account/account-page")
    }
}