import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

export function getRelativeTime(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const secondsDiff = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (secondsDiff < 60) return `${secondsDiff} seconds ago`;
  if (secondsDiff < 3600) return `${Math.floor(secondsDiff / 60)} minutes ago`;
  if (secondsDiff < 86400) return `${Math.floor(secondsDiff / 3600)} hours ago`;
  if (secondsDiff < 604800) return `${Math.floor(secondsDiff / 86400)} days ago`;
  if (secondsDiff < 2629746) return `${Math.floor(secondsDiff / 604800)} weeks ago`;
  if (secondsDiff < 31556952) return `${Math.floor(secondsDiff / 2629746)} months ago`;
  return `${Math.floor(secondsDiff / 31556952)} years ago`;
}

export function formatNumberWithSuffix(num: number): string {
  if (num < 1000) return num.toString();
  if (num < 1000000) return `${(num / 1000).toFixed(1)}K`;
  return `${(num / 1000000).toFixed(1)}M`;
}

export function calculateReadTime(content: string): number {
  const wordsPerMinute = 200;
  const wordCount = content.trim().split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
}

export function generateShareLinks(article: { title: string, slug: string }): Record<string, string> {
  const url = encodeURIComponent(`${window.location.origin}/article/${article.slug}`);
  const title = encodeURIComponent(article.title);
  
  return {
    twitter: `https://twitter.com/intent/tweet?text=${title}&url=${url}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
    linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${url}&title=${title}`,
    pinterest: `https://pinterest.com/pin/create/button/?url=${url}&description=${title}`,
    email: `mailto:?subject=${title}&body=${url}`
  };
}

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}
