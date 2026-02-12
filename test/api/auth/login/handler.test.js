import { expect } from 'chai'
import sinon from 'sinon'
import { loginHandler } from '../../../../src/app/api/auth/login/handler.js'

describe('public/login handler', () => {
    it('returns 200 with session + user on success', async () => {
        const signInWithPassword = sinon.stub().resolves({
            data: { session: { access_token: 'tok' }, user: { id: 'u1' } },
            error: null,
        })

        const handler = loginHandler({ signInWithPassword })

        const r = await handler({ email: 'a@b.com', password: 'pw' })

        expect(r.status).to.equal(200)
        expect(r.body.success).to.equal(true)
        expect(r.body.session).to.deep.equal({ access_token: 'tok' })
        expect(r.body.user).to.deep.equal({ id: 'u1' })

        expect(signInWithPassword.calledOnce).to.equal(true)
        expect(signInWithPassword.firstCall.args[0]).to.deep.equal({
            email: 'a@b.com',
            password: 'pw',
        })
    })

    it('returns 401 with error message when Supabase returns error', async () => {
        const signInWithPassword = sinon.stub().resolves({
            data: { session: null, user: null },
            error: { message: 'Invalid login credentials' },
        })

        const handler = loginHandler({ signInWithPassword })

        const r = await handler({ email: 'a@b.com', password: 'bad' })

        expect(r.status).to.equal(401)
        expect(r.body).to.deep.equal({ error: 'Invalid login credentials' })
        expect(signInWithPassword.calledOnce).to.equal(true)
    })

    it('does not call signInWithPassword when email is blank', async () => {
        const signInWithPassword = sinon.stub().resolves({ data: null, error: null })
        const handler = loginHandler({ signInWithPassword })

        const r = await handler({ email: '   ', password: 'pw' })

        expect(r.status).to.equal(400)
        expect(r.body.error).to.match(/required/i)
        expect(signInWithPassword.called).to.equal(false)
    })

    it('does not call signInWithPassword when password is blank', async () => {
        const signInWithPassword = sinon.stub().resolves({ data: null, error: null })
        const handler = loginHandler({ signInWithPassword })

        const r = await handler({ email: 'a@b.com', password: '   ' })

        expect(r.status).to.equal(400)
        expect(r.body.error).to.match(/required/i)
        expect(signInWithPassword.called).to.equal(false)
    })

    it('returns 500 when signInWithPassword throws', async () => {
        const signInWithPassword = sinon.stub().rejects(new Error('Supabase down'))
        const handler = loginHandler({ signInWithPassword })

        const r = await handler({ email: 'a@b.com', password: 'pw' })

        expect(r.status).to.equal(500)
        expect(r.body).to.deep.equal({ error: 'Supabase down' })
    })
})
