'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Download, FileText, Loader2 } from 'lucide-react';
import { getBookshelfItem, getDocumentBlob } from '@/lib/utils/bookshelf-storage';
import { saveAccessHistory } from '@/lib/utils/access-history';
import { createLogger } from '@/lib/logger';

const log = createLogger('DocumentViewer');

const OFFICE_CONVERT_TYPES = ['doc', 'docx', 'ppt', 'pptx'];

type ContentState =
  | { type: 'pdf'; data: string }
  | { type: 'image'; data: string }
  | { type: 'text'; data: string }
  | { type: 'unsupported'; data: string };

type ViewStatus = 'loading' | 'converting' | 'ready' | 'error';

export default function DocumentViewerPage() {
  const params = useParams();
  const router = useRouter();
  const docId = params?.docId as string;

  const [status, setStatus] = useState<ViewStatus>('loading');
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [docMeta, setDocMeta] = useState<{ title: string; fileType: string; fileName?: string } | null>(null);
  const [content, setContent] = useState<ContentState | null>(null);

  // Track object URLs for cleanup
  const objectUrlRef = useRef<string | null>(null);
  const downloadUrlRef = useRef<string | null>(null);

  // Cleanup object URLs on unmount or re-render
  const cleanupUrls = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    if (downloadUrlRef.current) {
      URL.revokeObjectURL(downloadUrlRef.current);
      downloadUrlRef.current = null;
    }
  };

  useEffect(() => {
    if (!docId) return;
    loadDocument();

    return () => {
      cleanupUrls();
    };
  }, [docId]);

  const loadDocument = async () => {
    try {
      cleanupUrls();
      setStatus('loading');
      setError(null);
      setErrorCode(null);
      setContent(null);

      const item = await getBookshelfItem(docId);
      if (!item) {
        setError('文档不存在');
        setStatus('error');
        return;
      }

      setDocMeta({
        title: item.title,
        fileType: item.fileType || 'unknown',
        fileName: item.fileName,
      });

      // Save access history (fire-and-forget)
      try {
        await saveAccessHistory({
          type: 'document',
          targetId: item.id,
          title: item.title,
          subtitle: item.category,
          url: `/document-viewer/${item.id}`,
        });
      } catch {
        // ignore history errors
      }

      const blob = await getDocumentBlob(item.blobKey!);
      if (!blob) {
        setError('无法读取文档内容');
        setStatus('error');
        return;
      }

      const fileType = (item.fileType || '').toLowerCase();

      if (fileType === 'pdf') {
        const url = URL.createObjectURL(blob);
        objectUrlRef.current = url;
        setContent({ type: 'pdf', data: url });
        setStatus('ready');
      } else if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(fileType)) {
        const url = URL.createObjectURL(blob);
        objectUrlRef.current = url;
        setContent({ type: 'image', data: url });
        setStatus('ready');
      } else if (['txt', 'md', 'csv', 'json'].includes(fileType)) {
        const text = await blob.text();
        setContent({ type: 'text', data: text });
        setStatus('ready');
      } else if (OFFICE_CONVERT_TYPES.includes(fileType)) {
        // Office documents: convert to PDF via server API
        await convertAndPreview(blob, item.fileName || item.title);
      } else {
        // Unsupported type: offer download
        const url = URL.createObjectURL(blob);
        downloadUrlRef.current = url;
        setContent({ type: 'unsupported', data: url });
        setStatus('ready');
      }
    } catch (err) {
      log.error('Failed to load document:', err);
      setError(err instanceof Error ? err.message : '加载文档失败');
      setStatus('error');
    }
  };

  const convertAndPreview = async (blob: Blob, fileName: string) => {
    setStatus('converting');

    try {
      const formData = new FormData();
      formData.append('file', blob, fileName);

      const response = await fetch('/api/document-preview/convert', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        // Parse JSON error from API
        let errorMsg = '文档转换失败';
        let code: string | null = null;
        try {
          const errorData = await response.json();
          errorMsg = errorData.error || errorMsg;
          code = errorData.code || null;
        } catch {
          errorMsg = `转换服务返回错误 (${response.status})`;
        }
        setError(errorMsg);
        setErrorCode(code);
        setStatus('error');
        // Still provide download fallback
        const url = URL.createObjectURL(blob);
        downloadUrlRef.current = url;
        return;
      }

      // Success: get PDF blob from response
      const pdfBlob = await response.blob();
      const url = URL.createObjectURL(pdfBlob);
      objectUrlRef.current = url;
      setContent({ type: 'pdf', data: url });
      setStatus('ready');
    } catch (err) {
      log.error('Conversion request failed:', err);
      const errorMsg = err instanceof TypeError && err.message === 'Failed to fetch'
        ? '无法连接到预览转换服务，请检查网络连接'
        : '文档转换请求失败';
      setError(errorMsg);
      setStatus('error');
      // Provide download fallback
      const url = URL.createObjectURL(blob);
      downloadUrlRef.current = url;
    }
  };

  const handleDownload = () => {
    // Prefer the downloadUrlRef (original blob), fallback to objectUrlRef (PDF)
    const url = downloadUrlRef.current || (content?.type === 'pdf' ? content.data : null);
    if (!url) return;

    const a = document.createElement('a');
    a.href = url;
    a.download = docMeta?.fileName || 'download';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const isOfficeType = docMeta && OFFICE_CONVERT_TYPES.includes(docMeta.fileType.toLowerCase());

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50 p-6 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            <ArrowLeft className="size-4" />
            返回
          </button>
          {docMeta && (
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-50">{docMeta.title}</h1>
              <button
                type="button"
                onClick={handleDownload}
                className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-sky-600"
              >
                <Download className="size-4" />
                下载
              </button>
            </div>
          )}
        </div>

        {/* Content area */}
        {status === 'loading' && (
          <div className="flex h-[70vh] items-center justify-center">
            <p className="text-slate-400">加载中...</p>
          </div>
        )}

        {status === 'converting' && (
          <div className="flex h-[70vh] flex-col items-center justify-center gap-4">
            <Loader2 className="size-12 animate-spin text-sky-400" />
            <p className="text-slate-500">正在转换文档，请稍候...</p>
            <p className="text-xs text-slate-400">Office 文档将被转换为 PDF 格式进行预览</p>
          </div>
        )}

        {status === 'error' && (
          <div className="flex h-[70vh] flex-col items-center justify-center gap-4">
            <FileText className="size-12 text-slate-300" />
            <p className="text-slate-500">{error}</p>
            {errorCode === 'SOFFICE_NOT_FOUND' && (
              <p className="text-xs text-slate-400">
                预览服务不可用：服务器未安装 LibreOffice。请联系管理员安装后重试。
              </p>
            )}
            {errorCode === 'TIMEOUT' && (
              <p className="text-xs text-slate-400">
                文档转换超时，文件可能过大或格式复杂。请尝试下载后本地查看。
              </p>
            )}
            {isOfficeType && (
              <p className="text-xs text-slate-400">
                您可以点击右上角"下载"按钮保存文件后本地查看
              </p>
            )}
          </div>
        )}

        {status === 'ready' && content?.type === 'pdf' && (
          <iframe
            src={content.data}
            title={docMeta?.title}
            className="h-[85vh] w-full rounded-2xl border border-slate-200 bg-white dark:border-slate-800"
          />
        )}

        {status === 'ready' && content?.type === 'image' && (
          <div className="flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={content.data}
              alt={docMeta?.title}
              className="max-h-[85vh] rounded-2xl border border-slate-200 shadow-sm dark:border-slate-800"
            />
          </div>
        )}

        {status === 'ready' && content?.type === 'text' && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
            <pre className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700 dark:text-slate-300">
              {content.data}
            </pre>
          </div>
        )}

        {status === 'ready' && content?.type === 'unsupported' && (
          <div className="flex h-[70vh] flex-col items-center justify-center gap-4">
            <FileText className="size-12 text-slate-300" />
            <p className="text-slate-500">该文件类型暂不支持在线预览，请下载后查看</p>
          </div>
        )}
      </div>
    </div>
  );
}
