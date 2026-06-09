'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useAuthStore } from '@/lib/store/auth';
import { AVATAR_OPTIONS } from '@/lib/store/user-profile';
import { cn } from '@/lib/utils';
import { X, Settings, UserCircle, LogOut, Upload, KeyRound } from 'lucide-react';
import { toast } from 'sonner';
import { useI18n } from '@/lib/hooks/use-i18n';
import { GeneralSettings } from './general-settings';
import { hasSavedCredentials, clearCredentials } from '@/lib/utils/credential-storage';

type NavKey = 'account' | 'system';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { t } = useI18n();
  const router = useRouter();
  const [activeNav, setActiveNav] = useState<NavKey>('account');
  const user = useAuthStore((s) => s.user);
  const updateAvatar = useAuthStore((s) => s.updateAvatar);
  const logout = useAuthStore((s) => s.logout);
  const [selectedAvatar, setSelectedAvatar] = useState(user?.avatar || AVATAR_OPTIONS[0]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarSelect = async (avatar: string) => {
    setSelectedAvatar(avatar);
    await updateAvatar(avatar);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => handleAvatarSelect(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleLogout = () => {
    logout();
    onOpenChange(false);
    router.push('/');
  };

  const handleClearSavedCredentials = () => {
    clearCredentials();
    toast.success('已清除保存的登录信息');
  };

  const navItems: { key: NavKey; icon: React.ReactNode; label: string }[] = [
    { key: 'account', icon: <UserCircle className="size-4" />, label: '账户' },
    { key: 'system', icon: <Settings className="size-4" />, label: t('settings.systemSettings') },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-[85vh] max-w-3xl p-0 gap-0 block" showCloseButton={false}>
        <DialogTitle className="sr-only">{t('settings.title')}</DialogTitle>
        <DialogDescription className="sr-only">{t('settings.description')}</DialogDescription>
        <div className="flex h-full overflow-hidden">
          {/* Left Sidebar */}
          <div className="flex-shrink-0 bg-muted/30 p-3 flex flex-col" style={{ width: 192 }}>
            {navItems.map((item) => (
              <button
                key={item.key}
                onClick={() => setActiveNav(item.key)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors text-left mb-1',
                  activeNav === item.key
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-muted-foreground hover:bg-muted',
                )}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          {/* Right Content */}
          <div className="flex-1 flex flex-col overflow-hidden min-w-0">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-semibold">
                {navItems.find((n) => n.key === activeNav)?.label}
              </h2>
              <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
                <X className="size-4" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {activeNav === 'account' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-6">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="group relative shrink-0"
                    >
                      <Avatar className="size-20 ring-2 ring-border transition-all group-hover:ring-primary">
                        <AvatarImage src={selectedAvatar} alt={user?.nickname || ''} />
                        <AvatarFallback>{(user?.nickname || 'U')[0]}</AvatarFallback>
                      </Avatar>
                      <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 text-white text-xs opacity-0 transition-opacity group-hover:opacity-100">
                        更换
                      </span>
                    </button>
                    <div>
                      <p className="text-lg font-semibold">{user?.nickname || '未设置'}</p>
                      <p className="text-sm text-muted-foreground">{user?.email || ''}</p>
                    </div>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <div>
                    <p className="mb-3 text-sm font-medium text-muted-foreground">预设头像</p>
                    <div className="flex flex-wrap gap-3">
                      {AVATAR_OPTIONS.map((avatar) => (
                        <button
                          key={avatar}
                          onClick={() => handleAvatarSelect(avatar)}
                          className={cn(
                            'rounded-xl p-1 transition-all',
                            selectedAvatar === avatar
                              ? 'ring-2 ring-primary ring-offset-2'
                              : 'hover:ring-2 hover:ring-muted-foreground/20',
                          )}
                        >
                          <Avatar className="size-14">
                            <AvatarImage src={avatar} alt="" />
                            <AvatarFallback>?</AvatarFallback>
                          </Avatar>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Upload className="size-4" />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="underline hover:text-foreground"
                    >
                      上传自定义头像
                    </button>
                  </div>

                  <div className="mt-8 pt-6 border-t space-y-3">
                    {hasSavedCredentials() && (
                      <Button
                        variant="outline"
                        className="text-muted-foreground hover:text-amber-600 w-full justify-start"
                        onClick={handleClearSavedCredentials}
                      >
                        <KeyRound className="size-4 mr-2" />
                        清除保存的登录信息
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      className="text-muted-foreground hover:text-destructive w-full justify-start"
                      onClick={handleLogout}
                    >
                      <LogOut className="size-4 mr-2" />
                      退出登录
                    </Button>
                  </div>
                </div>
              )}

              {activeNav === 'system' && <GeneralSettings />}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
