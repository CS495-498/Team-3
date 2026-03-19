import { NextResponse } from "next/server";
import { createClient } from "@/utils/Supabase/server";
import requireAuthWithPermission from "@/utils/auth/requireAuthWithPermission";
import PERMISSIONS from "@/config/permissions";
import { withLogging } from "@/utils/withLogging";

// GET /api/partner-domains
async function handleGet(req) {
  const supabase = await createClient();

  // Check admin permission
  const { error: error2, profile } = await requireAuthWithPermission(PERMISSIONS.MANAGE_PARTNERS);
  if (error2) return error2;

  const { data, error } = await supabase
    .from("signup_email_domains")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 200 });
}

// POST /api/partner-domains
async function handlePost(req) {
  const supabase = await createClient();

  const { error: error2, profile } = await requireAuthWithPermission(PERMISSIONS.MANAGE_PARTNERS);
  if (error2) return error2;

  const body = await req.json();
  const { domain, type, reason, active } = body;

  if (!domain || !type) {
    return NextResponse.json({ error: "Domain and type are required" }, { status: 400 });
  }

  // Insert new domain
  const { data, error } = await supabase
    .from("signup_email_domains")
    .insert([
      {
        domain,
        type,
        reason: reason || null,
        active: active ?? true
      },
    ])
    .select()
    .single();

  if (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}


export const GET = withLogging(handleGet);
export const POST = withLogging(handlePost);
