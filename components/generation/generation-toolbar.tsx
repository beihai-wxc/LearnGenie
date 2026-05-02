'use client';

import { MediaPopover } from '@/components/generation/media-popover';
import type { SettingsSection } from '@/lib/types/settings';

interface GenerationToolbarProps {
  onSettingsOpen: (section?: SettingsSection) => void;
}

export function GenerationToolbar({ onSettingsOpen }: GenerationToolbarProps) {
  return (
    <div className="flex items-center gap-1 flex-wrap">
      <MediaPopover onSettingsOpen={onSettingsOpen} />
    </div>
  );
}
