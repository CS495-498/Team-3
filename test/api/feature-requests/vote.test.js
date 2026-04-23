import { expect } from 'chai';
import sinon from 'sinon';

// --- Minimal NextResponse mock ---
const NextResponse = {
    json: (body, init) => ({ body, status: init?.status ?? 200 }),
};

// --- Stub factories ---
function makeAuthStub({ error = null, profile = { id: 'user-1' } } = {}) {
    return sinon.stub().resolves({ error, profile });
}

function makeReqStub(vote) {
    return { json: sinon.stub().resolves({ vote }) };
}

/**
 * Builds a Supabase client stub that supports:
 *   .from('votes').delete().eq().eq()          → deleteResult
 *   .from('profiles').select().eq().single()   → usernameResult
 *   .from('votes').upsert()                    → upsertResult
 *   .from('votes').select('*').eq()            → countResult
 */
function makeSupabaseStub({ deleteResult, usernameResult, upsertResult, countResult } = {}) {
    const stubs = {};

    stubs.delete = sinon.stub().returns({
        eq: sinon.stub().returns({
            eq: sinon.stub().resolves(deleteResult ?? { error: null }),
        }),
    });

    stubs.profileSelect = sinon.stub().returns({
        eq: sinon.stub().returns({
            single: sinon.stub().resolves(usernameResult ?? { data: { username: 'alice' } }),
        }),
    });

    stubs.upsert = sinon.stub().resolves(upsertResult ?? { error: null });

    stubs.countSelect = sinon.stub().returns({
        eq: sinon.stub().resolves(countResult ?? { data: [{ id: 1 }], error: null }),
    });

    const from = sinon.stub().callsFake((table) => {
        if (table === 'profiles') {
            return { select: stubs.profileSelect };
        }
        return {
            delete: () => stubs.delete(),
            upsert: stubs.upsert,
            select: stubs.countSelect,
        };
    });

    return { client: { from }, stubs };
}

// --- Handler logic extracted for unit testing ---
async function simulateHandlePost({ id, req, supabase, requireAuth }) {
    const { error, profile } = await requireAuth();
    if (error) return error;

    const { vote } = await req.json();

    if (!['up', 'remove'].includes(vote)) {
        return NextResponse.json({ error: "Vote must be 'up' or 'remove'" }, { status: 400 });
    }

    try {
        if (vote === 'remove') {
            const { error: delErr } = await supabase
                .from('votes')
                .delete()
                .eq('user_id', profile.id)
                .eq('req_id', id);

            if (delErr) throw delErr;
        } else {
            const { data: username } = await supabase
                .from('profiles')
                .select('username')
                .eq('id', profile.id)
                .single();

            const { error: upErr } = await supabase
                .from('votes')
                .upsert(
                    {
                        user_id: profile.id,
                        req_id: id,
                        Upvoted: vote === 'up',
                        upvoter_username: username?.username,
                    },
                    { onConflict: 'user_id,req_id' }
                );

            if (upErr) throw upErr;
        }

        const { data: votes, error: countErr } = await supabase
            .from('votes')
            .select('*')
            .eq('req_id', id);

        if (countErr) throw countErr;

        const total = votes.length;
        return NextResponse.json({ number_of_votes: total }, { status: 200 });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// -------------------------------------------------------------------

describe('POST /api/feature-requests/[id]/vote', () => {

    describe('Authorization', () => {
        it('returns the error response when the user lacks permission', async () => {
            const authError = NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            const requireAuth = makeAuthStub({ error: authError });
            const { client: supabase } = makeSupabaseStub();

            const result = await simulateHandlePost({
                id: 'fr-1',
                req: makeReqStub('up'),
                supabase,
                requireAuth,
            });

            expect(result.status).to.equal(403);
            expect(result.body.error).to.equal('Forbidden');
        });
    });

    describe('Input validation', () => {
        it('rejects an invalid vote value', async () => {
            const requireAuth = makeAuthStub();
            const { client: supabase } = makeSupabaseStub();

            const result = await simulateHandlePost({
                id: 'fr-1',
                req: makeReqStub('down'),
                supabase,
                requireAuth,
            });

            expect(result.status).to.equal(400);
            expect(result.body.error).to.equal("Vote must be 'up' or 'remove'");
        });

        it('rejects an empty vote value', async () => {
            const requireAuth = makeAuthStub();
            const { client: supabase } = makeSupabaseStub();

            const result = await simulateHandlePost({
                id: 'fr-1',
                req: makeReqStub(''),
                supabase,
                requireAuth,
            });

            expect(result.status).to.equal(400);
        });
    });

    describe('Upvoting', () => {
        it('returns the updated vote count after an upvote', async () => {
            const requireAuth = makeAuthStub({ profile: { id: 'user-1' } });
            const { client: supabase } = makeSupabaseStub({
                usernameResult: { data: { username: 'alice' } },
                upsertResult: { error: null },
                countResult: { data: [{ id: 1 }, { id: 2 }], error: null },
            });

            const result = await simulateHandlePost({
                id: 'fr-1',
                req: makeReqStub('up'),
                supabase,
                requireAuth,
            });

            expect(result.status).to.equal(200);
            expect(result.body.number_of_votes).to.equal(2);
        });

        it('handles a missing username gracefully', async () => {
            const requireAuth = makeAuthStub({ profile: { id: 'user-1' } });
            const { client: supabase } = makeSupabaseStub({
                usernameResult: { data: null },
                upsertResult: { error: null },
                countResult: { data: [{ id: 1 }], error: null },
            });

            const result = await simulateHandlePost({
                id: 'fr-1',
                req: makeReqStub('up'),
                supabase,
                requireAuth,
            });

            expect(result.status).to.equal(200);
        });

        it('returns 500 when the upsert fails', async () => {
            const requireAuth = makeAuthStub();
            const { client: supabase } = makeSupabaseStub({
                upsertResult: { error: { message: 'upsert conflict' } },
            });

            const result = await simulateHandlePost({
                id: 'fr-1',
                req: makeReqStub('up'),
                supabase,
                requireAuth,
            });

            expect(result.status).to.equal(500);
            expect(result.body.error).to.equal('upsert conflict');
        });
    });

    describe('Removing a vote', () => {
        it('returns the updated vote count after removing a vote', async () => {
            const requireAuth = makeAuthStub({ profile: { id: 'user-1' } });
            const { client: supabase } = makeSupabaseStub({
                deleteResult: { error: null },
                countResult: { data: [{ id: 2 }], error: null },
            });

            const result = await simulateHandlePost({
                id: 'fr-1',
                req: makeReqStub('remove'),
                supabase,
                requireAuth,
            });

            expect(result.status).to.equal(200);
            expect(result.body.number_of_votes).to.equal(1);
        });

        it('returns 0 when no votes remain', async () => {
            const requireAuth = makeAuthStub();
            const { client: supabase } = makeSupabaseStub({
                deleteResult: { error: null },
                countResult: { data: [], error: null },
            });

            const result = await simulateHandlePost({
                id: 'fr-1',
                req: makeReqStub('remove'),
                supabase,
                requireAuth,
            });

            expect(result.status).to.equal(200);
            expect(result.body.number_of_votes).to.equal(0);
        });

        it('returns 500 when the delete fails', async () => {
            const requireAuth = makeAuthStub();
            const { client: supabase } = makeSupabaseStub({
                deleteResult: { error: { message: 'delete failed' } },
            });

            const result = await simulateHandlePost({
                id: 'fr-1',
                req: makeReqStub('remove'),
                supabase,
                requireAuth,
            });

            expect(result.status).to.equal(500);
            expect(result.body.error).to.equal('delete failed');
        });
    });

    describe('Vote count query', () => {
        it('returns 500 when the final count query fails', async () => {
            const requireAuth = makeAuthStub();
            const { client: supabase } = makeSupabaseStub({
                deleteResult: { error: null },
                countResult: { data: null, error: { message: 'count query failed' } },
            });

            const result = await simulateHandlePost({
                id: 'fr-1',
                req: makeReqStub('remove'),
                supabase,
                requireAuth,
            });

            expect(result.status).to.equal(500);
            expect(result.body.error).to.equal('count query failed');
        });
    });
});
