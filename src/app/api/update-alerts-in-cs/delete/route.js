import { NextResponse } from "next/server";
import { deleteNotification } from "../deleteAlert.js";
import { withLogging } from '@/utils/withLogging';

async function handlePut(request) {
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

export const PUT = withLogging(handlePut);