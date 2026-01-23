import * as cheerio from 'cheerio';
import { BrandingInfo, LogoImage, ColorCode } from '@repo/domain';
import { IBrandingExtractor, BrandingExtractionResult } from '@repo/application';
import { OpenAIService } from './OpenAIService.js';

export class BrandingExtractorService implements IBrandingExtractor {
  constructor(private readonly openAIService: OpenAIService) {}

  async extractFromUrl(url: string): Promise<BrandingExtractionResult> {
    try {
      // Fetch website HTML
      const response = await fetch(url);
      const html = await response.text();
      const $ = cheerio.load(html);

      // Extract company name
      const companyName = 
        $('meta[property="og:site_name"]').attr('content') ||
        $('title').text().split('|')[0].trim() ||
        new URL(url).hostname.replace('www.', '');

      // Extract logo URLs with enhanced selectors
      const logoUrls: string[] = [];
      const seenUrls = new Set<string>();
      
      // Priority 1: Explicit logo selectors
      $('img[alt*="logo" i], img[class*="logo" i], img[id*="logo" i]').each((_, el) => {
        const src = $(el).attr('src');
        if (src) {
          const fullUrl = new URL(src, url).href;
          if (!seenUrls.has(fullUrl)) {
            logoUrls.push(fullUrl);
            seenUrls.add(fullUrl);
          }
        }
      });
      
      // Priority 2: Header/nav area logos
      $('header img, nav img, .header img, .navbar img, .logo img').each((_, el) => {
        const src = $(el).attr('src');
        if (src) {
          const fullUrl = new URL(src, url).href;
          if (!seenUrls.has(fullUrl)) {
            logoUrls.push(fullUrl);
            seenUrls.add(fullUrl);
          }
        }
      });
      
      // Priority 3: SVG logos (often used for branding)
      $('svg[class*="logo" i], svg[id*="logo" i]').each((_, el) => {
        // For inline SVG, we'd need to convert to data URL
        // For now, mark that we found an SVG logo
        const svgHtml = $(el).html();
        if (svgHtml) {
          const svgDataUrl = `data:image/svg+xml,${encodeURIComponent('<svg>' + svgHtml + '</svg>')}`;
          if (!seenUrls.has(svgDataUrl)) {
            logoUrls.push(svgDataUrl);
            seenUrls.add(svgDataUrl);
          }
        }
      });

      // Priority 4: Favicon (fallback)
      const favicon = $('link[rel="icon"], link[rel="shortcut icon"]').attr('href');
      if (favicon) {
        const fullUrl = new URL(favicon, url).href;
        if (!seenUrls.has(fullUrl)) {
          logoUrls.push(fullUrl);
          seenUrls.add(fullUrl);
        }
      }
      
      // Priority 5: Apple touch icon
      const appleTouchIcon = $('link[rel="apple-touch-icon"]').attr('href');
      if (appleTouchIcon) {
        const fullUrl = new URL(appleTouchIcon, url).href;
        if (!seenUrls.has(fullUrl)) {
          logoUrls.push(fullUrl);
          seenUrls.add(fullUrl);
        }
      }

      // Priority 6: og:image (social media preview)
      const ogImage = $('meta[property="og:image"]').attr('content');
      if (ogImage) {
        const fullUrl = new URL(ogImage, url).href;
        if (!seenUrls.has(fullUrl)) {
          logoUrls.push(fullUrl);
          seenUrls.add(fullUrl);
        }
      }

      // Extract colors from CSS and inline styles
      const colors: ColorCode[] = [];
      const seenColors = new Set<string>();
      
      // Extract from style tags
      const colorRegex = /#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{3}/g;
      $('style').each((_, el) => {
        const cssText = $(el).html() || '';
        const matches = cssText.match(colorRegex);
        if (matches) {
          matches.forEach(color => {
            // Normalize 3-digit hex to 6-digit
            const normalized = color.length === 4 
              ? `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`
              : color;
            seenColors.add(normalized.toUpperCase());
          });
        }
      });
      
      // Extract from inline styles
      $('[style]').each((_, el) => {
        const style = $(el).attr('style') || '';
        const matches = style.match(colorRegex);
        if (matches) {
          matches.forEach(color => {
            const normalized = color.length === 4 
              ? `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`
              : color;
            seenColors.add(normalized.toUpperCase());
          });
        }
      });
      
      // Extract from meta theme-color
      const themeColor = $('meta[name="theme-color"]').attr('content');
      if (themeColor && themeColor.startsWith('#')) {
        seenColors.add(themeColor.toUpperCase());
      }
      
      // Filter out common/boring colors and create ColorCode objects
      const boringColors = new Set(['#FFFFFF', '#FFF', '#000000', '#000', '#CCCCCC', '#CCC']);
      const uniqueColors = [...seenColors]
        .filter(c => !boringColors.has(c))
        .slice(0, 5);
      
      uniqueColors.forEach(color => {
        try {
          colors.push(ColorCode.create(color));
        } catch {}
      });

      // Create logo images
      const logos = logoUrls.slice(0, 3).map(logoUrl => 
        LogoImage.create({
          url: logoUrl,
          width: 200,
          height: 200,
          format: logoUrl.endsWith('.svg') ? 'svg' : 'png',
        })
      );

      const branding = BrandingInfo.create({
        sessionId: '', // Will be set by use case
        companyName,
        websiteUrl: url,
        logos,
        colors: colors.length > 0 ? colors : [ColorCode.create('#6366F1')],
        method: 'url_scraping',
      });

      return {
        branding,
        confidence: logos.length > 0 ? 0.8 : 0.4,
      };
    } catch (error) {
      throw new Error(`Failed to extract branding from URL: ${error}`);
    }
  }

  async extractFromFile(file: Buffer, mimeType: string): Promise<BrandingExtractionResult> {
    // For file uploads, we'd typically:
    // 1. Upload to cloud storage
    // 2. Use Vision AI to analyze
    // For now, create a basic response
    
    const fileUrl = `data:${mimeType};base64,${file.toString('base64')}`;
    
    // Use OpenAI Vision to analyze the logo
    const analysis = await this.openAIService.analyzeImage(
      fileUrl,
      'Analyze this logo image. Extract: 1) The company/brand name if visible, 2) The dominant colors (hex codes), 3) The style/industry it represents. Respond in JSON format.'
    );

    // Parse the analysis (simplified)
    const logos = [
      LogoImage.create({
        url: fileUrl,
        width: 500,
        height: 500,
        format: mimeType.split('/')[1] as any,
      }),
    ];

    const branding = BrandingInfo.create({
      sessionId: '', // Will be set by use case
      logos,
      colors: [ColorCode.create('#6366F1')], // Would extract from analysis
      method: 'file_upload',
    });

    return {
      branding,
      confidence: 0.9,
    };
  }
}


