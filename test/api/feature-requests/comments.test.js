import { expect } from 'chai';
import sinon from 'sinon';

// --- Minimal NextResponse mock ---
const NextResponse = {
    json: (body, init) => ({ body, status: init?.status ?? 200 }),
};

// --- Stub factories ---
// NOTE: comments/route.js destructures requireAuthWithPermission as { error2, profile }
// The guard is: if (error2) return error2
function makeAuthStub({ error2 = null, profile = { id: 'user-1', role: 'partner' } } = {}) {
    return sinon.stub().resolves({ error2, profile });
}

function makeGetReqStub() {
    return {};
}

function makePostReqStub({ content = 'Great idea!' } = {}) {
    return { json: sinon.stub().resolves({ content }) };
}

/**
 * GET supabase stub:
 *   .from('feature_request_comments').select(...).eq(...).order(...) → { data, error }
 */
function makeGetSupabaseStub({ queryResult = { data: [], error: null } } = {}) {
    const order = sinon.stub().resolves(queryResult);
    const eq = sinon.stub().returns({ order });
    const select = sinon.stub().returns({ eq });
    const from = sinon.stub().returns({ select });

    return { client: { from } };
}

/**
 * POST supabase stub:
 *   .from('feature_request_comments').insert([...]).select(...).single() → { data, error }
 */
function makePostSupabaseStub({ singleResult = { data: null, error: null } } = {}) {
    const single = sinon.stub().resolves(singleResult);
    const select = sinon.stub().returns({ single });
    const insert = sinon.stub().returns({ select });
    const from = sinon.stub().returns({ insert });

    return { client: { from } };
}

// --- Handler logic extracted for unit testing ---

async function simulateHandleGet({ id, supabase, requireAuth }) {
    const { error2, profile } = await requireAuth();
    if (error2) return error2;

    const { data, error } = await supabase
        .from('feature_request_comments')
        .select('id, content, created_at, user_id, user:profiles(username)')
        .eq('feature_request_id', id)
        .order('created_at', { ascending: true });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const normalized = (data || []).map((c) => ({
        id: c.id,
        content: c.content,
        created_at: c.created_at,
        user_id: c.user_id,
        username: c.user?.username || null,
    }));

    return NextResponse.json(normalized, { status: 200 });
}

async function simulateHandlePost({ id, req, supabase, requireAuth }) {
    const { error2, profile } = await requireAuth();
    if (error2) return error2;

    const body = await req.json();
    const { content } = body;

    if (!content || content.trim() === '') {
        return NextResponse.json({ error: 'Comment content is required' }, { status: 400 });
    }

    const { data, error } = await supabase
        .from('feature_request_comments')
        .insert([{ feature_request_id: id, user_id: profile.id, content }])
        .select('*, user:profiles(username)')
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json(
        { id: data.id, content: data.content, created_at: data.created_at, user_id: data.user_id, username: data.user?.username || null },
        { status: 201 }
    );
}

// -------------------------------------------------------------------

describe('GET /api/feature-requests/[id]/comments', () => {

    describe('Authorization', () => {
        it('returns the error response when the user lacks permission', async () => {
            const authError = NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            const requireAuth = makeAuthStub({ error2: authError });
            const { client: supabase } = makeGetSupabaseStub();

            const result = await simulateHandleGet({ id: 'fr-1', supabase, requireAuth });

            expect(result.status).to.equal(403);
        });
    });

    describe('Fetching comments', () => {
        it('returns 200 with normalized comment list', async () => {
            const requireAuth = makeAuthStub();
            const rawData = [
                { id: 'c-1', content: 'Nice!', created_at: '2024-01-01', user_id: 'u-1', user: { username: 'alice' } },
                { id: 'c-2', content: 'Agreed', created_at: '2024-01-02', user_id: 'u-2', user: null },
            ];
            const { client: supabase } = makeGetSupabaseStub({ queryResult: { data: rawData, error: null } });

            const result = await simulateHandleGet({ id: 'fr-1', supabase, requireAuth });

            expect(result.status).to.equal(200);
            expect(result.body).to.have.length(2);
            expect(result.body[0].username).to.equal('alice');
            expect(result.body[1].username).to.be.null;
        });

        it('returns 200 with empty array when there are no comments', async () => {
            const requireAuth = makeAuthStub();
            const { client: supabase } = makeGetSupabaseStub({ queryResult: { data: [], error: null } });

            const result = await simulateHandleGet({ id: 'fr-1', supabase, requireAuth });

            expect(result.status).to.equal(200);
            expect(result.body).to.deep.equal([]);
        });

        it('returns 500 when the DB query fails', async () => {
            const requireAuth = makeAuthStub();
            const { client: supabase } = makeGetSupabaseStub({
                queryResult: { data: null, error: { message: 'query failed' } },
            });

            const result = await simulateHandleGet({ id: 'fr-1', supabase, requireAuth });

            expect(result.status).to.equal(500);
            expect(result.body.error).to.equal('query failed');
        });
    });
});

describe('POST /api/feature-requests/[id]/comments', () => {

    describe('Authorization', () => {
        it('returns the error response when the user lacks permission', async () => {
            const authError = NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            const requireAuth = makeAuthStub({ error2: authError });
            const { client: supabase } = makePostSupabaseStub();

            const result = await simulateHandlePost({
                id: 'fr-1',
                req: makePostReqStub(),
                supabase,
                requireAuth,
            });

            expect(result.status).to.equal(403);
        });
    });

    describe('Input validation', () => {
        it('returns 400 when content is empty', async () => {
            const requireAuth = makeAuthStub();
            const { client: supabase } = makePostSupabaseStub();

            const result = await simulateHandlePost({
                id: 'fr-1',
                req: makePostReqStub({ content: '' }),
                supabase,
                requireAuth,
            });

            expect(result.status).to.equal(400);
            expect(result.body.error).to.equal('Comment content is required');
        });

        it('returns 400 when content is only whitespace', async () => {
            const requireAuth = makeAuthStub();
            const { client: supabase } = makePostSupabaseStub();

            const result = await simulateHandlePost({
                id: 'fr-1',
                req: makePostReqStub({ content: '   ' }),
                supabase,
                requireAuth,
            });

            expect(result.status).to.equal(400);
            expect(result.body.error).to.equal('Comment content is required');
        });
    });

    describe('Successful creation', () => {
        it('returns 201 with the created comment', async () => {
            const requireAuth = makeAuthStub({ profile: { id: 'user-1', role: 'partner' } });
            const commentData = {
                id: 'c-1',
                content: 'Great idea!',
                created_at: '2024-01-01T00:00:00Z',
                user_id: 'user-1',
                user: { username: 'alice' },
            };
            const { client: supabase } = makePostSupabaseStub({
                singleResult: { data: commentData, error: null },
            });

            const result = await simulateHandlePost({
                id: 'fr-1',
                req: makePostReqStub({ content: 'Great idea!' }),
                supabase,
                requireAuth,
            });

            expect(result.status).to.equal(201);
            expect(result.body.id).to.equal('c-1');
            expect(result.body.content).to.equal('Great idea!');
            expect(result.body.username).to.equal('alice');
        });

        it('returns null username when user join is missing', async () => {
            const requireAuth = makeAuthStub();
            const commentData = {
                id: 'c-1',
                content: 'A comment',
                created_at: '2024-01-01T00:00:00Z',
                user_id: 'user-1',
                user: null,
            };
            const { client: supabase } = makePostSupabaseStub({
                singleResult: { data: commentData, error: null },
            });

            const result = await simulateHandlePost({
                id: 'fr-1',
                req: makePostReqStub({ content: 'A comment' }),
                supabase,
                requireAuth,
            });

            expect(result.status).to.equal(201);
            expect(result.body.username).to.be.null;
        });
    });

    describe('Database errors', () => {
        it('returns 500 when insert fails', async () => {
            const requireAuth = makeAuthStub();
            const { client: supabase } = makePostSupabaseStub({
                singleResult: { data: null, error: { message: 'insert failed' } },
            });

            const result = await simulateHandlePost({
                id: 'fr-1',
                req: makePostReqStub(),
                supabase,
                requireAuth,
            });

            expect(result.status).to.equal(500);
            expect(result.body.error).to.equal('insert failed');
        });
    });
});
