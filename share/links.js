export const squadShareOrigin = 'https://squadplayers.com';
export const squadDownloadUrl = squadShareOrigin + '/download';
export const shareLanguage = (value) => value === 'en' || value === 'uz' ? value : 'ru';
export const validShareMatchId = (value) => /^[1-9]\d{0,18}$/.test(value) && BigInt(value) <= BigInt('9223372036854775807');
const validCode = (value) => /^[A-Z0-9]{6,16}$/.test(value);
const validCapability = (value) => /^[a-f0-9]{64}$/.test(value);
export function publicMatchShareUrl(id, capability, language = 'ru') {
    if (!validShareMatchId(id))
        throw new Error('Invalid match reference');
    if (capability !== undefined && !validCapability(capability))
        throw new Error('Invalid invitation');
    const url = new URL('/share/match/' + id, squadShareOrigin);
    if (capability)
        url.searchParams.set('capability', capability);
    url.searchParams.set('lang', shareLanguage(language));
    return url.toString();
}
export function publicReferralShareUrl(code, language = 'ru') {
    if (!validCode(code))
        throw new Error('Invalid invitation code');
    const url = new URL('/share/invite', squadShareOrigin);
    url.searchParams.set('code', code);
    url.searchParams.set('lang', shareLanguage(language));
    return url.toString();
}
/** Only canonical player links are accepted. Query parameters never select an
 * arbitrary destination, backend, or owner. No URL is logged or persisted. */
export function parsePlayerShareUrl(value) {
    try {
        if (value.length > 2048)
            return null;
        const url = new URL(value, squadShareOrigin);
        if (url.origin !== squadShareOrigin || url.username || url.password || url.hash)
            return null;
        const keys = [...url.searchParams.keys()];
        if (new Set(keys).size !== keys.length)
            return null;
        const language = shareLanguage(url.searchParams.get('lang'));
        const match = /^\/share\/match\/([1-9]\d{0,18})\/?$/.exec(url.pathname);
        if (match && validShareMatchId(match[1]) && keys.every(key => ['lang', 'capability'].includes(key))) {
            const capability = url.searchParams.get('capability');
            if (capability !== null && !validCapability(capability))
                return null;
            return { kind: 'match', id: match[1], language, ...(capability ? { capability } : {}) };
        }
        const code = url.searchParams.get('code');
        if (/^\/share\/invite\/?$/.test(url.pathname) && code && validCode(code) && keys.every(key => ['lang', 'code'].includes(key))) {
            return { kind: 'referral', code, language };
        }
    }
    catch { /* Malformed links have no destination. */ }
    return null;
}
export function playerShareAppPath(target) {
    return target.kind === 'referral' ? '/invite?code=' + encodeURIComponent(target.code)
        : target.capability ? '/match-invite?capability=' + encodeURIComponent(target.capability) : '/match/' + target.id;
}
export const playerShareDeepLink = (target) => 'squadapp://' + playerShareAppPath(target);
