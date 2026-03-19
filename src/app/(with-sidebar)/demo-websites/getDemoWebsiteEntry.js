import Stack from "@/lib/cstack";

export async function getDemoWebsiteEntry(stack = Stack) {
    const entry = await stack.getElementByTypeWithRefs(
        "custom_demos",
        "en-us",
        ["demos"]
    );

    return entry?.[0]?.[0] ?? {};
}
