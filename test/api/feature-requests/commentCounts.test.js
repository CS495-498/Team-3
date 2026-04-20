import { expect } from 'chai';
import sinon from 'sinon';

// --- Minimal NextResponse mock ---
const NextResponse = {
    json: (body, init) => ({ body, status: init?.status ?? 200 }),
};

/**
 * Supabase stub for .rpc('get_feature_request_comment_counts', { ids }) → { data, error }
 */
function makeSupabaseStub({ rpcResult = { data: [], error: null } } = {}) {
    const rpc = sinon.stub().resolves(rpcResult);
    return { client: { rpc } };
}

function makeRequestStub(body) {
    return {
        json: sinon.stub().resolves(body),
        cookies: { getAll: () => [] },
    };
}

// --- Handler logic extracted for unit testing ---
// NOTE: comment-counts/route.js has no auth; it creates its own Supabase client inline.
// We inject supabase as a dependency to test the business logic.
async function simulateHandlePost({ request, supabase }) {
    const { ids } = await request.json().catch(() => ({}));
    if (!Array.isArray(ids) || ids.length === 0) return NextResponse.json({});

    const { data, error } = await supabase.rpc('get_feature_request_comment_counts', { ids });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const map = {};
    for (const row of data || []) {
        map[row.feature_request_id] = Number(row.comment_count || 0);
    }

    return NextResponse.json(map);
}

// -------------------------------------------------------------------

describe('POST /api/feature-requests/comment-counts', () => {

    describe('Input validation', () => {
        it('returns empty object when ids is missing', async () => {
            const { client: supabase } = makeSupabaseStub();
            const request = makeRequestStub({});

            const result = await simulateHandlePost({ request, supabase });

            expect(result.status).to.equal(200);
            expect(result.body).to.deep.equal({});
        });

        it('returns empty object when ids is not an array', async () => {
            const { client: supabase } = makeSupabaseStub();
            const request = makeRequestStub({ ids: 'not-an-array' });

            const result = await simulateHandlePost({ request, supabase });

            expect(result.status).to.equal(200);
            expect(result.body).to.deep.equal({});
        });

        it('returns empty object when ids is an empty array', async () => {
            const { client: supabase } = makeSupabaseStub();
            const request = makeRequestStub({ ids: [] });

            const result = await simulateHandlePost({ request, supabase });

            expect(result.status).to.equal(200);
            expect(result.body).to.deep.equal({});
        });

        it('returns empty object when request body is invalid JSON', async () => {
            const { client: supabase } = makeSupabaseStub();
            const request = {
                json: sinon.stub().rejects(new SyntaxError('Unexpected token')),
                cookies: { getAll: () => [] },
            };

            const result = await simulateHandlePost({ request, supabase });

            expect(result.status).to.equal(200);
            expect(result.body).to.deep.equal({});
        });
    });

    describe('RPC result mapping', () => {
        it('returns a map of feature_request_id to comment count', async () => {
            const rpcData = [
                { feature_request_id: 'fr-1', comment_count: 3 },
                { feature_request_id: 'fr-2', comment_count: 7 },
            ];
            const { client: supabase } = makeSupabaseStub({ rpcResult: { data: rpcData, error: null } });
            const request = makeRequestStub({ ids: ['fr-1', 'fr-2'] });

            const result = await simulateHandlePost({ request, supabase });

            expect(result.status).to.equal(200);
            expect(result.body['fr-1']).to.equal(3);
            expect(result.body['fr-2']).to.equal(7);
        });

        it('maps comment_count of 0 correctly (not coerced to false)', async () => {
            const rpcData = [{ feature_request_id: 'fr-1', comment_count: 0 }];
            const { client: supabase } = makeSupabaseStub({ rpcResult: { data: rpcData, error: null } });
            const request = makeRequestStub({ ids: ['fr-1'] });

            const result = await simulateHandlePost({ request, supabase });

            expect(result.status).to.equal(200);
            expect(result.body['fr-1']).to.equal(0);
        });

        it('handles null comment_count as 0', async () => {
            const rpcData = [{ feature_request_id: 'fr-1', comment_count: null }];
            const { client: supabase } = makeSupabaseStub({ rpcResult: { data: rpcData, error: null } });
            const request = makeRequestStub({ ids: ['fr-1'] });

            const result = await simulateHandlePost({ request, supabase });

            expect(result.status).to.equal(200);
            expect(result.body['fr-1']).to.equal(0);
        });

        it('returns empty map when RPC data is empty', async () => {
            const { client: supabase } = makeSupabaseStub({ rpcResult: { data: [], error: null } });
            const request = makeRequestStub({ ids: ['fr-1'] });

            const result = await simulateHandlePost({ request, supabase });

            expect(result.status).to.equal(200);
            expect(result.body).to.deep.equal({});
        });
    });

    describe('Database errors', () => {
        it('returns 500 when the RPC call fails', async () => {
            const { client: supabase } = makeSupabaseStub({
                rpcResult: { data: null, error: { message: 'rpc failed' } },
            });
            const request = makeRequestStub({ ids: ['fr-1'] });

            const result = await simulateHandlePost({ request, supabase });

            expect(result.status).to.equal(500);
            expect(result.body.error).to.equal('rpc failed');
        });
    });
});
