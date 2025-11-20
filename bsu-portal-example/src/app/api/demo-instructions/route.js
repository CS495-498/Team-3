import { NextResponse } from "next/server";

const BASE = "https://api.contentstack.io/v3";
const API_KEY = process.env.CONTENTSTACK_API_KEY;
const MANAGEMENT_TOKEN = process.env.CONTENTSTACK_MANAGEMENT_TOKEN;
const LIBRARY_ENTRY_ID = "blt56af12999b14b723";
const ENVIRONMENT = process.env.CONTENTSTACK_ENVIRONMENT;

export async function POST(req) {
  try {
    const { title, html, author } = await req.json();

    if (!title || !html) {
      return NextResponse.json({ error: "Missing title or HTML" }, { status: 400 });
    }

    // -----------------------
    // Generate slug + URL
    // -----------------------
    const baseSlug = title
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .substring(0, 60);

    let slug = baseSlug;
    let url = `/demo-instructions/${slug}`;

    // -----------------------
    // Prevent URL conflicts
    // -----------------------
    const checkRes = await fetch(
      `${BASE}/content_types/demo_instruction/entries?query=${encodeURIComponent(JSON.stringify({ url }))}`,
      {
        headers: { api_key: API_KEY, authorization: MANAGEMENT_TOKEN },
      }
    );

    const checkData = await checkRes.json();
    if (checkData.entries && checkData.entries.length > 0) {
      slug = `${baseSlug}-${Date.now()}`;
      url = `/demo-instructions/${slug}`;
    }

    // -----------------------
    // 1. CREATE ENTRY
    // -----------------------
    const createRes = await fetch(`${BASE}/content_types/demo_instruction/entries`, {
      method: "POST",
      headers: {
        api_key: API_KEY,
        authorization: MANAGEMENT_TOKEN,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        entry: {
          title,
          url,
          author_name: author || "",
          blog_content: html,
        },
      }),
    });

    const createData = await createRes.json();
    if (!createRes.ok) {
      return NextResponse.json({ error: "Failed creating instruction", details: createData }, { status: 500 });
    }

    const newEntryUid = createData.entry.uid;

    // -----------------------
    // 2. PUBLISH NEW ENTRY
    // -----------------------
    const publishRes = await fetch(`${BASE}/content_types/demo_instruction/entries/${newEntryUid}/publish`, {
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

    if (!publishRes.ok) {
      const publishData = await publishRes.json();
      return NextResponse.json({ error: "Failed publishing instruction", details: publishData }, { status: 500 });
    }

    // -----------------------
    // 3. FETCH LIBRARY ENTRY
    // -----------------------
    const libFetch = await fetch(`${BASE}/content_types/demo_instructions/entries/${LIBRARY_ENTRY_ID}`, {
      headers: { api_key: API_KEY, authorization: MANAGEMENT_TOKEN },
    });

    const libData = await libFetch.json();
    if (!libFetch.ok) {
      return NextResponse.json({ error: "Failed fetching library entry", details: libData }, { status: 500 });
    }

    // -----------------------
    // 4. UPDATE LIBRARY ENTRY
    // -----------------------
    const currentRefs = libData.entry.demo_instructions || [];
    const updatedRefs = [
      ...currentRefs,
      {
        _content_type_uid: "demo_instruction",
        uid: newEntryUid,
        locale: "en-us",
      },
    ];

    const updateRes = await fetch(`${BASE}/content_types/demo_instructions/entries/${LIBRARY_ENTRY_ID}`, {
      method: "PUT",
      headers: {
        api_key: API_KEY,
        authorization: MANAGEMENT_TOKEN,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        entry: {
          demo_instructions: updatedRefs,
          _version: libData.entry._version,
        },
      }),
    });

    const updateData = await updateRes.json();
    if (!updateRes.ok) {
      return NextResponse.json({ error: "Failed updating library entry", details: updateData }, { status: 500 });
    }

    // -----------------------
    // 5. PUBLISH LIBRARY ENTRY
    // -----------------------
    const publishLibRes = await fetch(`${BASE}/content_types/demo_instructions/entries/${LIBRARY_ENTRY_ID}/publish`, {
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

    if (!publishLibRes.ok) {
      const pubLibData = await publishLibRes.json();
      return NextResponse.json({ error: "Failed publishing library entry", details: pubLibData }, { status: 500 });
    }

    // -----------------------
    // DONE
    // -----------------------
    return NextResponse.json({
      success: true,
      message: "Instruction created, published & library updated",
      instruction_uid: newEntryUid,
      url,
    });

  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
