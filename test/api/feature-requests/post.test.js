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

function makeReqStub({ title = 'Test title', content = '<p>hello</p>', file = null, contentLength = null } = {}) {
    const formData = new Map();
    if (title !== undefined) formData.set('title', title);
    if (content !== undefined) formData.set('content', content);
    if (file !== null) formData.set('file', file);

    return {
        headers: {
            get: (name) => name === 'content-length' ? contentLength : null,
        },
        formData: sinon.stub().resolves({
            get: (key) => formData.get(key) ?? null,
        }),
    };
}

/**
 * Builds a Supabase stub for the insert flow:
 *   .from('feature_requests').insert([...]).select(...).single() → insertResult
 */
function makeSupabaseStub({ insertResult = { data: null, error: null }, storageResult = { error: null } } = {}) {
    const single = sinon.stub().resolves(insertResult);
    const select = sinon.stub().returns({ single });
    const insert = sinon.stub().returns({ select });

    const storageBucket = {
        upload: sinon.stub().resolves(storageResult),
    };
    const storage = {
        from: sinon.stub().returns(storageBucket),
    };

    const from = sinon.stub().returns({ insert });

    return { client: { from, storage }, stubs: { insert, single, storageBucket } };
}

const TITLE_MAX_LENGTH = 100;
const MAX_FILE_SIZE = 25 * 1024 * 1024;
const ALLOWED_MIME_TYPES = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf', 'video/mp4', 'video/webm', 'video/ogg',
];

// --- Handler logic extracted for unit testing ---
async function simulateHandlePost({ req, supabase, requireAuth, sanitize, fileTypeFromBuffer }) {
    const { error: authError, profile } = await requireAuth();
    if (authError) return authError;

    const contentLength = req.headers.get('content-length');
    if (contentLength && Number(contentLength) > MAX_FILE_SIZE) {
        return NextResponse.json({ error: 'File too large' }, { status: 413 });
    }

    const formData = await req.formData();
    const title = formData.get('title');
    const content = formData.get('content');
    const file = formData.get('file');

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

    const cleanContent = sanitize(content);

    let filePath = null;

    if (file) {
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json({ error: 'File too large' }, { status: 413 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const detectedType = await fileTypeFromBuffer(buffer);

        if (!detectedType || !ALLOWED_MIME_TYPES.includes(detectedType.mime)) {
            return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
        }

        filePath = `uploads/test-uuid.${detectedType.ext}`;

        const { error: uploadError } = await supabase.storage
            .from('feature-uploads')
            .upload(filePath, buffer, { contentType: detectedType.mime, upsert: false });

        if (uploadError) {
            return NextResponse.json({ error: uploadError.message }, { status: 500 });
        }
    }

    const { data, error } = await supabase
        .from('feature_requests')
        .insert([{ title: normalizedTitle, content: cleanContent, status: 'open', user_id: profile.id, file_url: filePath }])
        .select('*, user:profiles!fk_feature_requests_author (username)')
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ...data, username: data.user.username, commentCount: 0 }, { status: 201 });
}

// -------------------------------------------------------------------

const sanitize = (html) => html || '';
const fileTypeFromBuffer = sinon.stub();

describe('POST /api/feature-requests', () => {

    afterEach(() => {
        fileTypeFromBuffer.reset();
    });

    describe('Authorization', () => {
        it('returns the error response when the user lacks permission', async () => {
            const authError = NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            const requireAuth = makeAuthStub({ error: authError });
            const { client: supabase } = makeSupabaseStub();

            const result = await simulateHandlePost({
                req: makeReqStub(),
                supabase,
                requireAuth,
                sanitize,
                fileTypeFromBuffer,
            });

            expect(result.status).to.equal(403);
            expect(result.body.error).to.equal('Forbidden');
        });
    });

    describe('Content-Length check', () => {
        it('returns 413 when content-length header exceeds max file size', async () => {
            const requireAuth = makeAuthStub();
            const { client: supabase } = makeSupabaseStub();

            const result = await simulateHandlePost({
                req: makeReqStub({ contentLength: String(MAX_FILE_SIZE + 1) }),
                supabase,
                requireAuth,
                sanitize,
                fileTypeFromBuffer,
            });

            expect(result.status).to.equal(413);
            expect(result.body.error).to.equal('File too large');
        });
    });

    describe('Input validation', () => {
        it('returns 400 when title is missing', async () => {
            const requireAuth = makeAuthStub();
            const { client: supabase } = makeSupabaseStub();

            const result = await simulateHandlePost({
                req: makeReqStub({ title: '' }),
                supabase,
                requireAuth,
                sanitize,
                fileTypeFromBuffer,
            });

            expect(result.status).to.equal(400);
            expect(result.body.error).to.equal('Title is required');
        });

        it('returns 400 when title is only whitespace', async () => {
            const requireAuth = makeAuthStub();
            const { client: supabase } = makeSupabaseStub();

            const result = await simulateHandlePost({
                req: makeReqStub({ title: '   ' }),
                supabase,
                requireAuth,
                sanitize,
                fileTypeFromBuffer,
            });

            expect(result.status).to.equal(400);
            expect(result.body.error).to.equal('Title is required');
        });

        it('returns 400 when title exceeds 100 characters', async () => {
            const requireAuth = makeAuthStub();
            const { client: supabase } = makeSupabaseStub();

            const result = await simulateHandlePost({
                req: makeReqStub({ title: 'a'.repeat(101) }),
                supabase,
                requireAuth,
                sanitize,
                fileTypeFromBuffer,
            });

            expect(result.status).to.equal(400);
            expect(result.body.error).to.equal(`Title cannot exceed ${TITLE_MAX_LENGTH} characters`);
        });

        it('accepts a title of exactly 100 characters', async () => {
            const requireAuth = makeAuthStub();
            const insertData = { id: '1', title: 'a'.repeat(100), content: '', status: 'open', user_id: 'user-1', file_url: null, user: { username: 'alice' } };
            const { client: supabase } = makeSupabaseStub({ insertResult: { data: insertData, error: null } });

            const result = await simulateHandlePost({
                req: makeReqStub({ title: 'a'.repeat(100) }),
                supabase,
                requireAuth,
                sanitize,
                fileTypeFromBuffer,
            });

            expect(result.status).to.equal(201);
        });
    });

    describe('File handling', () => {
        it('returns 413 when attached file exceeds max size', async () => {
            const requireAuth = makeAuthStub();
            const { client: supabase } = makeSupabaseStub();
            const fakeFile = {
                size: MAX_FILE_SIZE + 1,
                arrayBuffer: sinon.stub().resolves(new ArrayBuffer(0)),
            };

            const result = await simulateHandlePost({
                req: makeReqStub({ file: fakeFile }),
                supabase,
                requireAuth,
                sanitize,
                fileTypeFromBuffer,
            });

            expect(result.status).to.equal(413);
        });

        it('returns 400 when file type is not allowed', async () => {
            const requireAuth = makeAuthStub();
            const { client: supabase } = makeSupabaseStub();
            fileTypeFromBuffer.resolves({ mime: 'text/plain', ext: 'txt' });
            const fakeFile = {
                size: 100,
                arrayBuffer: sinon.stub().resolves(new ArrayBuffer(0)),
            };

            const result = await simulateHandlePost({
                req: makeReqStub({ file: fakeFile }),
                supabase,
                requireAuth,
                sanitize,
                fileTypeFromBuffer,
            });

            expect(result.status).to.equal(400);
            expect(result.body.error).to.equal('Invalid file type');
        });

        it('returns 400 when file type cannot be detected', async () => {
            const requireAuth = makeAuthStub();
            const { client: supabase } = makeSupabaseStub();
            fileTypeFromBuffer.resolves(undefined);
            const fakeFile = {
                size: 100,
                arrayBuffer: sinon.stub().resolves(new ArrayBuffer(0)),
            };

            const result = await simulateHandlePost({
                req: makeReqStub({ file: fakeFile }),
                supabase,
                requireAuth,
                sanitize,
                fileTypeFromBuffer,
            });

            expect(result.status).to.equal(400);
        });

        it('returns 500 when storage upload fails', async () => {
            const requireAuth = makeAuthStub();
            const { client: supabase } = makeSupabaseStub({
                storageResult: { error: { message: 'storage error' } },
            });
            fileTypeFromBuffer.resolves({ mime: 'image/jpeg', ext: 'jpg' });
            const fakeFile = {
                size: 100,
                arrayBuffer: sinon.stub().resolves(new ArrayBuffer(0)),
            };

            const result = await simulateHandlePost({
                req: makeReqStub({ file: fakeFile }),
                supabase,
                requireAuth,
                sanitize,
                fileTypeFromBuffer,
            });

            expect(result.status).to.equal(500);
            expect(result.body.error).to.equal('storage error');
        });
    });

    describe('Successful creation', () => {
        it('returns 201 with the created feature request (no file)', async () => {
            const requireAuth = makeAuthStub({ profile: { id: 'user-1', role: 'partner' } });
            const insertData = {
                id: 'fr-1',
                title: 'My Feature',
                content: '<p>hello</p>',
                status: 'open',
                user_id: 'user-1',
                file_url: null,
                user: { username: 'alice' },
            };
            const { client: supabase } = makeSupabaseStub({ insertResult: { data: insertData, error: null } });

            const result = await simulateHandlePost({
                req: makeReqStub({ title: 'My Feature' }),
                supabase,
                requireAuth,
                sanitize,
                fileTypeFromBuffer,
            });

            expect(result.status).to.equal(201);
            expect(result.body.id).to.equal('fr-1');
            expect(result.body.username).to.equal('alice');
            expect(result.body.commentCount).to.equal(0);
        });
    });

    describe('Database errors', () => {
        it('returns 500 when insert fails', async () => {
            const requireAuth = makeAuthStub();
            const { client: supabase } = makeSupabaseStub({
                insertResult: { data: null, error: { message: 'insert failed' } },
            });

            const result = await simulateHandlePost({
                req: makeReqStub(),
                supabase,
                requireAuth,
                sanitize,
                fileTypeFromBuffer,
            });

            expect(result.status).to.equal(500);
            expect(result.body.error).to.equal('insert failed');
        });
    });
});
