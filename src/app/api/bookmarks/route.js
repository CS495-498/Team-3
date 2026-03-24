import { NextResponse } from "next/server.js";

async function createServerClient() {
  const { createClient } = await import("../../../utils/Supabase/server.js");
  return createClient();
}

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function parseResourceType(request) {
  const { searchParams } = new URL(request.url);
  return searchParams.get("resourceType")?.trim() || "";
}

export async function GET(request) {
  const supabase = await createServerClient();
  return handleGetBookmarks(request, supabase);
}

export async function POST(request) {
  const supabase = await createServerClient();
  return handleCreateBookmark(request, supabase);
}

export async function DELETE(request) {
  const supabase = await createServerClient();
  return handleDeleteBookmark(request, supabase);
}

export async function handleGetBookmarks(request, supabase) {
  try {
    const resourceType = parseResourceType(request);
    if (!resourceType) {
      return NextResponse.json(
        { error: "resourceType is required" },
        { status: 400 },
      );
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return unauthorized();
    }

    const { data, error } = await supabase
      .from("bookmarks")
      .select("*")
      .eq("user_id", user.id)
      .eq("resource_type", resourceType)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("GET /api/bookmarks error:", error);
      return NextResponse.json({ error: "Failed to load bookmarks" }, { status: 500 });
    }

    return NextResponse.json(data || [], { status: 200 });
  } catch (error) {
    console.error("GET /api/bookmarks unexpected error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function handleCreateBookmark(request, supabase) {
  try {
    const body = await request.json();
    const resourceType = body?.resourceType?.trim();
    const resourceId = body?.resourceId?.trim();

    if (!resourceType || !resourceId) {
      return NextResponse.json(
        { error: "resourceType and resourceId are required" },
        { status: 400 },
      );
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return unauthorized();
    }

    const payload = {
      user_id: user.id,
      resource_type: resourceType,
      resource_id: resourceId,
    };

    const { data, error } = await supabase
      .from("bookmarks")
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error("POST /api/bookmarks error:", error);
      return NextResponse.json({ error: "Failed to create bookmark" }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("POST /api/bookmarks unexpected error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function handleDeleteBookmark(request, supabase) {
  try {
    const body = await request.json();
    const resourceType = body?.resourceType?.trim();
    const resourceId = body?.resourceId?.trim();

    if (!resourceType || !resourceId) {
      return NextResponse.json(
        { error: "resourceType and resourceId are required" },
        { status: 400 },
      );
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return unauthorized();
    }

    const { error } = await supabase
      .from("bookmarks")
      .delete()
      .match({
        user_id: user.id,
        resource_type: resourceType,
        resource_id: resourceId,
      });

    if (error) {
      console.error("DELETE /api/bookmarks error:", error);
      return NextResponse.json({ error: "Failed to delete bookmark" }, { status: 500 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("DELETE /api/bookmarks unexpected error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
