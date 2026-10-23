import { parsePlayerShareUrl, playerShareDeepLink, publicMatchShareUrl, publicReferralShareUrl, shareLanguage } from './links.js';
import { decodePublicMatchCard, presentPublicMatchCard, publicShareCopy, shareDownloadLinks } from './presentation.js';
import { apiOrigin, storesVerified } from './config.js';

export function landingTarget(url) {
  if (url.pathname === '/share/' && url.hash) {
    try { return parsePlayerShareUrl(decodeURIComponent(url.hash.slice(1))); } catch { return null; }
  }
  return parsePlayerShareUrl('https://squadplayers.com' + url.pathname + url.search + url.hash);
}

export async function mountSharePage({ document, location, fetch: fetcher, timeoutMs = 8000 }) {
  const current = new URL(location.href), target = landingTarget(current);
  const language = target?.language ?? shareLanguage(current.searchParams.get('lang'));
  const c = publicShareCopy[language], root = document.getElementById('share-root');
  const download = /^\/download\/?$/.test(current.pathname);
  if (!root) return;
  const node = (tag, text, className) => {
    const value = document.createElement(tag);
    if (text !== undefined) value.textContent = text;
    if (className) value.className = className;
    return value;
  };
  const link = (text, href, className) => {
    const value = node('a', text, className); value.href = href; value.rel = 'noreferrer'; return value;
  };
  document.documentElement.lang = language;
  root.lang = language;
  const languages = node('nav', undefined, 'share-languages'); languages.setAttribute('aria-label', 'Language');
  for (const lang of ['ru', 'uz', 'en']) {
    const href = target?.kind === 'match' ? publicMatchShareUrl(target.id, target.capability, lang)
      : target?.kind === 'referral' ? publicReferralShareUrl(target.code, lang) : '/download/?lang=' + lang;
    const value = link(lang.toUpperCase(), href);
    if (lang === language) value.setAttribute('aria-current', 'page'); languages.append(value);
  }
  const brand = link('SQUAD', 'https://squadplayers.com', 'share-brand'); brand.setAttribute('aria-label', c.home); brand.append(node('span', '●'));
  const status = node('section'); status.setAttribute('aria-live', 'polite');
  root.replaceChildren(languages, brand, node('h1', c.title), node('p', c.intro, 'share-muted'), status);
  if (target) root.append(link(c.open, playerShareDeepLink(target), 'share-action'));
  const downloads = node('section', undefined, 'share-download'), links = shareDownloadLinks(storesVerified);
  const storeLinks = node('div', undefined, 'share-store-links');
  storeLinks.append(link(storesVerified ? 'App Store' : c.iosTesting, links.ios), link(storesVerified ? 'Google Play' : c.androidTesting, links.android));
  downloads.append(node('h2', c.download), node('p', storesVerified ? c.stores : c.testing, 'share-muted'), storeLinks); root.append(downloads);
  if (!target) { if (!download) status.append(node('p', c.badLink, 'share-notice')); return; }
  if (target.kind === 'referral') {
    const note = node('p', c.invite + ': ', 'share-notice'); note.append(node('strong', target.code)); status.append(note); return;
  }
  if (target.capability) { status.append(node('p', c.private, 'share-notice')); return; }
  const load = async () => {
    status.replaceChildren(node('p', c.loading, 'share-notice'));
    const controller = new AbortController(); let timer;
    try {
      const deadline = new Promise((_, reject) => { timer = setTimeout(() => { controller.abort(); reject(new Error('timeout')); }, timeoutMs); });
      const request = async () => {
        const response = await fetcher(apiOrigin + '/api/public/match-shares/' + target.id, { credentials: 'omit', cache: 'no-store', referrerPolicy: 'no-referrer', signal: controller.signal });
        if (response.status === 404) return null;
        if (!response.ok || Number(response.headers?.get('content-length') ?? 0) > 16384) throw new Error('unavailable');
        const body = await response.text(); if (body.length > 16384) throw new Error('unavailable');
        const value = decodePublicMatchCard(JSON.parse(body)?.data, target.id); if (!value) throw new Error('unavailable'); return value;
      };
      const card = await Promise.race([request(), deadline]);
      if (!card) { status.replaceChildren(node('p', c.unavailable, 'share-notice')); return; }
      const details = presentPublicMatchCard(card, language), content = node('section', undefined, 'share-match'); content.setAttribute('aria-label', c.details);
      const date = node('p', details.day, 'share-date'); date.append(node('br'), document.createTextNode(details.time));
      const facts = node('dl', undefined, 'share-facts');
      for (const [label, value] of [[c.places, card.availableSeats + ' / ' + card.seats], [c.price, details.price]]) {
        const field = node('div'); field.append(node('dt', label), node('dd', value)); facts.append(field);
      }
      content.append(node('span', details.sport, 'share-sport'), node('h2', card.venue.name), node('p', card.courtName), date,
        node('p', card.venue.address, 'share-muted'), facts, node('p', c.current, 'share-muted share-small'));
      status.replaceChildren(content);
    } catch {
      const retry = node('button', c.retry, 'share-retry'); retry.type = 'button'; retry.addEventListener('click', () => void load());
      status.replaceChildren(node('p', c.failed, 'share-notice'), retry);
    } finally { clearTimeout(timer); }
  };
  await load();
}
if (typeof window !== 'undefined') void mountSharePage({ document: window.document, location: window.location, fetch: window.fetch.bind(window) });
