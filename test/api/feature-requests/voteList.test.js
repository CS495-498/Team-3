import { expect } from 'chai';
import sinon from 'sinon';

// --- Minimal NextResponse mock ---
const NextResponse = {
    json: (body, init) => ({ body, status: init?.status ?? 200 }),
};

// --- Stub factories ---
// NOTE: vote-list/route.js destructures requireAuthWithPermission as { profileError, profile }
// The guard is: if (profileError) return profileError
function makeAuthStub({ profileError = null, profile = { id: 'user-1', role: 'partner' } } = {}) {
    return sinon.stub().resolves({ profileError, profile });
}

/**
 * Supabase stub:
 *   .from('votes').select(...).eq('req_id', id) → { data, error }
 */
function makeSupabaseStub({ queryResult = { data: [], error: null } } = {}) {
    const eq = sinon.stub().resolves(queryResult);
    const select = sinon.stub().returns({ eq });
    const from = sinon.stub().returns({ select });

    return { client: { from } };
}

// --- Handler logic extracted for unit testing ---
async function simulateHandleGet({ id, supabase, requireAuth }) {
    const { profileError, profile } = await requireAuth();
    if (profileError) return profileError;

    const { data, error } = await supabase
        .from('votes')
        .select('user_id, req_id, upvoter_username')
        .eq('req_id', id);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const normalized = (data || []).map((c) => ({
        id: c.id,
        upvoter_username: c.upvoter_username || null,
    }));

    return NextResponse.json(normalized, { status: 200 });
}

// -------------------------------------------------------------------

describe('GET /api/feature-requests/[id]/vote-list', () => {

    describe('Authorization', () => {
        it('returns the error response when the user lacks permission', async () => {
            const profileError = NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            const requireAuth = makeAuthStub({ profileError });
            const { client: supabase } = makeSupabaseStub();

            const result = await simulateHandleGet({ id: 'fr-1', supabase, requireAuth });

            expect(result.status).to.equal(403);
            expect(result.body.error).to.equal('Forbidden');
        });
    });

    describe('Fetching vote list', () => {
        it('returns 200 with normalized vote list', async () => {
            const requireAuth = makeAuthStub();
            const rawData = [
                { id: 'v-1', upvoter_username: 'alice', user_id: 'u-1', req_id: 'fr-1' },
                { id: 'v-2', upvoter_username: 'bob', user_id: 'u-2', req_id: 'fr-1' },
            ];
            const { client: supabase } = makeSupabaseStub({ queryResult: { data: rawData, error: null } });

            const result = await simulateHandleGet({ id: 'fr-1', supabase, requireAuth });

            expect(result.status).to.equal(200);
            expect(result.body).to.have.length(2);
            expect(result.body[0].upvoter_username).to.equal('alice');
            expect(result.body[1].upvoter_username).to.equal('bob');
        });

        it('normalizes null upvoter_username to null', async () => {
            const requireAuth = makeAuthStub();
            const rawData = [
                { id: 'v-1', upvoter_username: null, user_id: 'u-1', req_id: 'fr-1' },
            ];
            const { client: supabase } = makeSupabaseStub({ queryResult: { data: rawData, error: null } });

            const result = await simulateHandleGet({ id: 'fr-1', supabase, requireAuth });

            expect(result.status).to.equal(200);
            expect(result.body[0].upvoter_username).to.be.null;
        });

        it('returns 200 with empty array when there are no votes', async () => {
            const requireAuth = makeAuthStub();
            const { client: supabase } = makeSupabaseStub({ queryResult: { data: [], error: null } });

            const result = await simulateHandleGet({ id: 'fr-1', supabase, requireAuth });

            expect(result.status).to.equal(200);
            expect(result.body).to.deep.equal([]);
        });
    });

    describe('Database errors', () => {
        it('returns 500 when the DB query fails', async () => {
            const requireAuth = makeAuthStub();
            const { client: supabase } = makeSupabaseStub({
                queryResult: { data: null, error: { message: 'query failed' } },
            });

            const result = await simulateHandleGet({ id: 'fr-1', supabase, requireAuth });

            expect(result.status).to.equal(500);
            expect(result.body.error).to.equal('query failed');
        });
    });
});
