import { expect } from 'chai';
import sinon from 'sinon';

// --- Minimal NextResponse mock ---
const NextResponse = {
    json: (body, init) => ({ body, status: init?.status ?? 200 }),
    redirect: (url) => ({ redirect: url, status: 302 }),
};

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

// --- Stub factories ---
// NOTE: images/route.js destructures requireAuthWithPermission as { error: authError, supabase }
// The supabase client is returned from requireAuth (not created separately in the handler)
function makeUploadAuthStub({ error = null, supabase = null } = {}) {
    return sinon.stub().resolves({ error, supabase });
}

// For images/[...path]/route.js — only uses { error: authError }
function makeGetAuthStub({ error = null } = {}) {
    return sinon.stub().resolves({ error });
}

function makeUploadReqStub({ file = null } = {}) {
    const formDataMap = new Map();
    if (file !== null) formDataMap.set('file', file);

    return {
        formData: sinon.stub().resolves({
            get: (key) => formDataMap.get(key) ?? null,
        }),
    };
}

function makeStorageStub({ uploadResult = { error: null } } = {}) {
    const upload = sinon.stub().resolves(uploadResult);
    const bucket = { upload };
    return {
        storage: {
            from: sinon.stub().returns(bucket),
        },
        stubs: { upload, bucket },
    };
}

function makeServiceClientStub({ signedUrlResult = { data: null, error: null } } = {}) {
    const createSignedUrl = sinon.stub().resolves(signedUrlResult);
    const bucket = { createSignedUrl };
    return {
        storage: {
            from: sinon.stub().returns(bucket),
        },
    };
}

// --- Handler logic extracted for unit testing ---

async function simulateUploadPost({ req, requireAuth, fileTypeFromBuffer, buildUrl }) {
    const { error: authError, supabase } = await requireAuth();
    if (authError) return authError;

    const formData = await req.formData();
    const file = formData.get('file');

    if (!file) {
        return NextResponse.json({ error: 'Image file is required' }, { status: 400 });
    }

    if (file.size > MAX_IMAGE_SIZE) {
        return NextResponse.json({ error: 'File too large' }, { status: 413 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const detectedType = await fileTypeFromBuffer(buffer);

    if (!detectedType || !ALLOWED_IMAGE_TYPES.includes(detectedType.mime)) {
        return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }

    const filePath = `embedded/test-uuid.${detectedType.ext}`;

    const { error: uploadError } = await supabase.storage
        .from('feature-uploads')
        .upload(filePath, buffer, { contentType: detectedType.mime, upsert: false });

    if (uploadError) {
        return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    return NextResponse.json({ src: buildUrl(filePath), path: filePath }, { status: 201 });
}

async function simulateImageGet({ params, requireAuth, serviceClient, decodeImagePath }) {
    const { error: authError } = await requireAuth();
    if (authError) return authError;

    const { path = [] } = await params;
    const filePath = decodeImagePath(path);

    if (!filePath) {
        return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    const { data, error } = await serviceClient.storage
        .from('feature-uploads')
        .createSignedUrl(filePath, 60 * 60);

    if (error || !data?.signedUrl) {
        return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    return NextResponse.redirect(data.signedUrl);
}

// -------------------------------------------------------------------

describe('POST /api/feature-requests/images', () => {

    const buildUrl = (path) => `https://example.com/${path}`;
    const fileTypeFromBuffer = sinon.stub();

    afterEach(() => {
        fileTypeFromBuffer.reset();
    });

    describe('Authorization', () => {
        it('returns the auth error response when the user lacks permission', async () => {
            const authError = NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            const requireAuth = makeUploadAuthStub({ error: authError });

            const result = await simulateUploadPost({
                req: makeUploadReqStub(),
                requireAuth,
                fileTypeFromBuffer,
                buildUrl,
            });

            expect(result.status).to.equal(403);
        });
    });

    describe('Input validation', () => {
        it('returns 400 when no file is provided', async () => {
            const storage = makeStorageStub();
            const requireAuth = makeUploadAuthStub({ supabase: storage });

            const result = await simulateUploadPost({
                req: makeUploadReqStub({ file: null }),
                requireAuth,
                fileTypeFromBuffer,
                buildUrl,
            });

            expect(result.status).to.equal(400);
            expect(result.body.error).to.equal('Image file is required');
        });

        it('returns 413 when file exceeds max size', async () => {
            const storage = makeStorageStub();
            const requireAuth = makeUploadAuthStub({ supabase: storage });
            const fakeFile = {
                size: MAX_IMAGE_SIZE + 1,
                arrayBuffer: sinon.stub().resolves(new ArrayBuffer(0)),
            };

            const result = await simulateUploadPost({
                req: makeUploadReqStub({ file: fakeFile }),
                requireAuth,
                fileTypeFromBuffer,
                buildUrl,
            });

            expect(result.status).to.equal(413);
            expect(result.body.error).to.equal('File too large');
        });

        it('returns 400 when file type is not an allowed image type', async () => {
            const storage = makeStorageStub();
            const requireAuth = makeUploadAuthStub({ supabase: storage });
            fileTypeFromBuffer.resolves({ mime: 'application/pdf', ext: 'pdf' });
            const fakeFile = {
                size: 100,
                arrayBuffer: sinon.stub().resolves(new ArrayBuffer(0)),
            };

            const result = await simulateUploadPost({
                req: makeUploadReqStub({ file: fakeFile }),
                requireAuth,
                fileTypeFromBuffer,
                buildUrl,
            });

            expect(result.status).to.equal(400);
            expect(result.body.error).to.equal('Invalid file type');
        });

        it('returns 400 when file type cannot be detected', async () => {
            const storage = makeStorageStub();
            const requireAuth = makeUploadAuthStub({ supabase: storage });
            fileTypeFromBuffer.resolves(undefined);
            const fakeFile = {
                size: 100,
                arrayBuffer: sinon.stub().resolves(new ArrayBuffer(0)),
            };

            const result = await simulateUploadPost({
                req: makeUploadReqStub({ file: fakeFile }),
                requireAuth,
                fileTypeFromBuffer,
                buildUrl,
            });

            expect(result.status).to.equal(400);
        });
    });

    describe('Successful upload', () => {
        it('returns 201 with src and path', async () => {
            const storage = makeStorageStub({ uploadResult: { error: null } });
            const requireAuth = makeUploadAuthStub({ supabase: storage });
            fileTypeFromBuffer.resolves({ mime: 'image/jpeg', ext: 'jpg' });
            const fakeFile = {
                size: 100,
                arrayBuffer: sinon.stub().resolves(new ArrayBuffer(0)),
            };

            const result = await simulateUploadPost({
                req: makeUploadReqStub({ file: fakeFile }),
                requireAuth,
                fileTypeFromBuffer,
                buildUrl,
            });

            expect(result.status).to.equal(201);
            expect(result.body.path).to.include('embedded/');
            expect(result.body.src).to.include('https://example.com/');
        });
    });

    describe('Storage errors', () => {
        it('returns 500 when the storage upload fails', async () => {
            const storage = makeStorageStub({ uploadResult: { error: { message: 'storage failure' } } });
            const requireAuth = makeUploadAuthStub({ supabase: storage });
            fileTypeFromBuffer.resolves({ mime: 'image/png', ext: 'png' });
            const fakeFile = {
                size: 100,
                arrayBuffer: sinon.stub().resolves(new ArrayBuffer(0)),
            };

            const result = await simulateUploadPost({
                req: makeUploadReqStub({ file: fakeFile }),
                requireAuth,
                fileTypeFromBuffer,
                buildUrl,
            });

            expect(result.status).to.equal(500);
            expect(result.body.error).to.equal('storage failure');
        });
    });
});

describe('GET /api/feature-requests/images/[...path]', () => {

    describe('Authorization', () => {
        it('returns the auth error response when the user lacks permission', async () => {
            const authError = NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            const requireAuth = makeGetAuthStub({ error: authError });
            const serviceClient = makeServiceClientStub();
            const decodeImagePath = sinon.stub().returns('embedded/image.jpg');

            const result = await simulateImageGet({
                params: Promise.resolve({ path: ['embedded', 'image.jpg'] }),
                requireAuth,
                serviceClient,
                decodeImagePath,
            });

            expect(result.status).to.equal(403);
        });
    });

    describe('Path handling', () => {
        it('returns 404 when decodeImagePath returns falsy', async () => {
            const requireAuth = makeGetAuthStub();
            const serviceClient = makeServiceClientStub();
            const decodeImagePath = sinon.stub().returns(null);

            const result = await simulateImageGet({
                params: Promise.resolve({ path: [] }),
                requireAuth,
                serviceClient,
                decodeImagePath,
            });

            expect(result.status).to.equal(404);
            expect(result.body.error).to.equal('Image not found');
        });

        it('returns 404 when decodeImagePath returns empty string', async () => {
            const requireAuth = makeGetAuthStub();
            const serviceClient = makeServiceClientStub();
            const decodeImagePath = sinon.stub().returns('');

            const result = await simulateImageGet({
                params: Promise.resolve({ path: [] }),
                requireAuth,
                serviceClient,
                decodeImagePath,
            });

            expect(result.status).to.equal(404);
        });
    });

    describe('Signed URL generation', () => {
        it('returns 404 when createSignedUrl returns an error', async () => {
            const requireAuth = makeGetAuthStub();
            const serviceClient = makeServiceClientStub({
                signedUrlResult: { data: null, error: { message: 'not found' } },
            });
            const decodeImagePath = sinon.stub().returns('embedded/image.jpg');

            const result = await simulateImageGet({
                params: Promise.resolve({ path: ['embedded', 'image.jpg'] }),
                requireAuth,
                serviceClient,
                decodeImagePath,
            });

            expect(result.status).to.equal(404);
        });

        it('returns 404 when signedUrl is missing from result', async () => {
            const requireAuth = makeGetAuthStub();
            const serviceClient = makeServiceClientStub({
                signedUrlResult: { data: {}, error: null },
            });
            const decodeImagePath = sinon.stub().returns('embedded/image.jpg');

            const result = await simulateImageGet({
                params: Promise.resolve({ path: ['embedded', 'image.jpg'] }),
                requireAuth,
                serviceClient,
                decodeImagePath,
            });

            expect(result.status).to.equal(404);
        });

        it('redirects to the signed URL on success', async () => {
            const requireAuth = makeGetAuthStub();
            const signedUrl = 'https://storage.example.com/signed/image.jpg?token=abc';
            const serviceClient = makeServiceClientStub({
                signedUrlResult: { data: { signedUrl }, error: null },
            });
            const decodeImagePath = sinon.stub().returns('embedded/image.jpg');

            const result = await simulateImageGet({
                params: Promise.resolve({ path: ['embedded', 'image.jpg'] }),
                requireAuth,
                serviceClient,
                decodeImagePath,
            });

            expect(result.status).to.equal(302);
            expect(result.redirect).to.equal(signedUrl);
        });
    });
});
