import { expect } from 'chai';
import sinon from 'sinon';

// --- Inline helper to mimic the route's normalization logic ---
function normalizeVotes(data) {
    return (data || []).map((c) => ({
        id: c.user_id, // matches the fix: use user_id since id is not selected
        upvoter_username: c.upvoter_username || null,
    }));
}

// --- Minimal NextResponse mock ---
const NextResponse = {
    json: (body, init) => ({ body, status: init?.status ?? 200 }),
};

// --- Stub factories ---
function makeSupabaseStub(returnValue) {
    const selectStub = sinon.stub().returns(Promise.resolve(returnValue));
    const eqStub = sinon.stub().returns(Promise.resolve(returnValue));

    // Chain: .from().select().eq()
    const fromStub = sinon.stub().returns({
        select: sinon.stub().returns({ eq: eqStub }),
    });

    return { client: { from: fromStub }, eqStub };
}

function makeAuthStub({ profileError = null, profile = { id: 'user-1' } } = {}) {
    return sinon.stub().resolves({ profileError, profile });
}

// --- Simulate the handler logic (extracted for unit testing) ---
async function simulateHandleGet({ id, supabase, requireAuth }) {
    const { profileError } = await requireAuth();
    if (profileError) return profileError;

    const { data, error } = await supabase
        .from('votes')
        .select('user_id, req_id, upvoter_username')
        .eq('req_id', id);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const normalized = normalizeVotes(data);
    return NextResponse.json(normalized, { status: 200 });
}

// ------------------------------------------------------------------

describe('GET /api/votes/[id]', () => {
    describe('Authorization', () => {
        it('returns the profileError response when the user lacks permission', async () => {
            const profileError = NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            const requireAuth = makeAuthStub({ profileError });
            const { client: supabase } = makeSupabaseStub({ data: [], error: null });

            const result = await simulateHandleGet({ id: 'req-1', supabase, requireAuth });

            expect(result.status).to.equal(403);
            expect(result.body.error).to.equal('Forbidden');
        });

        it('proceeds when the user has the required permission', async () => {
            const requireAuth = makeAuthStub();
            const { client: supabase } = makeSupabaseStub({ data: [], error: null });

            const result = await simulateHandleGet({ id: 'req-1', supabase, requireAuth });

            expect(result.status).to.equal(200);
        });
    });

    describe('Successful responses', () => {
        it('returns an empty array when there are no votes', async () => {
            const requireAuth = makeAuthStub();
            const { client: supabase } = makeSupabaseStub({ data: [], error: null });

            const result = await simulateHandleGet({ id: 'req-42', supabase, requireAuth });

            expect(result.status).to.equal(200);
            expect(result.body).to.deep.equal([]);
        });

        it('normalizes rows correctly', async () => {
            const rows = [
                { user_id: 'user-1', req_id: 'req-42', upvoter_username: 'alice' },
                { user_id: 'user-2', req_id: 'req-42', upvoter_username: null },
            ];
            const requireAuth = makeAuthStub();
            const { client: supabase } = makeSupabaseStub({ data: rows, error: null });

            const result = await simulateHandleGet({ id: 'req-42', supabase, requireAuth });

            expect(result.status).to.equal(200);
            expect(result.body).to.deep.equal([
                { id: 'user-1', upvoter_username: 'alice' },
                { id: 'user-2', upvoter_username: null },
            ]);
        });

        it('sets upvoter_username to null when it is missing', async () => {
            const rows = [{ user_id: 'user-3', req_id: 'req-42', upvoter_username: undefined }];
            const requireAuth = makeAuthStub();
            const { client: supabase } = makeSupabaseStub({ data: rows, error: null });

            const result = await simulateHandleGet({ id: 'req-42', supabase, requireAuth });

            expect(result.body[0].upvoter_username).to.be.null;
        });
    });

    describe('Database errors', () => {
        it('returns 500 with the error message on a Supabase failure', async () => {
            const requireAuth = makeAuthStub();
            const { client: supabase } = makeSupabaseStub({
                data: null,
                error: { message: 'connection timeout' },
            });

            const result = await simulateHandleGet({ id: 'req-1', supabase, requireAuth });

            expect(result.status).to.equal(500);
            expect(result.body.error).to.equal('connection timeout');
        });

        it('handles a null data payload gracefully', async () => {
            const requireAuth = makeAuthStub();
            const { client: supabase } = makeSupabaseStub({ data: null, error: null });

            const result = await simulateHandleGet({ id: 'req-1', supabase, requireAuth });

            expect(result.status).to.equal(200);
            expect(result.body).to.deep.equal([]);
        });
    });
});