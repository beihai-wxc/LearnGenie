'use client';

import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Settings } from 'lucide-react';
import { useI18n } from '@/lib/hooks/use-i18n';
import { GeneralSettings } from './general-settings';
import type { SettingsSection } from '@/lib/types/settings';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialSection?: SettingsSection;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { t } = useI18n();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-[85vh] p-0 gap-0 block" showCloseButton={false}>
        <DialogTitle className="sr-only">{t('settings.title')}</DialogTitle>
        <DialogDescription className="sr-only">{t('settings.description')}</DialogDescription>
        <div className="flex h-full overflow-hidden">
          {/* Left Sidebar - Navigation */}
          <div className="flex-shrink-0 bg-muted/30 p-3" style={{ width: 192 }}>
            <button
              className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors text-left min-w-0 bg-primary/10 text-primary font-medium"
            >
              <Settings className="h-4 w-4 shrink-0" />
              <span className="truncate">{t('settings.systemSettings')}</span>
            </button>
          </div>

          {/* Right - General Settings Panel */}
          <div className="flex-1 flex flex-col overflow-hidden min-w-0">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold">{t('settings.systemSettings')}</h2>
              </div>
              <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5">
              <GeneralSettings />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-5 py-3 border-t bg-muted/30">
              <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                {t('settings.close')}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
