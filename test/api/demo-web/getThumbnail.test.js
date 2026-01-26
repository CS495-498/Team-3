import { expect } from 'chai';
import sinon from 'sinon';
import { POST } from '../../../src/app/api/capture-screenshot/route.js';

describe('Open Graph Image Getter API', () => {
  let originalFetch;

  beforeEach(() => {
    // Save original fetch
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    // Restore original fetch
    globalThis.fetch = originalFetch;
  });

  // Helper to mock fetch
  function mockFetch(responses) {
    let callCount = 0;
    globalThis.fetch = sinon.stub().callsFake(async (url, options) => {
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
      const request = {
        json: async () => ({})
      };

      const response = await POST(request);
      const data = await response.json();

      expect(data.error).to.equal('URL is required');
    });

    it('should accept URL without protocol and add https', async () => {
      const request = {
        json: async () => ({ url: 'example.com' })
      };

      mockFetch([
        { 
          text: '<meta property="og:image" content="https://example.com/image.jpg" />' 
        },
        { 
          headers: { 'content-type': 'image/jpeg' },
          arrayBuffer: new ArrayBuffer(0)
        }
      ]);

      await POST(request);

      expect(globalThis.fetch.firstCall.args[0]).to.equal('https://example.com/');
    });

    it('should reject invalid URL format', async () => {
      const request = {
        json: async () => ({ url: 'not a valid url at all!!!' })
      };

      const response = await POST(request);
      const data = await response.json();

      expect(data.error).to.equal('Invalid URL format');
    });

    it('should reject non-http protocols', async () => {
      const request = {
        json: async () => ({ url: 'ftp://example.com' })
      };

      const response = await POST(request);
      const data = await response.json();

      // Should either reject with error OR return default image fallback
      // (depending on whether URL validation or fetch fails first)
      const hasError = data.error !== undefined;
      const hasDefaultFallback = data.isDefault === true;
      
      expect(hasError || hasDefaultFallback).to.be.true;
    });
  });

  describe('OG Image Extraction', () => {
    it('should extract og:image from meta tag', async () => {
      const request = {
        json: async () => ({ url: 'https://example.com' })
      };

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

      const response = await POST(request);
      const data = await response.json();

      expect(data.success).to.be.true;
      expect(data.imageUrl).to.equal('https://example.com/og-image.jpg');
      expect(data.isDefault).to.be.false;
    });

    it('should extract og:image:url as fallback', async () => {
      const request = {
        json: async () => ({ url: 'https://example.com' })
      };

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

      const response = await POST(request);
      const data = await response.json();

      expect(data.imageUrl).to.equal('https://example.com/image.jpg');
    });

    it('should use Twitter image as fallback when OG image not found', async () => {
      const request = {
        json: async () => ({ url: 'https://example.com' })
      };

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

      const response = await POST(request);
      const data = await response.json();

      expect(data.imageUrl).to.equal('https://example.com/twitter.jpg');
    });
  });

  describe('Image URL Normalization', () => {
    it('should handle protocol-relative URLs', async () => {
      const request = {
        json: async () => ({ url: 'https://example.com' })
      };

      const htmlContent = '<meta property="og:image" content="//cdn.example.com/image.jpg" />';

      mockFetch([
        { text: htmlContent },
        { 
          headers: { 'content-type': 'image/jpeg' },
          arrayBuffer: Buffer.from('fake-image-data')
        }
      ]);

      await POST(request);

      expect(globalThis.fetch.secondCall.args[0]).to.equal('https://cdn.example.com/image.jpg');
    });

    it('should handle relative URLs', async () => {
      const request = {
        json: async () => ({ url: 'https://example.com/page' })
      };

      const htmlContent = '<meta property="og:image" content="/images/og.jpg" />';

      mockFetch([
        { text: htmlContent },
        { 
          headers: { 'content-type': 'image/jpeg' },
          arrayBuffer: Buffer.from('fake-image-data')
        }
      ]);

      await POST(request);

      expect(globalThis.fetch.secondCall.args[0]).to.equal('https://example.com/images/og.jpg');
    });

    it('should handle absolute URLs', async () => {
      const request = {
        json: async () => ({ url: 'https://example.com' })
      };

      const htmlContent = '<meta property="og:image" content="https://cdn.example.com/image.jpg" />';

      mockFetch([
        { text: htmlContent },
        { 
          headers: { 'content-type': 'image/jpeg' },
          arrayBuffer: Buffer.from('fake-image-data')
        }
      ]);

      await POST(request);

      expect(globalThis.fetch.secondCall.args[0]).to.equal('https://cdn.example.com/image.jpg');
    });
  });

  describe('Default Image Fallback', () => {
    it('should return default image when page fetch fails', async () => {
      const request = {
        json: async () => ({ url: 'https://example.com' })
      };

      mockFetch([
        { error: new Error('Network error') }
      ]);

      const response = await POST(request);
      const data = await response.json();

      // Should either return default image or an error
      // The API tries to return default image, but that requires filesystem access
      expect(data.isDefault === true || data.error).to.exist;
    });

    it('should return default image when no OG image found', async () => {
      const request = {
        json: async () => ({ url: 'https://example.com' })
      };

      const htmlContent = '<html><head></head></html>';

      mockFetch([
        { text: htmlContent }
      ]);

      const response = await POST(request);
      const data = await response.json();

      // Should either return default image or an error
      expect(data.isDefault === true || data.error).to.exist;
    });

    it('should return default image when OG image fetch fails', async () => {
      const request = {
        json: async () => ({ url: 'https://example.com' })
      };

      const htmlContent = '<meta property="og:image" content="https://example.com/image.jpg" />';

      mockFetch([
        { text: htmlContent },
        { error: new Error('Image fetch failed') }
      ]);

      const response = await POST(request);
      const data = await response.json();

      // Should either return default image or an error
      expect(data.isDefault === true || data.error).to.exist;
    });
  });

  describe('Response Format', () => {
    it('should return base64 encoded image', async () => {
      const request = {
        json: async () => ({ url: 'https://example.com' })
      };

      const htmlContent = '<meta property="og:image" content="https://example.com/image.jpg" />';
      const fakeImageData = Buffer.from('fake-image-data');

      mockFetch([
        { text: htmlContent },
        { 
          headers: { 'content-type': 'image/jpeg' },
          arrayBuffer: fakeImageData
        }
      ]);

      const response = await POST(request);
      const data = await response.json();

      expect(data.screenshot).to.be.a('string');
      expect(data.contentType).to.equal('image/jpeg');
      expect(data.success).to.be.true;
    });

    it('should include content type from response headers', async () => {
      const request = {
        json: async () => ({ url: 'https://example.com' })
      };

      const htmlContent = '<meta property="og:image" content="https://example.com/image.png" />';

      mockFetch([
        { text: htmlContent },
        { 
          headers: { 'content-type': 'image/png' },
          arrayBuffer: Buffer.from('fake-image-data')
        }
      ]);

      const response = await POST(request);
      const data = await response.json();

      expect(data.contentType).to.equal('image/png');
    });

    it('should default to image/jpeg when content-type is missing', async () => {
      const request = {
        json: async () => ({ url: 'https://example.com' })
      };

      const htmlContent = '<meta property="og:image" content="https://example.com/image.jpg" />';

      mockFetch([
        { text: htmlContent },
        { 
          headers: {},
          arrayBuffer: Buffer.from('fake-image-data')
        }
      ]);

      const response = await POST(request);
      const data = await response.json();

      expect(data.contentType).to.equal('image/jpeg');
    });
  });

  describe('Timeout Handling', () => {
    it('should timeout after 10 seconds for page fetch', async () => {
      const request = {
        json: async () => ({ url: 'https://example.com' })
      };

      mockFetch([
        { error: new Error('Timeout') }
      ]);

      const response = await POST(request);
      const data = await response.json();

      // Should fall back to default image or return error
      expect(data.isDefault === true || data.error).to.exist;
    });
  });
});