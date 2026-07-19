'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, FolderPlus, FolderOpen, X, ArrowLeft, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useI18n } from '@/lib/hooks/use-i18n';
import { BookshelfTabs } from '@/components/bookshelf/bookshelf-tabs';
import { ClassroomCard } from '@/components/bookshelf/bookshelf-card';
import {
  listStages,
  getFirstSlideByStages,
  deleteStageData,
  renameStage,
  type StageListItem,
} from '@/lib/utils/stage-storage';
import {
  getFavorites,
  addFavorite,
  removeFavorite,
  ensureDefaultGroup,
  addGroup,
  deleteGroup,
  getGroups,
  type FavoriteItem,
} from '@/lib/store/bookshelf-favorites';
import { generateSlideThumbnail } from '@/lib/utils/slide-thumbnail';

export default function BookshelfContent() {
  const { t } = useI18n();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [classrooms, setClassrooms] = useState<StageListItem[]>([]);
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [favoritedIds, setFavoritedIds] = useState<Set<string>>(new Set());
  const [groups, setGroups] = useState<string[]>([]);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      await ensureDefaultGroup();
      const [stages, favs, grps] = await Promise.all([
        listStages(),
        getFavorites(),
        getGroups(),
      ]);

      setClassrooms(stages);
      setFavorites(favs);
      setGroups(grps);
      setFavoritedIds(new Set(favs.map((f) => f.stageId)));

      if (stages.length > 0) {
        const slides = await getFirstSlideByStages(stages.map((s) => s.id));
        const urls: Record<string, string> = {};
        for (const [stageId, slide] of Object.entries(slides)) {
          try {
            const dataUrl = generateSlideThumbnail(slide);
            if (dataUrl) urls[stageId] = dataUrl;
          } catch { /* skip */ }
        }
        setThumbnails(urls);
      }
    } catch {
      toast.error('加载数据失败');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const BOOKSHELF_SCROLL_KEY = 'bookshelf-scroll';

  const handleOpenClassroom = (id: string) => {
    try { sessionStorage.setItem(BOOKSHELF_SCROLL_KEY, String(window.scrollY)); } catch { /* noop */ }
    router.push(`/classroom/${id}`);
  };

  useEffect(() => {
    if (isLoading) return;
    try {
      const raw = sessionStorage.getItem(BOOKSHELF_SCROLL_KEY);
      if (!raw) return;
      sessionStorage.removeItem(BOOKSHELF_SCROLL_KEY);
      const savedY = parseInt(raw, 10);
      if (!savedY) return;
      let attempts = 0;
      const tryRestore = () => {
        const maxY = document.documentElement.scrollHeight - window.innerHeight;
        if (maxY >= savedY || attempts >= 8) {
          window.scrollTo(0, Math.min(savedY, Math.max(0, maxY)));
        } else {
          attempts++;
          requestAnimationFrame(tryRestore);
        }
      };
      requestAnimationFrame(tryRestore);
    } catch { /* noop */ }
  }, [isLoading]);

  const handleDeleteClassroom = async (id: string) => {
    try {
      await deleteStageData(id);
      setClassrooms((prev) => prev.filter((c) => c.id !== id));
      // Also remove the favorite record so group count updates
      await removeFavorite(id);
      const favs = await getFavorites();
      setFavorites(favs);
      setFavoritedIds(new Set(favs.map((f) => f.stageId)));
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

  const handleFavorite = async (id: string, group?: string) => {
    const classroom = classrooms.find((c) => c.id === id);
    if (!classroom) return;
    try {
      await addFavorite(id, classroom.name, group);
      const favs = await getFavorites();
      setFavorites(favs);
      setFavoritedIds(new Set(favs.map((f) => f.stageId)));
      toast.success('已收藏');
    } catch {
      toast.error('收藏失败');
    }
  };

  const handleUnfavorite = async (id: string) => {
    try {
      await removeFavorite(id);
      const favs = await getFavorites();
      setFavorites(favs);
      setFavoritedIds(new Set(favs.map((f) => f.stageId)));
      toast.success('已取消收藏');
    } catch {
      toast.error('取消收藏失败');
    }
  };

  const handleAddGroup = async (name: string) => {
    try {
      await addGroup(name);
      setGroups(await getGroups());
      toast.success('分组已添加');
    } catch {
      toast.error('添加分组失败');
    }
  };

  const handleCreateGroup = async () => {
    const name = newGroupName.trim();
    if (!name) return;
    await handleAddGroup(name);
    setNewGroupName('');
    setShowNewGroup(false);
  };

  const [deletingGroup, setDeletingGroup] = useState<string | null>(null);

  const handleDeleteGroup = async (name: string) => {
    try {
      await deleteGroup(name);
      setGroups(await getGroups());
      const favs = await getFavorites();
      setFavorites(favs);
      setFavoritedIds(new Set(favs.map((f) => f.stageId)));
      if (selectedGroup === name) setSelectedGroup(null);
      toast.success('分组已删除');
    } catch {
      toast.error('删除分组失败');
    }
    setDeletingGroup(null);
  };

  const getFavoriteInfo = (stageId: string) => {
    return favorites.find((f) => f.stageId === stageId);
  };

  const filteredClassrooms = classrooms.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const hasAnyContent = filteredClassrooms.length > 0;

  const getGroupCount = (group: string) => {
    return favorites.filter((f) => f.group === group).length;
  };

  const groupFavStageIds = selectedGroup
    ? new Set(favorites.filter((f) => f.group === selectedGroup).map((f) => f.stageId))
    : null;

  return (
    <>
      {/* Header */}
      <div className="mb-6">
        <h1 className="flex items-center gap-3 text-3xl font-bold text-slate-900 dark:text-slate-50">
          <svg className="size-8 text-sky-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
          历史课堂
        </h1>
        <p className="mt-1.5 text-slate-600 dark:text-slate-300">
          管理你的学习课堂
        </p>
      </div>

      {/* Search */}
      <div className="mb-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索课堂..."
            className="w-full rounded-xl border border-slate-200/60 bg-white/70 pl-10 pr-4 py-2.5 text-sm outline-none transition-all focus:border-sky-300 focus:ring-2 focus:ring-sky-100 dark:border-slate-700/60 dark:bg-slate-900/70 dark:placeholder:text-slate-500 dark:focus:border-sky-600"
          />
        </div>
      </div>

      {/* Tabs */}
      <BookshelfTabs activeTab={activeTab} onTabChange={setActiveTab} className="mb-6" />

      {/* Content */}
      {!hasAnyContent && !isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <svg className="mb-4 size-16 text-slate-300 dark:text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
          <h3 className="text-lg font-medium text-slate-500 dark:text-slate-400">暂无课堂</h3>
          <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">
            生成课堂后会自动出现在这里
          </p>
        </div>
      ) : (
        <>
          {(activeTab === 'all' || activeTab === 'classroom') && classrooms.length > 0 && (
            <div className="mb-8">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-800 dark:text-slate-200">
                <span className="size-2 rounded-full bg-sky-500" />
                AI 课堂 ({filteredClassrooms.length})
              </h2>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {filteredClassrooms.map((classroom) => {
                  const favInfo = getFavoriteInfo(classroom.id);
                  return (
                    <ClassroomCard
                      key={classroom.id}
                      id={classroom.id}
                      name={classroom.name}
                      sceneCount={classroom.sceneCount}
                      createdAt={classroom.createdAt}
                      updatedAt={classroom.updatedAt}
                      thumbnailUrl={thumbnails[classroom.id]}
                      isFavorited={favoritedIds.has(classroom.id)}
                      favoriteGroup={favInfo?.group}
                      groups={groups}
                      onDelete={handleDeleteClassroom}
                      onRename={handleRenameClassroom}
                      onOpen={handleOpenClassroom}
                      onFavorite={handleFavorite}
                      onUnfavorite={handleUnfavorite}
                      onAddGroup={handleAddGroup}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'category' && (
            <div className="mb-8">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800 dark:text-slate-200">
                  <span className="size-2 rounded-full bg-blue-500" />
                  分组管理 ({groups.length})
                </h2>
                {!showNewGroup ? (
                  <button
                    type="button"
                    onClick={() => setShowNewGroup(true)}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition-all hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                  >
                    <FolderPlus className="size-4" />
                    新建分组
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCreateGroup();
                        if (e.key === 'Escape') { setShowNewGroup(false); setNewGroupName(''); }
                      }}
                      placeholder="输入分组名称"
                      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-blue-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={handleCreateGroup}
                      className="rounded-lg bg-blue-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-600"
                    >
                      添加
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowNewGroup(false); setNewGroupName(''); }}
                      className="size-7 rounded-lg text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                    >
                      <X className="mx-auto size-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {selectedGroup ? (
                <>
                  <button
                    onClick={() => setSelectedGroup(null)}
                    className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 transition-colors hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                  >
                    <ArrowLeft className="size-3" /> 全部分组
                  </button>
                  <h3 className="mb-3 text-lg font-medium text-slate-800 dark:text-slate-200">
                    {selectedGroup} ({getGroupCount(selectedGroup)})
                  </h3>
                  {filteredClassrooms
                    .filter((c) => groupFavStageIds?.has(c.id))
                    .length === 0 ? (
                    <p className="py-8 text-center text-sm text-slate-400">此分组暂无收藏课堂</p>
                  ) : (
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                      {filteredClassrooms
                        .filter((c) => groupFavStageIds?.has(c.id))
                        .map((classroom) => {
                          const favInfo = getFavoriteInfo(classroom.id);
                          return (
                            <ClassroomCard
                              key={classroom.id}
                              id={classroom.id}
                              name={classroom.name}
                              sceneCount={classroom.sceneCount}
                              createdAt={classroom.createdAt}
                              updatedAt={classroom.updatedAt}
                              thumbnailUrl={thumbnails[classroom.id]}
                              isFavorited={true}
                              favoriteGroup={favInfo?.group}
                              groups={groups}
                              onDelete={handleDeleteClassroom}
                              onRename={handleRenameClassroom}
                              onOpen={handleOpenClassroom}
                              onFavorite={handleFavorite}
                              onUnfavorite={handleUnfavorite}
                              onAddGroup={handleAddGroup}
                            />
                          );
                        })}
                    </div>
                  )}
                </>
              ) : (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {groups.map((group) => (
                    <div
                      key={group}
                      className="group relative rounded-2xl border border-slate-200/60 bg-white/80 p-6 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-700/60 dark:bg-slate-900/80"
                    >
                      <button
                        onClick={() => setSelectedGroup(group)}
                        className="w-full text-left"
                      >
                        <div className="mb-3 inline-flex size-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400">
                          <FolderOpen className="size-6" />
                        </div>
                        <h3 className="text-base font-medium text-slate-900 dark:text-white">
                          {group}
                        </h3>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                          {getGroupCount(group)} 个课堂
                        </p>
                      </button>

                      {/* Delete button - visible on hover */}
                      <div className="absolute right-3 top-3 opacity-0 transition-opacity group-hover:opacity-100">
                        {deletingGroup === group ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteGroup(group);
                              }}
                              className="rounded-full bg-rose-500 px-2 py-1 text-xs font-medium text-white hover:bg-rose-400"
                            >
                              确认
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeletingGroup(null);
                              }}
                              className="rounded-full border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                            >
                              取消
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletingGroup(group);
                            }}
                            className="size-7 rounded-full bg-white/80 text-slate-400 shadow-sm backdrop-blur-sm hover:bg-rose-50 hover:text-rose-500 dark:bg-slate-800/80 dark:hover:bg-rose-500/10"
                            title="删除分组"
                          >
                            <Trash2 className="mx-auto size-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </>
  );
}
