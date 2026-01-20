"use client";

import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
export default function AccountPageButton() {
    const router = useRouter();

    const accountPageHandler = async() => {
        router.push("/account")
    };

    return (
        <DropdownMenuItem onClick={accountPageHandler} className="cursor-pointer">
            <span>Account</span>
        </DropdownMenuItem>
    );
}