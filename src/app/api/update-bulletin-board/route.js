import { NextResponse } from "next/server";
import requireAuthWithPermission from "@/utils/auth/requireAuthWithPermission.js";
import PERMISSIONS from "@/config/permissions";
import { withLogging } from "@/utils/withLogging";
import { updateAndPublishBulletinBoard } from "./updateAndPublishBulletinBoard.js";

async function handlePut(req) {
  const { error } = await requireAuthWithPermission(
    PERMISSIONS.MANAGE_BULLETIN_BOARD
  );
  if (error) return error;

  try {
    const { entryUid, bulletin_board } = await req.json();

    if (!entryUid || bulletin_board === undefined) {
      return NextResponse.json(
        { error: "Missing entryUid or bulletin_board" },
        { status: 400 }
      );
    }

    const result = await updateAndPublishBulletinBoard(entryUid, bulletin_board);
    return NextResponse.json(result, { status: result.status });
  } catch (err) {
    console.error("Bulletin board update failed:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export const PUT = withLogging(handlePut);
