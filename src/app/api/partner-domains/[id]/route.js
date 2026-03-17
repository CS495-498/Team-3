import { NextResponse } from "next/server";
import { createClient } from "@/utils/Supabase/server";
import requireAuthWithPermission from "@/utils/auth/requireAuthWithPermission";
import PERMISSIONS from "@/config/permissions";
import { withLogging } from "@/utils/withLogging";

// PUT /api/partner-domains/:id
async function handlePut(req, { params }) {
  const supabase = await createClient();
  const { id } = await params;

  const { error: error2, profile } = await requireAuthWithPermission(PERMISSIONS.MANAGE_PARTNERS);
  if (error2) return error2;

  const { domain, type, reason, active } = await req.json();

  if (!domain || !type) {
    return NextResponse.json({ error: "Domain and type are required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("signup_email_domains")
    .update({
      domain,
      type,
      reason: reason || null,
      active
    })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data, { status: 200 });
}

// DELETE /api/partner-domains/:id
async function handleDelete(req, { params }) {
  const supabase = await createClient();
  const { id } = await params;

  const { error: error2, profile } = await requireAuthWithPermission(PERMISSIONS.MANAGE_PARTNERS);
  if (error2) return error2;

  const { data, error } = await supabase
    .from("signup_email_domains")
    .delete()
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data, { status: 200 });
}

export const PUT = withLogging(handlePut);
export const DELETE = withLogging(handleDelete);