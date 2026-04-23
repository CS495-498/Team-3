import { expect } from 'chai';
import sinon from 'sinon';

// --- Minimal NextResponse mock ---
const NextResponse = {
    json: (body, init) => ({ body, status: init?.status ?? 200 }),
};

// --- Stub factories ---
function makeAuthStub({ error = null, profile = { id: 'user-1', role: 'partner' } } = {}) {
    return sinon.stub().resolves({ error, profile });
}

function makePutReqStub({ title = 'Updated Title', content = '<p>updated</p>', status = 'open' } = {}) {
    return { json: sinon.stub().resolves({ title, content, status }) };
}

/**
 * PUT supabase stub:
 *   .from('feature_requests').update({...}).eq('id', id)[.eq('user_id', ...)?].select(...).single()
 */
function makePutSupabaseStub({ singleResult = { data: null, error: null }, trackEqCalls = true } = {}) {
    const eqCalls = [];
    const single = sinon.stub().resolves(singleResult);
    const select = sinon.stub().returns({ single });

    // The chain: .update().eq().eq()?.select().single()
    // We need a fluent chain that tracks all .eq() calls
    const chain = {
        eq(field, value) {
            eqCalls.push([field, value]);
            return this;
        },
        select() {
            return { single };
        },
    };

    const update = sinon.stub().returns(chain);
    const from = sinon.stub().returns({ update });

    return { client: { from }, eqCalls, stubs: { update, single } };
}

/**
 * DELETE supabase stub:
 *   .from('feature_requests').delete().eq('id', id)[.eq('user_id', ...)?].select()
 */
function makeDeleteSupabaseStub({ selectResult = { data: [], error: null } } = {}) {
    const eqCalls = [];

    const chain = {
        eq(field, value) {
            eqCalls.push([field, value]);
            return this;
        },
        select: sinon.stub().resolves(selectResult),
    };

    const del = sinon.stub().returns(chain);
    const from = sinon.stub().returns({ delete: del });

    return { client: { from }, eqCalls, chain };
}

const TITLE_MAX_LENGTH = 100;
const MANAGE_ALL_PERMISSION = 'MANAGE_ALL_FEATURE_REQUESTS';

// --- Handler logic extracted for unit testing ---

async function simulateHandlePut({ id, req, supabase, requireAuth, hasPermission, sanitize }) {
    const { error: authError, profile } = await requireAuth();
    if (authError) return authError;

    const body = await req.json();
    const { title, content, status } = body;

    const normalizedTitle = title?.toString().trim() || '';

    if (!normalizedTitle) {
        return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    if (normalizedTitle.length > TITLE_MAX_LENGTH) {
        return NextResponse.json(
            { error: `Title cannot exceed ${TITLE_MAX_LENGTH} characters` },
            { status: 400 }
        );
    }

    const canManageAll = hasPermission(profile.role, MANAGE_ALL_PERMISSION);

    let query = supabase
        .from('feature_requests')
        .update({ title: normalizedTitle, content: sanitize(content), status, updated_at: new Date().toISOString() })
        .eq('id', id);

    if (!canManageAll) {
        query = query.eq('user_id', profile.id);
    }

    const { data, error } = await query.select('*, profiles!fk_feature_requests_author (id, username, avatar_url)').single();

    if (error || !data) {
        return NextResponse.json({ error: error?.message || 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(data, { status: 200 });
}

async function simulateHandleDelete({ id, req, supabase, requireAuth, hasPermission }) {
    const { error: authError, profile } = await requireAuth();
    if (authError) return authError;

    const canManageAll = hasPermission(profile.role, MANAGE_ALL_PERMISSION);

    let query = supabase
        .from('feature_requests')
        .delete()
        .eq('id', id);

    if (!canManageAll) {
        query = query.eq('user_id', profile.id);
    }

    const { data, error } = await query.select();

    if (error || !data || data.length === 0) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
}

// -------------------------------------------------------------------

const sanitize = (html) => html || '';

// hasPermission: returns true only for 'admin' role
function hasPermission(role, permission) {
    return role === 'admin';
}

describe('PUT /api/feature-requests/[id]', () => {

    describe('Authorization', () => {
        it('returns the error response when the user lacks permission', async () => {
            const authError = NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            const requireAuth = makeAuthStub({ error: authError });
            const { client: supabase } = makePutSupabaseStub();

            const result = await simulateHandlePut({
                id: 'fr-1',
                req: makePutReqStub(),
                supabase,
                requireAuth,
                hasPermission,
                sanitize,
            });

            expect(result.status).to.equal(403);
        });
    });

    describe('Input validation', () => {
        it('returns 400 when title is missing', async () => {
            const requireAuth = makeAuthStub();
            const { client: supabase } = makePutSupabaseStub();

            const result = await simulateHandlePut({
                id: 'fr-1',
                req: makePutReqStub({ title: '' }),
                supabase,
                requireAuth,
                hasPermission,
                sanitize,
            });

            expect(result.status).to.equal(400);
            expect(result.body.error).to.equal('Title is required');
        });

        it('returns 400 when title is only whitespace', async () => {
            const requireAuth = makeAuthStub();
            const { client: supabase } = makePutSupabaseStub();

            const result = await simulateHandlePut({
                id: 'fr-1',
                req: makePutReqStub({ title: '   ' }),
                supabase,
                requireAuth,
                hasPermission,
                sanitize,
            });

            expect(result.status).to.equal(400);
            expect(result.body.error).to.equal('Title is required');
        });

        it('returns 400 when title exceeds 100 characters', async () => {
            const requireAuth = makeAuthStub();
            const { client: supabase } = makePutSupabaseStub();

            const result = await simulateHandlePut({
                id: 'fr-1',
                req: makePutReqStub({ title: 'a'.repeat(101) }),
                supabase,
                requireAuth,
                hasPermission,
                sanitize,
            });

            expect(result.status).to.equal(400);
            expect(result.body.error).to.equal(`Title cannot exceed ${TITLE_MAX_LENGTH} characters`);
        });
    });

    describe('Permission scoping', () => {
        it('author (partner role) can update their own request', async () => {
            const profile = { id: 'user-1', role: 'partner' };
            const requireAuth = makeAuthStub({ profile });
            const updatedData = { id: 'fr-1', title: 'Updated Title', user_id: 'user-1' };
            const { client: supabase, eqCalls } = makePutSupabaseStub({
                singleResult: { data: updatedData, error: null },
            });

            const result = await simulateHandlePut({
                id: 'fr-1',
                req: makePutReqStub(),
                supabase,
                requireAuth,
                hasPermission,
                sanitize,
            });

            expect(result.status).to.equal(200);
            // user_id filter must be applied for non-admin
            expect(eqCalls.some(([field]) => field === 'user_id')).to.be.true;
        });

        it('admin can update any request without user_id filter', async () => {
            const profile = { id: 'admin-1', role: 'admin' };
            const requireAuth = makeAuthStub({ profile });
            const updatedData = { id: 'fr-1', title: 'Updated Title', user_id: 'other-user' };
            const { client: supabase, eqCalls } = makePutSupabaseStub({
                singleResult: { data: updatedData, error: null },
            });

            const result = await simulateHandlePut({
                id: 'fr-1',
                req: makePutReqStub(),
                supabase,
                requireAuth,
                hasPermission,
                sanitize,
            });

            expect(result.status).to.equal(200);
            // user_id filter must NOT be applied for admin
            expect(eqCalls.some(([field]) => field === 'user_id')).to.be.false;
        });

        it('returns 403 when no matching row is found (non-owner non-admin)', async () => {
            const profile = { id: 'user-1', role: 'partner' };
            const requireAuth = makeAuthStub({ profile });
            const { client: supabase } = makePutSupabaseStub({
                singleResult: { data: null, error: { message: 'no rows' } },
            });

            const result = await simulateHandlePut({
                id: 'fr-1',
                req: makePutReqStub(),
                supabase,
                requireAuth,
                hasPermission,
                sanitize,
            });

            expect(result.status).to.equal(403);
        });
    });
});

describe('DELETE /api/feature-requests/[id]', () => {

    describe('Authorization', () => {
        it('returns the error response when the user lacks permission', async () => {
            const authError = NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            const requireAuth = makeAuthStub({ error: authError });
            const { client: supabase } = makeDeleteSupabaseStub();

            const result = await simulateHandleDelete({
                id: 'fr-1',
                req: {},
                supabase,
                requireAuth,
                hasPermission,
            });

            expect(result.status).to.equal(403);
        });
    });

    describe('Permission scoping', () => {
        it('author (partner role) can delete their own request', async () => {
            const profile = { id: 'user-1', role: 'partner' };
            const requireAuth = makeAuthStub({ profile });
            const { client: supabase, eqCalls } = makeDeleteSupabaseStub({
                selectResult: { data: [{ id: 'fr-1' }], error: null },
            });

            const result = await simulateHandleDelete({
                id: 'fr-1',
                req: {},
                supabase,
                requireAuth,
                hasPermission,
            });

            expect(result.status).to.equal(200);
            expect(result.body.success).to.be.true;
            // user_id filter must be applied for non-admin
            expect(eqCalls.some(([field]) => field === 'user_id')).to.be.true;
        });

        it('admin can delete any request without user_id filter', async () => {
            const profile = { id: 'admin-1', role: 'admin' };
            const requireAuth = makeAuthStub({ profile });
            const { client: supabase, eqCalls } = makeDeleteSupabaseStub({
                selectResult: { data: [{ id: 'fr-1' }], error: null },
            });

            const result = await simulateHandleDelete({
                id: 'fr-1',
                req: {},
                supabase,
                requireAuth,
                hasPermission,
            });

            expect(result.status).to.equal(200);
            expect(result.body.success).to.be.true;
            // user_id filter must NOT be applied for admin
            expect(eqCalls.some(([field]) => field === 'user_id')).to.be.false;
        });

        it('returns 403 when no matching row is found', async () => {
            const requireAuth = makeAuthStub();
            const { client: supabase } = makeDeleteSupabaseStub({
                selectResult: { data: [], error: null },
            });

            const result = await simulateHandleDelete({
                id: 'fr-1',
                req: {},
                supabase,
                requireAuth,
                hasPermission,
            });

            expect(result.status).to.equal(403);
            expect(result.body.error).to.equal('Forbidden');
        });

        it('returns 403 when a DB error occurs', async () => {
            const requireAuth = makeAuthStub();
            const { client: supabase } = makeDeleteSupabaseStub({
                selectResult: { data: null, error: { message: 'db error' } },
            });

            const result = await simulateHandleDelete({
                id: 'fr-1',
                req: {},
                supabase,
                requireAuth,
                hasPermission,
            });

            expect(result.status).to.equal(403);
        });
    });
});
