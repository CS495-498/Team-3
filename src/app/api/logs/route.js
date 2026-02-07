import { NextResponse } from 'next/server'
import logger from '@/utils/logger.js'

export async function POST(req) {
    const internalSecret = req.headers.get('x-internal-log-secret')
    if (!process.env.LOG_INGEST_SECRET || internalSecret !== process.env.LOG_INGEST_SECRET) {
        return new NextResponse(null, { status: 401 })
    }

    try {
        const logData = await req.json()

        if (!logData.level || !logData.endpoint || !logData.message) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            )
        }

        logger.log({
            level: logData.level,
            endpoint: logData.endpoint,
            status_code: logData.status_code,
            message: logData.message,
            user_id: logData.user_id || null,
            metadata: logData.metadata || null
        })

        return new NextResponse(null, { status: 204 })
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
