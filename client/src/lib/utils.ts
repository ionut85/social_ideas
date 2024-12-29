import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface ShareConfig {
  text: string;
  url?: string;
  title?: string;
  tags?: string[];
}

export function getShareUrl(platform: string, config: ShareConfig): string {
  const text = encodeURIComponent(config.text);
  const url = config.url ? encodeURIComponent(config.url) : '';
  const title = config.title ? encodeURIComponent(config.title) : '';
  const hashtags = config.tags ? config.tags.join(',') : '';

  switch (platform) {
    case 'twitter':
      return `https://twitter.com/intent/tweet?text=${text}${url ? `&url=${url}` : ''}${hashtags ? `&hashtags=${hashtags}` : ''}`;
    case 'reddit':
      return `https://reddit.com/submit?title=${title || text}&url=${url}`;
    case 'linkedin':
      return `https://www.linkedin.com/sharing/share-offsite/?url=${url}&title=${title || text}`;
    case 'instagram':
      // Instagram doesn't support direct sharing via URL, return empty
      return '';
    default:
      return '';
  }
}

export function openShareWindow(url: string): void {
  if (!url) return;
  window.open(url, '_blank', 'width=550,height=450');
}