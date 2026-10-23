import { parsePlayerShareUrl } from './links.js';

export function shareFallbackDestination(rawUrl) {
  const target = parsePlayerShareUrl(rawUrl);
  if (target) {
    const url = new URL(rawUrl);
    // Keep private capabilities in the fragment on the fallback page. They are
    // never sent to the anonymous match API or any third-party resource.
    return '/share/#' + encodeURIComponent(url.pathname + url.search);
  }
  try {
    const url = new URL(rawUrl);
    if (url.origin === 'https://squadplayers.com' && url.pathname === '/download' &&
      [...url.searchParams.keys()].every(key => key === 'lang') && url.searchParams.getAll('lang').length <= 1 && !url.hash) {
      return '/download/' + url.search;
    }
  } catch { /* Keep the original 404 for every unrelated or invalid route. */ }
  return null;
}
if (typeof window !== 'undefined') {
  const destination = shareFallbackDestination(window.location.href);
  if (destination && destination !== window.location.pathname + window.location.search) window.location.replace(destination);
}
