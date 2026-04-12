import { NextResponse } from "next/server";
import { updateAndPublishDemoWeb } from "./updateAndPublishDemoWeb.js";
import { deleteDemoWeb } from "./deleteDemoWeb.js";
import { createClient } from "@/utils/Supabase/server";
import requireAuthWithPermission from "@/utils/auth/requireAuthWithPermission.js";
import PERMISSIONS from "@/config/permissions";
import { withLogging } from '@/utils/withLogging';

export async function handlePut(
  req,
  {
    requireAuthWithPermissionFn = requireAuthWithPermission,
    updateAndPublishDemoWebFn = updateAndPublishDemoWeb,
  } = {}
) {
  const { error } = await requireAuthWithPermissionFn(
    PERMISSIONS.UPLOAD_DEMO_WEBSITES
  );
  if (error) return error;

  try {
    const { entryUid, demos } = await req.json();

    // CALL HELPER (handles validation and errors)
    const result = await updateAndPublishDemoWebFn(entryUid, demos);

    return NextResponse.json(result, { status: result.status });

  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function handleDelete(
  req,
  {
    requireAuthWithPermissionFn = requireAuthWithPermission,
    deleteDemoWebFn = deleteDemoWeb,
  } = {}
) {
  const { error } = await requireAuthWithPermissionFn(
    PERMISSIONS.UPLOAD_DEMO_WEBSITES
  );
  if (error) return error;

  try {
    const { entryUid, demos } = await req.json();

    // CALL HELPER (handles validation and errors)
    const result = await deleteDemoWebFn(entryUid, demos);

    return NextResponse.json(result, { status: result.status });

  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export const PUT = withLogging(handlePut);
export const DELETE = withLogging(handleDelete);
