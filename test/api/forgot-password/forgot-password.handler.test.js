import { expect } from 'chai'
import sinon from 'sinon'
import { forgotPasswordHandler } from '../../../src/app/api/forgot-password/handler.js'

describe('forgot-password handler', () => {

    it('always returns a generic message (prevents email enumeration)', async () => {
        // Stub the Supabase password reset call
        const resetPasswordForEmail = sinon.stub().resolves()

        // Create handler with injected dependency
        const handler = forgotPasswordHandler({ resetPasswordForEmail })

        // Call handler with two different emails
        const r1 = await handler({ email: 'exists@example.com', ip: '1.2.3.4' })
        const r2 = await handler({ email: 'not-exists@example.com', ip: '1.2.3.4' })

        // Responses must be identical to prevent account enumeration
        expect(r1.status).to.equal(200)
        expect(r2.status).to.equal(200)
        expect(r1.body).to.deep.equal(r2.body)
        expect(r1.body.message).to.match(/If that email exists/i)
    })

    it('does not call resetPasswordForEmail when email is blank', async () => {
        const resetPasswordForEmail = sinon.stub().resolves()
        const handler = forgotPasswordHandler({ resetPasswordForEmail })

        // Blank / whitespace email should short-circuit
        await handler({ email: '   ', ip: '1.2.3.4' })

        // Supabase should not be called
        expect(resetPasswordForEmail.called).to.equal(false)
    })

    it('calls resetPasswordForEmail when under the rate limit', async () => {
        const resetPasswordForEmail = sinon.stub().resolves()

        // Configure rate limiting and deterministic time
        const handler = forgotPasswordHandler({
            resetPasswordForEmail,
            limit: 5,
            windowMs: 60_000,
            store: new Map(),
            now: () => 1000,
        })

        await handler({ email: 'a@b.com', ip: '1.2.3.4' })

        // Allowed request should reach Supabase
        expect(resetPasswordForEmail.calledOnce).to.equal(true)
        expect(resetPasswordForEmail.firstCall.args[0]).to.equal('a@b.com')
    })

    it('rate limiting blocks extra calls but still returns generic response', async () => {
        const resetPasswordForEmail = sinon.stub().resolves()
        const store = new Map()
        let t = 1000

        const handler = forgotPasswordHandler({
            resetPasswordForEmail,
            limit: 2,
            windowMs: 60_000,
            store,
            now: () => t,
        })

        // Third call should be rate-limited
        const a = await handler({ email: 'a@b.com', ip: '1.2.3.4' })
        const b = await handler({ email: 'a@b.com', ip: '1.2.3.4' })
        const c = await handler({ email: 'a@b.com', ip: '1.2.3.4' })

        // Client-visible behavior must not change
        expect(a.status).to.equal(200)
        expect(b.status).to.equal(200)
        expect(c.status).to.equal(200)

        // Only allowed calls reach Supabase
        expect(resetPasswordForEmail.callCount).to.equal(2)

        // Response stays generic even when limited
        expect(c.body.message).to.match(/If that email exists/i)
    })

    it('rate limit window resets after windowMs', async () => {
        const resetPasswordForEmail = sinon.stub().resolves()
        const store = new Map()
        let t = 1000

        const handler = forgotPasswordHandler({
            resetPasswordForEmail,
            limit: 1,
            windowMs: 60_000,
            store,
            now: () => t,
        })

        // Second call is blocked in same window
        await handler({ email: 'a@b.com', ip: '1.2.3.4' })
        await handler({ email: 'a@b.com', ip: '1.2.3.4' })
        expect(resetPasswordForEmail.callCount).to.equal(1)

        // Advance time past the rate-limit window
        t = 1000 + 60_001

        // Should be allowed again
        await handler({ email: 'a@b.com', ip: '1.2.3.4' })
        expect(resetPasswordForEmail.callCount).to.equal(2)
    })

    it('swallows reset errors and still returns generic response', async () => {
        // Simulate Supabase failure
        const resetPasswordForEmail = sinon.stub().rejects(new Error('Supabase down'))
        const handler = forgotPasswordHandler({ resetPasswordForEmail })

        const r = await handler({ email: 'a@b.com', ip: '1.2.3.4' })

        // Errors must not leak to the client
        expect(r.status).to.equal(200)
        expect(r.body.message).to.match(/If that email exists/i)
    })
})
