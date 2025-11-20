import { NextResponse, redirect } from "next/server";
import { createClient } from "@/utils/Supabase/server";

const BASE = "https://api.contentstack.io/v3";
const API_KEY = process.env.CONTENTSTACK_API_KEY;
const MANAGEMENT_TOKEN = process.env.CONTENTSTACK_MANAGEMENT_TOKEN;
const ENVIRONMENT = process.env.CONTENTSTACK_ENVIRONMENT;

export async function POST(req) {
  const supabase = await createClient();

  // Authenticate user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // or redirect("/login") if desired
  }

  try {
    const { uid, title, html, author } = await req.json();

    if (!uid || !title || !html) {
      return NextResponse.json({ error: "Missing UID, title, or HTML" }, { status: 400 });
    }

    // 1️⃣ Fetch existing entry to get _version
    const fetchRes = await fetch(`${BASE}/content_types/demo_instruction/entries/${uid}`, {
      headers: {
        api_key: API_KEY,
        authorization: MANAGEMENT_TOKEN,
      },
    });
    const fetchData = await fetchRes.json();
    if (!fetchRes.ok) {
      return NextResponse.json({ error: "Failed to fetch entry", details: fetchData }, { status: 500 });
    }

    const entryVersion = fetchData.entry._version;

    // 2️⃣ Update the entry
    const updateRes = await fetch(`${BASE}/content_types/demo_instruction/entries/${uid}`, {
      method: "PUT",
      headers: {
        api_key: API_KEY,
        authorization: MANAGEMENT_TOKEN,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        entry: {
          title,
          author_name: author || "",
          blog_content: html,
        },
        _version: entryVersion,
      }),
    });
    const updateData = await updateRes.json();
    if (!updateRes.ok) {
      return NextResponse.json({ error: "Failed updating entry", details: updateData }, { status: 500 });
    }

    // 3️⃣ Publish the updated entry
    const publishRes = await fetch(`${BASE}/content_types/demo_instruction/entries/${uid}/publish`, {
      method: "POST",
      headers: {
        api_key: API_KEY,
        authorization: MANAGEMENT_TOKEN,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        entry: {
          locales: ["en-us"],
          environments: [ENVIRONMENT],
        },
      }),
    });
    const publishData = await publishRes.json();
    if (!publishRes.ok) {
      return NextResponse.json({ error: "Failed publishing entry", details: publishData }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Entry updated and published successfully",
      entry: updateData.entry,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
