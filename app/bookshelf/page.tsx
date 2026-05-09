'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, FolderPlus, X, Clock, Trash2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { nanoid } from 'nanoid';
import { useI18n } from '@/lib/hooks/use-i18n';
import { cn } from '@/lib/utils';
import { Sidebar } from '@/components/sidebar/sidebar';
import { BookshelfTabs } from '@/components/bookshelf/bookshelf-tabs';
import { ClassroomCard, DocumentCard, CategoryCard } from '@/components/bookshelf/bookshelf-card';
import { BookshelfUpload } from '@/components/bookshelf/bookshelf-upload';
import { BookshelfEmpty } from '@/components/bookshelf/bookshelf-empty';
import {
  listStages,
  getFirstSlideByStages,
  deleteStageData,
  renameStage,
  type StageListItem,
} from '@/lib/utils/stage-storage';
import {
  listBookshelfItems,
  saveBookshelfItem,
  deleteBookshelfItem,
  storeDocumentBlob,
  listCategories,
  addCategory,
  removeCategory,
  type BookshelfRecord,
} from '@/lib/utils/bookshelf-storage';
import type { BookshelfCategoryRecord } from '@/lib/utils/database';
import {
  listAccessHistory,
  deleteAccessHistory,
  migrateStagesToAccessHistory,
  saveAccessHistory,
  type AccessHistoryRecord,
} from '@/lib/utils/access-history';

export default function BookshelfPage() {
  const { t } = useI18n();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [classrooms, setClassrooms] = useState<StageListItem[]>([]);
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});
  const [documents, setDocuments] = useState<BookshelfRecord[]>([]);
  const [categories, setCategories] = useState<BookshelfCategoryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [historyRecords, setHistoryRecords] = useState<AccessHistoryRecord[]>([]);

  // Load all data
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [stages, docs, cats] = await Promise.all([
        listStages(),
        listBookshelfItems(),
        listCategories(),
      ]);
      setClassrooms(stages);
      setDocuments(docs);
      setCategories(cats);

      if (stages.length > 0) {
        const slides = await getFirstSlideByStages(stages.map((s) => s.id));
        const urls: Record<string, string> = {};
        for (const [stageId, slide] of Object.entries(slides)) {
          const slideAny = slide as unknown as { elements?: Array<{ type?: string; src?: string }> };
          const imgEl = slideAny.elements?.find((el) => el.type === 'image' && el.src);
          if (imgEl?.src) {
            urls[stageId] = imgEl.src;
          }
        }
        setThumbnails(urls);
      }

      // Migrate existing stages to access history on first load (backward compat)
      await migrateStagesToAccessHistory();
      const history = await listAccessHistory(undefined, 200);
      setHistoryRecords(history);
    } catch (err) {
      toast.error('加载数据失败');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Actions
  const handleOpenClassroom = (id: string) => {
    router.push(`/classroom/${id}`);
  };

  const handleDeleteClassroom = async (id: string) => {
    try {
      await deleteStageData(id);
      setClassrooms((prev) => prev.filter((c) => c.id !== id));
      toast.success('课堂已删除');
    } catch {
      toast.error('删除失败');
    }
  };

  const handleRenameClassroom = async (id: string, name: string) => {
    try {
      await renameStage(id, name);
      setClassrooms((prev) => prev.map((c) => (c.id === id ? { ...c, name } : c)));
      toast.success('重命名成功');
    } catch {
      toast.error('重命名失败');
    }
  };

  const handleUpload = async (file: File, category: string) => {
    try {
      const blobKey = await storeDocumentBlob(file);
      const item: BookshelfRecord = {
        id: nanoid(),
        title: file.name.replace(/\.[^/.]+$/, ''),
        type: 'document',
        fileName: file.name,
        fileType: file.name.split('.').pop()?.toLowerCase() || 'unknown',
        fileSize: file.size,
        blobKey,
        category: category || '未分类',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      await saveBookshelfItem(item);
      setDocuments((prev) => [...prev, item]);
      setShowUpload(false);
      toast.success('文件已上传');
    } catch {
      toast.error('上传失败');
    }
  };

  const handleDeleteDocument = async (id: string) => {
    try {
      await deleteBookshelfItem(id);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      toast.success('文档已删除');
    } catch {
      toast.error('删除失败');
    }
  };

  const handleOpenDocument = (id: string) => {
    router.push(`/document-viewer/${id}`);
  };

  const handleAddCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) return;
    try {
      await addCategory(name);
      setCategories((prev) => [...prev, { id: name, name, createdAt: Date.now() }]);
      setNewCategoryName('');
      setShowNewCategory(false);
      toast.success('分类已添加');
    } catch {
      toast.error('添加分类失败');
    }
  };

  const handleDeleteCategory = async (name: string) => {
    try {
      await removeCategory(name);
      setCategories((prev) => prev.filter((c) => c.id !== name));
      toast.success('分类已删除');
    } catch {
      toast.error('删除分类失败');
    }
  };

  const handleDeleteHistory = async (id: string) => {
    try {
      await deleteAccessHistory(id);
      setHistoryRecords((prev) => prev.filter((h) => h.id !== id));
      toast.success('记录已删除');
    } catch {
      toast.error('删除失败');
    }
  };

  const handleOpenHistory = (url: string) => {
    router.push(url);
  };

  function formatHistoryDate(timestamp: number): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return '今天';
    if (days === 1) return '昨天';
    if (days < 7) return `${days}天前`;
    if (days < 30) return `${Math.floor(days / 7)}周前`;
    return `${date.getMonth() + 1}/${date.getDate()}`;
  }

  // Filter logic
  const filteredClassrooms = classrooms.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );
  const filteredDocuments = documents.filter((d) =>
    d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.category.toLowerCase().includes(searchQuery.toLowerCase()),
  );
  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );
  const filteredHistory = historyRecords.filter((h) =>
    h.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (h.subtitle && h.subtitle.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  const hasAnyContent =
    filteredClassrooms.length > 0 ||
    filteredDocuments.length > 0 ||
    categories.length > 0 ||
    filteredHistory.length > 0;

  return (
    <>
      <Sidebar />
      <div className="ml-52 min-h-screen bg-gradient-to-br from-slate-50 to-sky-50 p-6 dark:from-slate-950 dark:to-slate-900">
        <div className="mx-auto max-w-7xl">

          {/* Header */}
          <div className="mb-6">
            <h1 className="flex items-center gap-3 text-3xl font-bold text-slate-900 dark:text-slate-50">
              <svg className="size-8 text-sky-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
              书架
            </h1>
            <p className="mt-1.5 text-slate-600 dark:text-slate-300">
              管理你的学习资料和课程
            </p>
          </div>

          {/* Search + Actions */}
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索书架内容..."
                className="w-full rounded-xl border border-slate-200/60 bg-white/70 pl-10 pr-4 py-2.5 text-sm outline-none transition-all focus:border-sky-300 focus:ring-2 focus:ring-sky-100 dark:border-slate-700/60 dark:bg-slate-900/70 dark:placeholder:text-slate-500 dark:focus:border-sky-600"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowUpload(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-sky-600 hover:shadow-md"
            >
              <Plus className="size-4" />
              添加资料
            </button>
            <button
              type="button"
              onClick={() => setShowNewCategory(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 shadow-sm transition-all hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
            >
              <FolderPlus className="size-4" />
              新建分类
            </button>
          </div>

          {/* Tabs */}
          <BookshelfTabs activeTab={activeTab} onTabChange={setActiveTab} className="mb-6" />

          {/* New category input */}
          {showNewCategory && (
            <div className="mb-6 flex items-center gap-2 rounded-xl border border-sky-200 bg-sky-50/50 p-3 dark:border-sky-800 dark:bg-sky-950/30">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddCategory();
                  if (e.key === 'Escape') setShowNewCategory(false);
                }}
                placeholder="输入分类名称..."
                className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                autoFocus
              />
              <button
                type="button"
                onClick={handleAddCategory}
                className="rounded-lg bg-sky-500 px-3 py-2 text-sm font-medium text-white hover:bg-sky-600"
              >
                添加
              </button>
              <button
                type="button"
                onClick={() => setShowNewCategory(false)}
                className="size-8 rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-slate-700"
              >
                <X className="mx-auto size-4" />
              </button>
            </div>
          )}

          {/* Upload area */}
          {showUpload && (
            <div className="mb-6">
              <BookshelfUpload onUpload={handleUpload} categories={categories} />
            </div>
          )}

          {/* Empty state */}
          {!hasAnyContent && !isLoading ? (
            <BookshelfEmpty onUploadClick={() => setShowUpload(true)} />
          ) : (
            <>
              {/* Tab content */}
              {(activeTab === 'all' || activeTab === 'classroom') && classrooms.length > 0 && (
                <div className="mb-8">
                  <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-800 dark:text-slate-200">
                    <span className="size-2 rounded-full bg-sky-500" />
                    AI 课堂 ({filteredClassrooms.length})
                  </h2>
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredClassrooms.map((classroom) => (
                      <ClassroomCard
                        key={classroom.id}
                        id={classroom.id}
                        name={classroom.name}
                        sceneCount={classroom.sceneCount}
                        createdAt={classroom.createdAt}
                        updatedAt={classroom.updatedAt}
                        thumbnailUrl={thumbnails[classroom.id]}
                        onDelete={handleDeleteClassroom}
                        onRename={handleRenameClassroom}
                        onOpen={handleOpenClassroom}
                      />
                    ))}
                  </div>
                </div>
              )}

              {(activeTab === 'all' || activeTab === 'document') && documents.length > 0 && (
                <div className="mb-8">
                  <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-800 dark:text-slate-200">
                    <span className="size-2 rounded-full bg-emerald-500" />
                    上传文档 ({filteredDocuments.length})
                  </h2>
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {filteredDocuments.map((doc) => (
                      <DocumentCard
                        key={doc.id}
                        id={doc.id}
                        title={doc.title}
                        fileName={doc.fileName || ''}
                        fileType={doc.fileType || 'unknown'}
                        fileSize={doc.fileSize || 0}
                        uploadedAt={doc.createdAt}
                        category={doc.category}
                        onDelete={handleDeleteDocument}
                        onOpen={handleOpenDocument}
                      />
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'category' && (
                <div className="mb-8">
                  <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-800 dark:text-slate-200">
                    <span className="size-2 rounded-full bg-purple-500" />
                    分类管理 ({categories.length})
                  </h2>
                  {filteredCategories.length === 0 ? (
                    <p className="py-8 text-center text-sm text-slate-400 dark:text-slate-500">
                      暂无分类，点击右上角"新建分类"添加
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {filteredCategories.map((cat) => {
                        const count = documents.filter((d) => d.category === cat.name).length;
                        return (
                          <CategoryCard
                            key={cat.id}
                            name={cat.name}
                            color={cat.color || '#0ea5e9'}
                            count={count}
                            onDelete={handleDeleteCategory}
                            onOpen={() => setActiveTab('document')}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {(activeTab === 'all' || activeTab === 'history') && filteredHistory.length > 0 && (
                <div className="mb-8">
                  <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-800 dark:text-slate-200">
                    <span className="size-2 rounded-full bg-amber-500" />
                    历史记录 ({filteredHistory.length})
                  </h2>
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {filteredHistory.map((record) => (
                      <div
                        key={record.id}
                        className="group relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white/80 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-700/60 dark:bg-slate-900/80"
                      >
                        <div className="relative aspect-[16/10] flex items-center justify-center bg-gradient-to-br from-slate-100 to-amber-50 dark:from-slate-800 dark:to-slate-700">
                          <div className="text-center">
                            <Clock className="mx-auto size-10 text-slate-300 dark:text-slate-600" />
                            <p className="mt-2 text-xs font-medium uppercase text-slate-400 dark:text-slate-500">
                              {record.type === 'classroom' && 'AI 课堂'}
                              {record.type === 'knowledge' && '知识库'}
                              {record.type === 'document' && '文档'}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteHistory(record.id)}
                            className="absolute right-3 top-3 size-7 rounded-full border border-white/60 bg-white/80 text-slate-500 opacity-0 backdrop-blur-sm transition-all hover:bg-rose-50 hover:text-rose-500 group-hover:opacity-100 dark:border-slate-700/60 dark:bg-slate-900/80 dark:hover:bg-rose-950/50 dark:hover:text-rose-400"
                          >
                            <Trash2 className="mx-auto size-3" />
                          </button>
                        </div>
                        <div className="px-4 py-3.5">
                          <h3 className="truncate text-sm font-medium text-slate-900 dark:text-white">
                            {record.title}
                          </h3>
                          {record.subtitle && (
                            <p className="mt-0.5 truncate text-xs text-slate-400 dark:text-slate-500">
                              {record.subtitle}
                            </p>
                          )}
                          <div className="mt-2 flex items-center justify-between">
                            <span className="text-[10px] text-slate-400 dark:text-slate-500">
                              访问 {record.accessCount || 1} 次 · {formatHistoryDate(record.updatedAt)}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleOpenHistory(record.url)}
                              className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 transition-colors hover:text-sky-600 dark:text-slate-300 dark:hover:text-sky-400"
                            >
                              打开
                              <ArrowRight className="size-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
