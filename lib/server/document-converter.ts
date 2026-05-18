/**
 * Server-side document-to-PDF converter using LibreOffice headless.
 *
 * Converts .doc, .docx, .ppt, .pptx files to PDF via soffice.
 * .pdf files are passed through unchanged.
 */

import { execFile, exec } from 'child_process';
import { promisify } from 'util';
import { mkdtemp, writeFile, readFile, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { createLogger } from '@/lib/logger';

const execFileAsync = promisify(execFile);
const execAsync = promisify(exec);

const log = createLogger('DocumentConverter');

const ALLOWED_EXTENSIONS = ['doc', 'docx', 'ppt', 'pptx', 'pdf'];

const CONVERSION_TIMEOUT_MS = 120_000; // 2 minutes max for conversion

export interface ConversionResult {
  pdfBuffer: Buffer;
  originalName: string;
}

export class ConversionError extends Error {
  constructor(
    message: string,
    public readonly code: 'SOFFICE_NOT_FOUND' | 'TIMEOUT' | 'NO_OUTPUT' | 'UNSUPPORTED_TYPE' | 'CONVERSION_FAILED',
  ) {
    super(message);
    this.name = 'ConversionError';
  }
}

let sofficePath: string | null = null;
let sofficeChecked = false;

async function findSoffice(): Promise<string> {
  if (sofficeChecked) {
    if (!sofficePath) throw new ConversionError('LibreOffice (soffice) 未安装或不在 PATH 中', 'SOFFICE_NOT_FOUND');
    return sofficePath;
  }

  // Common paths on different platforms
  const candidates = [
    'soffice',
    'libreoffice',
    '/usr/bin/soffice',
    '/usr/local/bin/soffice',
    '/opt/libreoffice/program/soffice',
    '/Applications/LibreOffice.app/Contents/MacOS/soffice',
    'C:\\Program Files\\LibreOffice\\program\\soffice.exe',
    'C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe',
  ];

  for (const candidate of candidates) {
    try {
      await execFileAsync(candidate, ['--version'], { timeout: 10000 });
      sofficePath = candidate;
      sofficeChecked = true;
      log.info(`Found soffice at: ${candidate}`);
      return candidate;
    } catch {
      // continue
    }
  }

  // Try `where` / `which`
  try {
    const whichCmd = process.platform === 'win32' ? 'where' : 'which';
    const { stdout } = await execAsync(`${whichCmd} soffice`);
    const found = stdout.trim().split('\n')[0];
    if (found) {
      await execFileAsync(found, ['--version'], { timeout: 10000 });
      sofficePath = found;
      sofficeChecked = true;
      log.info(`Found soffice via ${whichCmd}: ${found}`);
      return found;
    }
  } catch {
    // continue
  }

  sofficeChecked = true;
  throw new ConversionError('LibreOffice (soffice) 未安装或不在 PATH 中', 'SOFFICE_NOT_FOUND');
}

export async function convertToPdf(
  inputBuffer: Buffer,
  fileName: string,
): Promise<ConversionResult> {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    throw new ConversionError(`不支持的文件类型: .${ext}`, 'UNSUPPORTED_TYPE');
  }

  // PDF pass-through
  if (ext === 'pdf') {
    log.info(`PDF pass-through: ${fileName}`);
    return { pdfBuffer: inputBuffer, originalName: fileName };
  }

  const soffice = await findSoffice();

  // Create temp directory
  const tempDir = await mkdtemp(join(tmpdir(), 'doc-convert-'));
  const inputPath = join(tempDir, fileName);

  try {
    // Write input file
    await writeFile(inputPath, inputBuffer);
    log.info(`Written input to: ${inputPath} (${inputBuffer.length} bytes)`);

    // Run LibreOffice conversion
    // soffice --headless --convert-to pdf --outdir <outdir> <input>
    const { stdout, stderr } = await execFileAsync(
      soffice,
      ['--headless', '--convert-to', 'pdf', '--outdir', tempDir, inputPath],
      { timeout: CONVERSION_TIMEOUT_MS, maxBuffer: 10 * 1024 * 1024 },
    );

    if (stdout) log.info(`soffice stdout: ${stdout}`);
    if (stderr) log.warn(`soffice stderr: ${stderr}`);

    // Look for the output PDF
    const baseName = fileName.substring(0, fileName.lastIndexOf('.'));
    const pdfPath = join(tempDir, `${baseName}.pdf`);

    // LibreOffice might name the output slightly differently
    // Try reading the expected output path
    let pdfBuffer: Buffer;
    try {
      pdfBuffer = await readFile(pdfPath);
    } catch {
      // If exact name fails, try looking for any PDF in the temp dir
      const { readdir } = await import('fs/promises');
      const files = await readdir(tempDir);
      const pdfFile = files.find((f) => f.endsWith('.pdf'));
      if (!pdfFile) {
        throw new ConversionError(
          `转换未生成 PDF 文件。stdout: ${stdout}, stderr: ${stderr}`,
          'NO_OUTPUT',
        );
      }
      pdfBuffer = await readFile(join(tempDir, pdfFile));
    }

    log.info(`Conversion successful: ${pdfBuffer.length} bytes PDF output`);
    return { pdfBuffer, originalName: fileName };
  } catch (err) {
    if (err instanceof ConversionError) throw err;

    if (err instanceof Error && err.name === 'AbortError') {
      throw new ConversionError(`文档转换超时 (${CONVERSION_TIMEOUT_MS / 1000}s)`, 'TIMEOUT');
    }

    log.error(`Conversion failed for ${fileName}:`, err);
    throw new ConversionError(
      `文档转换失败: ${err instanceof Error ? err.message : '未知错误'}`,
      'CONVERSION_FAILED',
    );
  } finally {
    // Always clean up temp directory
    try {
      await rm(tempDir, { recursive: true, force: true });
    } catch {
      // best-effort cleanup
    }
  }
}
