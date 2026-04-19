import { NextResponse } from 'next/server'
import { createClient } from '@/utils/Supabase/server.js'
import logger from '@/utils/logger.js'

// Creating a handler to a GET request to route /auth/confirm
export async function GET(request) {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const endpoint = request.nextUrl?.pathname || '/auth/confirm'
    const appUrl = process.env.NEXT_PUBLIC_APP_URL
    const successRedirectTo = new URL('/email-confirmed', appUrl)
    const errorRedirectTo = new URL('/error', appUrl)

    successRedirectTo.searchParams.delete('code')
    errorRedirectTo.searchParams.delete('code')

    logger.info({
        endpoint,
        status_code: 200,
        message: 'Auth confirm route hit',
        metadata: {
            has_code: Boolean(code),
            success_redirect_pathname: successRedirectTo.pathname,
        },
    })

    if (code) {
        try {
            const supabase = await createClient()

            logger.info({
                endpoint,
                status_code: 200,
                message: 'Auth confirm exchangeCodeForSession start',
            })

            const { error } = await supabase.auth.exchangeCodeForSession(code)

            if (!error) {
                logger.info({
                    endpoint,
                    status_code: 307,
                    message: 'Auth confirm exchangeCodeForSession success',
                    metadata: {
                        redirect_pathname: successRedirectTo.pathname,
                    },
                })
                successRedirectTo.searchParams.delete('next')
                return NextResponse.redirect(successRedirectTo)
            }

            logger.warning({
                endpoint,
                status_code: 400,
                message: `Auth confirm exchangeCodeForSession failed: ${error.message}`,
            })
        } catch (error) {
            logger.error({
                endpoint,
                status_code: 500,
                message: `Auth confirm threw: ${error.message}`,
                metadata: {
                    error_stack: error.stack,
                },
            })
        }
    }

    // return the user to an error page with some instructions
    logger.warning({
        endpoint,
        status_code: 307,
        message: 'Auth confirm redirecting to error',
        metadata: {
            has_code: Boolean(code),
        },
    })
    return NextResponse.redirect(errorRedirectTo)
}
