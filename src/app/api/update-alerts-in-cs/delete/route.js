import { NextResponse } from "next/server";
import { deleteNotification } from "../deleteAlert.js";

export async function PUT(request) {
    try {
        const { entryUid, alerts } = await request.json();

        const result = await deleteNotification(entryUid, alerts);

        if (result.status === 200) {
            return NextResponse.json(result);
        } else {
            return NextResponse.json(
                { error: result.error, details: result.details },
                { status: result.status }
            );
        }
    } catch (error) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}