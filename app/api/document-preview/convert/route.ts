/**
 * POST /api/document-preview/convert
 *
 * Converts Office documents (.doc, .docx, .ppt, .pptx) to PDF via LibreOffice.
 * PDF files are passed through unchanged.
 *
 * Input: multipart/form-data with "file" field
 * Output: application/pdf binary
 */

import { NextRequest, NextResponse } from 'next/server';
import { convertToPdf, ConversionError } from '@/lib/server/document-converter';
import { createLogger } from '@/lib/logger';

const log = createLogger('DocumentPreviewConvert');

const ALLOWED_EXTENSIONS = ['doc', 'docx', 'ppt', 'pptx', 'pdf'];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        { error: '需要 multipart/form-data 请求', code: 'INVALID_CONTENT_TYPE' },
        { status: 400 },
      );
    }

    let formData: FormData;
    try {
      formData = await req.formData();
    } catch {
      return NextResponse.json(
        { error: '无法解析表单数据', code: 'INVALID_FORM_DATA' },
        { status: 400 },
      );
    }

    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json(
        { error: '缺少文件', code: 'MISSING_FILE' },
        { status: 400 },
      );
    }

    const fileName = file.name || 'document';
    const ext = fileName.split('.').pop()?.toLowerCase() || '';

    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json(
        { error: `不支持的文件类型: .${ext}。仅支持: ${ALLOWED_EXTENSIONS.join(', ')}`, code: 'UNSUPPORTED_TYPE' },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `文件过大: ${(file.size / 1024 / 1024).toFixed(1)}MB，最大允许 50MB`, code: 'FILE_TOO_LARGE' },
        { status: 413 },
      );
    }

    log.info(`Converting: ${fileName} (${file.size} bytes, ${ext})`);

    const arrayBuffer = await file.arrayBuffer();
    const inputBuffer = Buffer.from(arrayBuffer);

    const result = await convertToPdf(inputBuffer, fileName);

    return new NextResponse(new Uint8Array(result.pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${encodeURIComponent(fileName.replace(/\.[^.]+$/, '.pdf'))}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    if (err instanceof ConversionError) {
      const statusMap: Record<string, number> = {
        SOFFICE_NOT_FOUND: 503,
        TIMEOUT: 504,
        NO_OUTPUT: 500,
        UNSUPPORTED_TYPE: 400,
        CONVERSION_FAILED: 500,
      };
      const status = statusMap[err.code] || 500;
      log.error(`Conversion error [${err.code}]: ${err.message}`);
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status },
      );
    }

    log.error('Unexpected conversion error:', err);
    return NextResponse.json(
      { error: '服务器内部错误', code: 'INTERNAL_ERROR' },
      { status: 500 },
    );
  }
}
