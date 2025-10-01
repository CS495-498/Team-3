"use client";
import { useState, useEffect } from "react";
import Stack, { onEntryChange } from "@/lib/cstack";
import { NavigationMenuDemo } from "@/components/menu"
import { Separator} from "@/components/ui/separator"
import { ModeToggle } from "@/components/mode-toggle";
import { TableDemo } from "@/components/notification-table";

import Link from "next/link";


export default function Home() {
  const [entry, setEntry] = useState({});
	const [isLoading, setIsLoading] = useState(true);

	const getContent = async () => {
		const entry = await Stack.getElementByTypeWithRefs(
			"homepage",
			"en-us",

			["header"

			]
		);
		console.log("homepage", entry[0][0]);
		setEntry(entry[0][0]);
		setIsLoading(false);
	};

	useEffect(() => {
		onEntryChange(getContent);
	}, []);

  if(isLoading) return <div></div>

return (
  <div className="">
    <div className="absolute top-3 left-3">
      <img className="w-30 h-10" src={entry?.header?.[0]?.logo?.url} />
    </div>
	<div className="absolute top-3 right-3">
		<ModeToggle/>
    </div>
    <div className="mt-8 flex flex-col items-center">
        <nav>
          {entry?.header?.[0]?.navigation_menu?.map((item) => (
            <Link
              key={item.call_to_action.href}
              href={item.call_to_action.href}
              className="px-3 py-1 hover:text-blue-500"
            >
              {item.label}
            </Link>
          ))}
        </nav>
    </div>
  <Separator/>

	<div className="flex">
  <div className="relative w-1/4 p-4 items-center justify-center">
    <TableDemo />
  </div>
  <div className="relative w-3/4 p-4 flex flex-col items-center">
    <h1 className="text-3xl font-bold underline mt-8">{entry?.headline}</h1>
  </div>
</div>

  </div>
);
}
