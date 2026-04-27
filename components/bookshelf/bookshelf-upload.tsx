'use client';

import { useRef, useState, useCallback } from 'react';
import { Upload, FileText, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface BookshelfUploadProps {
  onUpload: (file: File, category: string) => Promise<void>;
  categories: { id: string; name: string; color?: string }[];
  className?: string;
}

const ACCEPTED_TYPES = [
  'application/pdf',
  'application/zip',
  'application/x-zip-compressed',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
];

const ACCEPTED_EXTENSIONS = ['.pdf', '.zip', '.doc', '.docx', '.ppt', '.pptx', '.txt'];

export function BookshelfUpload({ onUpload, categories, className }: BookshelfUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('');

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const validateFile = (file: File): boolean => {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    const isValidType = ACCEPTED_TYPES.includes(file.type) || ACCEPTED_EXTENSIONS.includes(ext || '');
    if (!isValidType) {
      toast.error('不支持的文件格式', { description: '请上传 PDF、ZIP、DOC、DOCX、PPT、PPTX 或 TXT 文件' });
      return false;
    }
    if (file.size > 50 * 1024 * 1024) {
      toast.error('文件过大', { description: '文件大小不能超过 50MB' });
      return false;
    }
    return true;
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && validateFile(file)) {
      setSelectedFile(file);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && validateFile(file)) {
      setSelectedFile(file);
    }
  }, []);

  const handleUpload = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    try {
      await onUpload(selectedFile, selectedCategory);
      setSelectedFile(null);
      setSelectedCategory('');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setSelectedCategory('');
  };

  if (selectedFile) {
    return (
      <div className={cn('rounded-2xl border-2 border-dashed border-sky-300 bg-sky-50/50 p-6 dark:border-sky-700 dark:bg-sky-950/30', className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-xl bg-sky-100 text-sky-600 dark:bg-sky-900/40 dark:text-sky-400">
              <FileText className="size-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-50">{selectedFile.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{formatFileSize(selectedFile.size)}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleCancel}
            className="size-8 rounded-full text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300"
          >
            <X className="mx-auto size-4" />
          </button>
        </div>

        {/* Category select */}
        <div className="mt-4">
          <label className="text-xs font-medium text-slate-600 dark:text-slate-300">选择分类</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-sky-300 focus:ring-1 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:focus:border-sky-600"
          >
            <option value="">不分类</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.name}>{cat.name}</option>
            ))}
          </select>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={handleCancel} disabled={isUploading}>
            取消
          </Button>
          <Button size="sm" onClick={handleUpload} disabled={isUploading}>
            {isUploading ? '上传中...' : '确认上传'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-all',
        isDragging
          ? 'border-sky-400 bg-sky-50 dark:border-sky-600 dark:bg-sky-950/30'
          : 'border-slate-200 hover:border-sky-300 hover:bg-sky-50/50 dark:border-slate-700 dark:hover:border-sky-700 dark:hover:bg-sky-950/20',
        className,
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_EXTENSIONS.join(',')}
        onChange={handleFileSelect}
        className="hidden"
      />
      <div className="flex flex-col items-center gap-3">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-sky-100 text-sky-600 dark:bg-sky-900/40 dark:text-sky-400">
          <Upload className="size-6" />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
            拖拽文件到此处，或 <span className="text-sky-600 dark:text-sky-400">点击上传</span>
          </p>
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
            支持 PDF、ZIP、DOC、DOCX、PPT、PPTX、TXT（最大 50MB）
          </p>
        </div>
      </div>
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}
