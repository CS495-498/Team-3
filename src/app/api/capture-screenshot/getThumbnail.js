import * as cheerio from 'cheerio';
import { lookup as dnsLookup } from 'dns/promises';
import { readFile as fsReadFile } from 'fs/promises';
import { isIP } from 'net';
import { join } from 'path';

const ALLOWED_PORTS = new Set(['', '80', '443']);
const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '::1',
  '169.254.169.254',
  'metadata.google.internal',
]);

export function normalizeUrl(url) {
  if (!url || typeof url !== 'string') {
    throw new Error('Invalid URL provided');
  }

  url = url.trim();

  if (!url.match(/^https?:\/\//i)) {
    url = 'https://' + url;
  }

  try {
    const urlObj = new URL(url);
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      throw new Error('URL must use http or https protocol');
    }
    return urlObj.href;
  } catch {
    throw new Error('Invalid URL format');
  }
}

function isPrivateIpv4(address) {
  const parts = address.split('.').map(Number);
  if (parts.length !== 4 || parts.some(Number.isNaN)) return true;

  const [a, b] = parts;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224
  );
}

function isPrivateIpv6(address) {
  const normalized = address.toLowerCase();

  return (
    normalized === '::' ||
    normalized === '::1' ||
    normalized.startsWith('fc') ||
    normalized.startsWith('fd') ||
    normalized.startsWith('fe8') ||
    normalized.startsWith('fe9') ||
    normalized.startsWith('fea') ||
    normalized.startsWith('feb') ||
    normalized.startsWith('::ffff:127.') ||
    normalized.startsWith('::ffff:10.') ||
    normalized.startsWith('::ffff:169.254.') ||
    normalized.startsWith('::ffff:172.16.') ||
    normalized.startsWith('::ffff:172.17.') ||
    normalized.startsWith('::ffff:172.18.') ||
    normalized.startsWith('::ffff:172.19.') ||
    normalized.startsWith('::ffff:172.2') ||
    normalized.startsWith('::ffff:172.30.') ||
    normalized.startsWith('::ffff:172.31.') ||
    normalized.startsWith('::ffff:192.168.')
  );
}

function isPrivateAddress(address) {
  const version = isIP(address);
  if (version === 4) return isPrivateIpv4(address);
  if (version === 6) return isPrivateIpv6(address);
  return true;
}

export async function assertSafeOutboundUrl(url, lookup = dnsLookup) {
  const hostname = url.hostname.toLowerCase();

  if (url.username || url.password) {
    throw new Error('URLs with embedded credentials are not allowed');
  }

  if (!ALLOWED_PORTS.has(url.port)) {
    throw new Error('Only standard HTTP(S) ports are allowed');
  }

  if (
    BLOCKED_HOSTNAMES.has(hostname) ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal')
  ) {
    throw new Error('Hostname is not allowed');
  }

  const addresses = await lookup(hostname, { all: true, verbatim: true });
  if (!addresses.length) {
    throw new Error('Hostname did not resolve');
  }

  if (addresses.some(({ address }) => isPrivateAddress(address))) {
    throw new Error('Private network addresses are not allowed');
  }
}

export async function getDefaultImage(readFile = fsReadFile) {
  const imagePath = join(process.cwd(), 'public', 'default-demo-thumbnail.webp');
  const imageBuffer = await readFile(imagePath);
  const base64 = imageBuffer.toString('base64');

  return {
    success: true,
    screenshot: base64,
    contentType: 'image/jpeg',
    imageUrl: '/images/default-demo-thumbnail.jpg',
    isDefault: true
  };
}

export async function getThumbnail(url, deps = {}) {
  const {
    fetchImpl = fetch,
    lookup = dnsLookup,
    readFile = fsReadFile,
  } = deps;

  if (!url) {
    return { status: 400, body: { error: 'URL is required' } };
  }

  let normalizedUrl;
  try {
    normalizedUrl = normalizeUrl(url);
    await assertSafeOutboundUrl(new URL(normalizedUrl), lookup);
  } catch (error) {
    return {
      status: 400,
      body: {
        error: 'Invalid or disallowed URL',
        details: error.message,
      },
    };
  }

  let response;
  try {
    response = await fetchImpl(normalizedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch page: ${response.status}`);
    }
  } catch {
    try {
      return { status: 200, body: await getDefaultImage(readFile) };
    } catch (error) {
      return {
        status: 500,
        body: {
          error: 'Failed to fetch preview image and default image',
          details: error.message,
        },
      };
    }
  }

  try {
    const html = await response.text();
    const $ = cheerio.load(html);

    let ogImage = $('meta[property="og:image"]').attr('content') ||
      $('meta[property="og:image:url"]').attr('content') ||
      $('meta[name="og:image"]').attr('content');

    if (!ogImage) {
      ogImage = $('meta[name="twitter:image"]').attr('content') ||
        $('meta[property="twitter:image"]').attr('content');
    }

    if (!ogImage) {
      return { status: 200, body: await getDefaultImage(readFile) };
    }

    if (ogImage.startsWith('//')) {
      ogImage = `https:${ogImage}`;
    } else if (ogImage.startsWith('/')) {
      const urlObj = new URL(normalizedUrl);
      ogImage = `${urlObj.protocol}//${urlObj.host}${ogImage}`;
    }

    try {
      const safeImageUrl = normalizeUrl(ogImage);
      await assertSafeOutboundUrl(new URL(safeImageUrl), lookup);

      const imageResponse = await fetchImpl(safeImageUrl, {
        signal: AbortSignal.timeout(10000)
      });

      if (!imageResponse.ok) {
        throw new Error('Failed to fetch image');
      }

      const imageBuffer = await imageResponse.arrayBuffer();
      const base64 = Buffer.from(imageBuffer).toString('base64');
      const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';

      return {
        status: 200,
        body: {
          success: true,
          screenshot: base64,
          contentType,
          imageUrl: safeImageUrl,
          isDefault: false
        },
      };
    } catch {
      return { status: 200, body: await getDefaultImage(readFile) };
    }
  } catch {
    try {
      return { status: 200, body: await getDefaultImage(readFile) };
    } catch (error) {
      return {
        status: 500,
        body: {
          error: 'Failed to fetch preview image and default image',
          details: error.message,
        },
      };
    }
  }
}
