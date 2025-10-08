"use client";
import { useState, useEffect } from "react";
import Stack, { onEntryChange } from "@/lib/cstack";
import { NavigationMenuDemo } from "@/components/menu"
import { Separator} from "@/components/ui/separator"
import { ModeToggle } from "@/components/mode-toggle";
import { TableDemo } from "@/components/notification-table";
import Link from "next/link";
import Image from "next/image";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";


import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"



export default function Demos() {
    const [entry, setEntry] = useState({});
    const [isLoading, setIsLoading] = useState(true);

    const getContent = async () => {
        const entry = await Stack.getElementByTypeWithRefs(
            "custom_demos",
            "en-us",
            ["header", "demos"
            ]
        );
        console.log("CMS Entry:", entry);
        console.log("Demo:", entry);

        setEntry(entry[0][0]);
        setIsLoading(false);
    };

    useEffect(() => {
        onEntryChange(getContent);
    }, []);

    if(isLoading) return <div></div>

    return (
        <main className="pl-64 p-6">
            <div className="flex items-center mb-8">
                <h1 className="text-3xl font-bold ml-4">Custom Demos</h1>
            </div>

            <section className="mt-10">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {entry?.demos?.map((demo, idx) => (
                        <Link key={idx} target={'_blank'} href={demo?.link?.href || "#"} className="group">
                            <Card className="h-full shadow-md hover:shadow-lg transition-shadow duration-200">
                                {demo?.image?.url && (
                                    <div className="relative w-full h-48">
                                        <Image
                                            src={demo.image.url}
                                            alt={demo.title || "Demo image"}
                                            fill
                                            className="object-cover rounded-t-lg group-hover:opacity-90 transition-opacity"
                                        />
                                    </div>
                                )}
                                <CardHeader>
                                    <CardTitle>{demo?.title}</CardTitle>
                                    <CardDescription>{demo?.description}</CardDescription>
                                </CardHeader>
                            </Card>
                        </Link>
                    ))}
                </div>
            </section>
        </main>
    );
}
