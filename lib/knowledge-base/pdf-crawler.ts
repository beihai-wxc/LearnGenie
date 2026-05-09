/**
 * 使用Playwright将网页保存为PDF
 * 用于爬取文档网站的原文PDF版本
 */

import { createLogger } from '@/lib/logger';

const log = createLogger('PdfCrawler');

export interface PdfCrawlOptions {
  url: string;
  outputPath: string;
  waitForSelector?: string;
  timeout?: number;
}

async function getChromium() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pw = await import('playwright' as any);
  return pw.chromium;
}

/**
 * 将网页保存为PDF
 * @param options 爬取选项
 * @returns 成功返回true，失败返回false
 */
export async function saveWebPageAsPdf(options: PdfCrawlOptions): Promise<boolean> {
  const { url, outputPath, waitForSelector = 'article, main, .content', timeout = 60000 } = options;

  let browser;
  try {
    log.info(`[PDF Crawler] Starting to save ${url} as PDF`);

    const chromium = await getChromium();
    browser = await chromium.launch({
      headless: true,
    });

    const context = await browser.newContext({
      viewport: { width: 1200, height: 800 },
    });

    const page = await context.newPage();

    // 导航到页面
    await page.goto(url, {
      waitUntil: 'networkidle',
      timeout,
    });

    // 等待内容加载
    try {
      await page.waitForSelector(waitForSelector, { timeout: 10000 });
    } catch {
      log.warn(`[PDF Crawler] Content selector not found, continuing anyway`);
    }

    // 隐藏不必要的元素（导航栏、广告等）
    await page.addStyleTag({
      content: `
        nav, header, footer, .sidebar, .ads, .comments,
        .cookie-banner, .announcement, .feedback-section,
        [class*="navigation"], [class*="advertisement"] {
          display: none !important;
        }
      `,
    });

    // 保存为PDF
    await page.pdf({
      path: outputPath,
      format: 'A4',
      printBackground: true,
      margin: {
        top: '40px',
        right: '40px',
        bottom: '40px',
        left: '40px',
      },
      displayHeaderFooter: true,
      headerTemplate: `
        <div style="font-size: 9px; width: 100%; text-align: center; color: #666;">
          <span class="title"></span>
        </div>
      `,
      footerTemplate: `
        <div style="font-size: 9px; width: 100%; text-align: center; color: #666;">
          <span class="pageNumber"></span> / <span class="totalPages"></span>
        </div>
      `,
    });

    log.info(`[PDF Crawler] Successfully saved PDF to ${outputPath}`);
    return true;

  } catch (error) {
    log.error(`[PDF Crawler] Failed to save ${url} as PDF:`, error);
    return false;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * 检查URL是否支持直接保存为PDF
 * 某些网站可能有反爬虫机制
 */
export async function checkPdfCrawlability(url: string): Promise<{
  canCrawl: boolean;
  reason?: string;
}> {
  let browser;
  try {
    const chromium = await getChromium();
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    const response = await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });

    if (!response) {
      return { canCrawl: false, reason: 'No response from server' };
    }

    if (response.status() >= 400) {
      return { canCrawl: false, reason: `HTTP ${response.status()}` };
    }

    // 检查是否有内容
    const content = await page.$('article, main, .content, [role="main"]');
    if (!content) {
      return { canCrawl: false, reason: 'No main content found' };
    }

    return { canCrawl: true };

  } catch (error) {
    return {
      canCrawl: false,
      reason: error instanceof Error ? error.message : 'Unknown error',
    };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
