import { expect } from 'chai'
import sinon from 'sinon'
import { signupHandler } from '../../../../src/app/api/auth/signup/handler.js'

describe('public/signup handler', () => {

    it('returns success when signup succeeds', async () => {
        const signUp = sinon.stub().resolves({ error: null })
        const handler = signupHandler({ signUp })

        const r = await handler({
            email: 'a@b.com',
            password: 'password123',
        })

        expect(r.status).to.equal(200)
        expect(r.body.success).to.equal(true)

        expect(signUp.calledOnce).to.equal(true)
        expect(signUp.firstCall.args[0]).to.deep.equal({
            email: 'a@b.com',
            password: 'password123',
        })
    })

    it('returns 400 when Supabase returns an error', async () => {
        const signUp = sinon.stub().resolves({
            error: { message: 'User already registered' },
        })

        const handler = signupHandler({ signUp })

        const r = await handler({
            email: 'a@b.com',
            password: 'password123',
        })

        expect(r.status).to.equal(400)
        expect(r.body).to.deep.equal({
            error: 'User already registered',
        })
    })

    it('does not call signUp when email is blank', async () => {
        const signUp = sinon.stub().resolves({})
        const handler = signupHandler({ signUp })

        const r = await handler({
            email: '   ',
            password: 'password123',
        })

        expect(r.status).to.equal(400)
        expect(r.body.error).to.match(/required/i)
        expect(signUp.called).to.equal(false)
    })

    it('does not call signUp when password is blank', async () => {
        const signUp = sinon.stub().resolves({})
        const handler = signupHandler({ signUp })

        const r = await handler({
            email: 'a@b.com',
            password: '   ',
        })

        expect(r.status).to.equal(400)
        expect(r.body.error).to.match(/required/i)
        expect(signUp.called).to.equal(false)
    })

    it('returns 500 if signUp throws', async () => {
        const signUp = sinon.stub().rejects(new Error('Supabase down'))
        const handler = signupHandler({ signUp })

        const r = await handler({
            email: 'a@b.com',
            password: 'password123',
        })

        expect(r.status).to.equal(500)
        expect(r.body).to.deep.equal({
            error: 'Internal server error',
        })
    })
})
