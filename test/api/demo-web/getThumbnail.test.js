import { expect } from 'chai';
import sinon from 'sinon';
import { getThumbnail } from '../../../src/app/api/capture-screenshot/getThumbnail.js';

describe('getThumbnail', () => {
  let fetchStub;
  let lookupStub;
  let readFileStub;

  beforeEach(() => {
    fetchStub = sinon.stub();
    lookupStub = sinon.stub().resolves([{ address: '93.184.216.34' }]);
    readFileStub = sinon.stub().resolves(Buffer.from('default-image-data'));
  });

  function createDeps() {
    return {
      fetchImpl: fetchStub,
      lookup: lookupStub,
      readFile: readFileStub,
    };
  }

  function mockFetch(responses) {
    let callCount = 0;
    fetchStub.callsFake(async () => {
      const response = responses[callCount] || responses[responses.length - 1];
      callCount++;

      if (response.error) {
        throw response.error;
      }

      return {
        ok: response.ok !== undefined ? response.ok : true,
        status: response.status || 200,
        text: response.text ? async () => response.text : async () => '',
        arrayBuffer: response.arrayBuffer ? async () => response.arrayBuffer : async () => new ArrayBuffer(0),
        headers: {
          get: (key) => (response.headers || {})[key] || null
        }
      };
    });
  }

  describe('URL Validation', () => {
    it('should return 400 when URL is missing', async () => {
      const result = await getThumbnail(undefined, createDeps());

      expect(result.status).to.equal(400);
      expect(result.body.error).to.equal('URL is required');
    });

    it('should accept URL without protocol and add https', async () => {
      mockFetch([
        {
          text: '<meta property="og:image" content="https://example.com/image.jpg" />'
        },
        {
          headers: { 'content-type': 'image/jpeg' },
          arrayBuffer: new ArrayBuffer(0)
        }
      ]);

      await getThumbnail('example.com', createDeps());

      expect(fetchStub.firstCall.args[0]).to.equal('https://example.com/');
    });

    it('should reject invalid URL format', async () => {
      const result = await getThumbnail('not a valid url at all!!!', createDeps());

      expect(result.status).to.equal(400);
      expect(result.body.error).to.equal('Invalid or disallowed URL');
    });
  });

  describe('OG Image Extraction', () => {
    it('should extract og:image from meta tag', async () => {
      const htmlContent = `
        <html>
          <head>
            <meta property="og:image" content="https://example.com/og-image.jpg" />
          </head>
        </html>
      `;

      mockFetch([
        { text: htmlContent },
        {
          headers: { 'content-type': 'image/jpeg' },
          arrayBuffer: Buffer.from('fake-image-data')
        }
      ]);

      const result = await getThumbnail('https://example.com', createDeps());

      expect(result.body.success).to.be.true;
      expect(result.body.imageUrl).to.equal('https://example.com/og-image.jpg');
      expect(result.body.isDefault).to.be.false;
    });

    it('should extract og:image:url as fallback', async () => {
      const htmlContent = `
        <html>
          <head>
            <meta property="og:image:url" content="https://example.com/image.jpg" />
          </head>
        </html>
      `;

      mockFetch([
        { text: htmlContent },
        {
          headers: { 'content-type': 'image/jpeg' },
          arrayBuffer: Buffer.from('fake-image-data')
        }
      ]);

      const result = await getThumbnail('https://example.com', createDeps());

      expect(result.body.imageUrl).to.equal('https://example.com/image.jpg');
    });

    it('should use Twitter image as fallback when OG image not found', async () => {
      const htmlContent = `
        <html>
          <head>
            <meta name="twitter:image" content="https://example.com/twitter.jpg" />
          </head>
        </html>
      `;

      mockFetch([
        { text: htmlContent },
        {
          headers: { 'content-type': 'image/jpeg' },
          arrayBuffer: Buffer.from('fake-image-data')
        }
      ]);

      const result = await getThumbnail('https://example.com', createDeps());

      expect(result.body.imageUrl).to.equal('https://example.com/twitter.jpg');
    });
  });

  describe('Image URL Normalization', () => {
    it('should handle protocol-relative URLs', async () => {
      const htmlContent = '<meta property="og:image" content="//cdn.example.com/image.jpg" />';

      mockFetch([
        { text: htmlContent },
        {
          headers: { 'content-type': 'image/jpeg' },
          arrayBuffer: Buffer.from('fake-image-data')
        }
      ]);

      await getThumbnail('https://example.com', createDeps());

      expect(fetchStub.secondCall.args[0]).to.equal('https://cdn.example.com/image.jpg');
    });

    it('should handle relative URLs', async () => {
      const htmlContent = '<meta property="og:image" content="/images/og.jpg" />';

      mockFetch([
        { text: htmlContent },
        {
          headers: { 'content-type': 'image/jpeg' },
          arrayBuffer: Buffer.from('fake-image-data')
        }
      ]);

      await getThumbnail('https://example.com/page', createDeps());

      expect(fetchStub.secondCall.args[0]).to.equal('https://example.com/images/og.jpg');
    });

    it('should handle absolute URLs', async () => {
      const htmlContent = '<meta property="og:image" content="https://cdn.example.com/image.jpg" />';

      mockFetch([
        { text: htmlContent },
        {
          headers: { 'content-type': 'image/jpeg' },
          arrayBuffer: Buffer.from('fake-image-data')
        }
      ]);

      await getThumbnail('https://example.com', createDeps());

      expect(fetchStub.secondCall.args[0]).to.equal('https://cdn.example.com/image.jpg');
    });
  });

  describe('Default Image Fallback', () => {
    it('should return default image when page fetch fails', async () => {
      mockFetch([
        { error: new Error('Network error') }
      ]);

      const result = await getThumbnail('https://example.com', createDeps());

      expect(result.body.isDefault).to.be.true;
    });

    it('should return default image when no OG image found', async () => {
      mockFetch([
        { text: '<html><head></head></html>' }
      ]);

      const result = await getThumbnail('https://example.com', createDeps());

      expect(result.body.isDefault).to.be.true;
    });

    it('should return default image when OG image fetch fails', async () => {
      mockFetch([
        { text: '<meta property="og:image" content="https://example.com/image.jpg" />' },
        { error: new Error('Image fetch failed') }
      ]);

      const result = await getThumbnail('https://example.com', createDeps());

      expect(result.body.isDefault).to.be.true;
    });
  });

  describe('Response Format', () => {
    it('should return base64 encoded image', async () => {
      const fakeImageData = Buffer.from('fake-image-data');

      mockFetch([
        { text: '<meta property="og:image" content="https://example.com/image.jpg" />' },
        {
          headers: { 'content-type': 'image/jpeg' },
          arrayBuffer: fakeImageData
        }
      ]);

      const result = await getThumbnail('https://example.com', createDeps());

      expect(result.body.screenshot).to.be.a('string');
      expect(result.body.contentType).to.equal('image/jpeg');
      expect(result.body.success).to.be.true;
    });

    it('should include content type from response headers', async () => {
      mockFetch([
        { text: '<meta property="og:image" content="https://example.com/image.png" />' },
        {
          headers: { 'content-type': 'image/png' },
          arrayBuffer: Buffer.from('fake-image-data')
        }
      ]);

      const result = await getThumbnail('https://example.com', createDeps());

      expect(result.body.contentType).to.equal('image/png');
    });

    it('should default to image/jpeg when content-type is missing', async () => {
      mockFetch([
        { text: '<meta property="og:image" content="https://example.com/image.jpg" />' },
        {
          headers: {},
          arrayBuffer: Buffer.from('fake-image-data')
        }
      ]);

      const result = await getThumbnail('https://example.com', createDeps());

      expect(result.body.contentType).to.equal('image/jpeg');
    });
  });

  describe('Timeout Handling', () => {
    it('should timeout after 10 seconds for page fetch', async () => {
      mockFetch([
        { error: new Error('Timeout') }
      ]);

      const result = await getThumbnail('https://example.com', createDeps());

      expect(result.body.isDefault).to.be.true;
    });
  });
});
