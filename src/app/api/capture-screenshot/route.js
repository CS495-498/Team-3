import * as cheerio from 'cheerio';
import { readFile } from 'fs/promises';
import { join } from 'path';

function normalizeUrl(url) {
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
  } catch (e) {
    throw new Error('Invalid URL format');
  }
}

async function getDefaultImage() {
  try {
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
  } catch (error) {
    console.error('Error loading default image:', error);
    throw new Error('Failed to load default image');
  }
}

export async function POST(request) {
  try {
    const { url } = await request.json();
    
    if (!url) {
      return Response.json({ error: 'URL is required' }, { status: 400 });
    }

    let normalizedUrl;
    try {
      normalizedUrl = normalizeUrl(url);
    } catch (e) {
      return Response.json({ 
        error: 'Invalid URL format',
        details: e.message 
      }, { status: 400 });
    }

    let response;
    try {
      response = await fetch(normalizedUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        signal: AbortSignal.timeout(10000)
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch page: ${response.status}`);
      }
    } catch (fetchError) {
      console.warn('Failed to fetch page, using default image:', fetchError.message);
      const defaultImage = await getDefaultImage();
      return Response.json(defaultImage);
    }

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
      console.log('No OG image found, using default image');
      const defaultImage = await getDefaultImage();
      return Response.json(defaultImage);
    }

    if (ogImage.startsWith('//')) {
      ogImage = 'https:' + ogImage;
    } else if (ogImage.startsWith('/')) {
      const urlObj = new URL(normalizedUrl);
      ogImage = `${urlObj.protocol}//${urlObj.host}${ogImage}`;
    }

    try {
      const imageResponse = await fetch(ogImage, {
        signal: AbortSignal.timeout(10000)
      });
      
      if (!imageResponse.ok) {
        throw new Error('Failed to fetch image');
      }

      const imageBuffer = await imageResponse.arrayBuffer();
      const base64 = Buffer.from(imageBuffer).toString('base64');
      
      const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';

      return Response.json({ 
        success: true,
        screenshot: base64,
        contentType: contentType,
        imageUrl: ogImage,
        isDefault: false
      });
    } catch (imageError) {
      console.warn('Failed to fetch OG image, using default:', imageError.message);
      const defaultImage = await getDefaultImage();
      return Response.json(defaultImage);
    }
    
  } catch (error) {
    console.error('OG Image fetch error:', error);
    
    try {
      const defaultImage = await getDefaultImage();
      return Response.json(defaultImage);
    } catch (defaultError) {
      return Response.json({ 
        error: 'Failed to fetch preview image and default image',
        details: error.message 
      }, { status: 500 });
    }
  }
}
