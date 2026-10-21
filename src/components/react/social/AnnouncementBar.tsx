import { useEffect, useState } from 'react';
import { publicSettingsEnvelopeSchema } from '@/lib/schemas/public.schema';
import '@/styles/announcement.css';

interface Announcement {
  text: string;
  enabled: boolean;
}

export default function AnnouncementBar() {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);

  useEffect(() => {
    let active = true;
    async function refresh() {
      try {
        const response = await fetch('/api/settings', { cache: 'no-store' });
        if (!response.ok) return;
        const payload: unknown = await response.json();
        const parsed = publicSettingsEnvelopeSchema.safeParse(payload);
        if (active && parsed.success) setAnnouncement(parsed.data.data.announcementBar ?? null);
      } catch {
        // Keep the last valid public settings while the API is temporarily unavailable.
      }
    }
    void refresh();
    const interval = window.setInterval(() => void refresh(), 30_000);
    window.addEventListener('focus', refresh);
    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener('focus', refresh);
    };
  }, []);

  if (!announcement?.enabled || !announcement.text.trim()) return null;
  return <aside className="site-announcement" aria-label="Store announcement">{announcement.text}</aside>;
}
