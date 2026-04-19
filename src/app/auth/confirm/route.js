import { NextResponse } from 'next/server'
import { createClient } from '@/utils/Supabase/server.js'
import logger from '@/utils/logger.js'

export async function GET(request) {
    const { searchParams } = new URL(request.url)
    const token_hash = searchParams.get('token_hash')
    const type = searchParams.get('type')
    const next = '/login'
    const endpoint = request.nextUrl?.pathname || '/auth/confirm'

    const redirectTo = request.nextUrl.clone()
    redirectTo.pathname = next
    redirectTo.searchParams.delete('token_hash')
    redirectTo.searchParams.delete('type')

    logger.info({
        endpoint,
        status_code: 200,
        message: 'Auth confirm route hit',
        metadata: {
            has_token_hash: Boolean(token_hash),
            type,
            redirect_pathname: redirectTo.pathname,
        },
    })

    if (token_hash && type) {
        try {
            const supabase = await createClient()

            logger.info({
                endpoint,
                status_code: 200,
                message: 'Auth confirm verifyOtp start',
                metadata: { type },
            })

            const { error } = await supabase.auth.verifyOtp({
                type,
                token_hash,
            })

            if (!error) {
                logger.info({
                    endpoint,
                    status_code: 307,
                    message: 'Auth confirm verifyOtp success',
                    metadata: {
                        redirect_pathname: redirectTo.pathname,
                    },
                })
                redirectTo.searchParams.delete('next')
                return NextResponse.redirect(redirectTo)
            }

            logger.warning({
                endpoint,
                status_code: 400,
                message: `Auth confirm verifyOtp failed: ${error.message}`,
                metadata: { type },
            })
        } catch (error) {
            logger.error({
                endpoint,
                status_code: 500,
                message: `Auth confirm threw: ${error.message}`,
                metadata: {
                    type,
                    error_stack: error.stack,
                },
            })
        }
    }

    // return the user to an error page with some instructions
    redirectTo.pathname = '/error'
    logger.warning({
        endpoint,
        status_code: 307,
        message: 'Auth confirm redirecting to error',
        metadata: {
            has_token_hash: Boolean(token_hash),
            type,
        },
    })
    return NextResponse.redirect(redirectTo)
}
