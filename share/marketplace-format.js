export function uzsCurrency(language) {
    return language === 'ru' ? 'сум' : language === 'uz' ? 'so‘m' : 'UZS';
}
export function formatUzsNumber(value, language) {
    return value.toLocaleString(language === 'en' ? 'en-US' : 'ru-RU').replace(/\u00a0|\u202f/g, ' ');
}
export function normalizeUzbekCopy(text) {
    return text.replace(/([og])['’]/gi, '$1‘').replace(/([a-z])'([a-z])/gi, '$1’$2')
        .replace(/\bBandlov/g, 'Bron').replace(/\bbandlov/g, 'bron')
        .replace(/\bBandlash/g, 'Bron qilish').replace(/\bbandlash/g, 'bron qilish')
        .replace(/\bBand qil/g, 'Bron qil').replace(/\bband qil/g, 'bron qil')
        .replace(/(?:SQUAD )?(?:[Ss]ervis yig‘imi|xizmat yig‘imi)/g, 'SQUAD xizmat haqi');
}
const months = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'];
const shortMonths = ['yan', 'fev', 'mar', 'apr', 'may', 'iyn', 'iyl', 'avg', 'sen', 'okt', 'noy', 'dek'];
const weekdays = ['yakshanba', 'dushanba', 'seshanba', 'chorshanba', 'payshanba', 'juma', 'shanba'];
const shortWeekdays = ['Ya', 'Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh'];
/** Stable Uzbek labels and day-month presentation across native ICU versions.
 * Intl still resolves the calendar, timezone and every requested clock field. */
export function createUzbekDateFormatter(options = {}) {
    const base = new Intl.DateTimeFormat('en-GB', options);
    const numeric = new Intl.DateTimeFormat('en-GB', { timeZone: base.resolvedOptions().timeZone, year: 'numeric', month: 'numeric', day: 'numeric' });
    const formatToParts = (value) => {
        const date = value ?? Date.now();
        const original = base.formatToParts(date);
        const fields = numeric.formatToParts(date);
        const field = (type) => Number(fields.find(part => part.type === type)?.value);
        const month = field('month') - 1;
        const weekday = new Date(Date.UTC(field('year'), month, field('day'))).getUTCDay();
        const monthStyle = options.month ?? (options.dateStyle === 'long' || options.dateStyle === 'full' ? 'long' : options.dateStyle === 'medium' ? 'short' : 'numeric');
        const weekdayStyle = options.weekday ?? 'long';
        const parts = original.map((part, index) => {
            if (part.type === 'month' && ['long', 'short', 'narrow'].includes(monthStyle))
                return { ...part,
                    value: monthStyle === 'long' ? months[month] : monthStyle === 'short' ? shortMonths[month] : shortMonths[month][0] };
            if (part.type === 'weekday')
                return { ...part, value: weekdayStyle === 'long' ? weekdays[weekday] : weekdayStyle === 'narrow' ? shortWeekdays[weekday][0] : shortWeekdays[weekday] };
            if (part.type === 'literal')
                return { ...part, value: original[index - 1]?.type === 'day' && original[index + 1]?.type === 'month' && ['long', 'short', 'narrow'].includes(monthStyle)
                        ? '-' : part.value.replace(/\s+at\s+/g, ', ') };
            return part;
        });
        const weekdayIndex = parts.findIndex(part => part.type === 'weekday');
        if (weekdayIndex >= 0 && parts.some(part => part.type === 'day')) {
            const weekdayPart = parts.splice(weekdayIndex, 1)[0];
            // The en-GB weekday precedes its date. Remove only its own separator,
            // then put the weekday after the date and before any preserved time.
            if (parts[weekdayIndex]?.type === 'literal')
                parts.splice(weekdayIndex, 1);
            let dateEnd = -1;
            parts.forEach((part, index) => { if (['day', 'month', 'year', 'era'].includes(part.type))
                dateEnd = index; });
            parts.splice(dateEnd + 1, 0, { type: 'literal', value: ', ' }, weekdayPart);
        }
        return parts;
    };
    return { formatToParts, format: (value) => formatToParts(value).map(part => part.value).join('') };
}
/** Translate known system reasons; preserve a club's own explanation verbatim. */
export function localizeCancellationReason(reason, language) {
    const key = reason.trim().replace(/\.$/, '').toLowerCase();
    const system = {
        'payment deadline expired': ['Payment deadline expired', 'Срок оплаты истёк', 'To‘lov muddati tugadi'],
        'not enough players': ['Not enough players', 'Недостаточно игроков', 'O‘yinchilar yetarli emas'],
        'match cancelled by organizer': ['Match cancelled by organizer', 'Матч отменён организатором', 'Uchrashuv tashkilotchi tomonidan bekor qilindi'],
        'court_maintenance': ['Court maintenance', 'Корт на ремонте', 'Kort ta’mirlanmoqda'],
        'корт на ремонте': ['Court maintenance', 'Корт на ремонте', 'Kort ta’mirlanmoqda'],
        'venue_closed': ['The club is closed', 'Клуб закрыт', 'Klub yopilgan'],
        'coach_unavailable': ['The coach is unavailable', 'Тренер недоступен', 'Murabbiy mavjud emas'],
        'not_enough_players': ['Not enough players', 'Недостаточно игроков', 'O‘yinchilar yetarli emas'],
        'organizer_unavailable': ['The organizer is unavailable', 'Организатор не сможет прийти', 'Tashkilotchi kela olmaydi'],
        'schedule_conflict': ['The time no longer works', 'Время больше не подходит', 'Bu vaqt endi mos kelmaydi'],
    };
    if (system[key])
        return system[key][language === 'ru' ? 1 : language === 'uz' ? 2 : 0];
    const actor = ['cancelled by player', 'cancelled by the player'].includes(key) ? 'player'
        : ['cancelled by club', 'cancelled by the club'].includes(key) ? 'club'
            : ['cancelled by organizer', 'cancelled by the organizer'].includes(key) ? 'organizer'
                : ['cancelled by coach', 'cancelled by the coach'].includes(key) ? 'coach' : null;
    if (!actor || language === 'en')
        return reason;
    const captions = { player: ['Отменено игроком', 'O‘yinchi bekor qildi'], club: ['Отменено клубом', 'Klub bekor qildi'], organizer: ['Отменено организатором', 'Tashkilotchi bekor qildi'], coach: ['Отменено тренером', 'Murabbiy bekor qildi'] };
    const text = captions[actor][language === 'ru' ? 0 : 1];
    return /\.\s*$/.test(reason) ? `${text}.` : text;
}
export const clubCancellationReasons = [
    { value: 'court_maintenance', label: 'Court maintenance' },
    { value: 'venue_closed', label: 'The club is closed' },
    { value: 'coach_unavailable', label: 'The coach is unavailable' },
    { value: 'not_enough_players', label: 'Not enough players' },
    { value: 'other', label: 'Other' },
];
export const organizerCancellationReasons = [
    { value: 'not_enough_players', label: 'Not enough players' },
    { value: 'organizer_unavailable', label: 'The organizer is unavailable' },
    { value: 'schedule_conflict', label: 'The time no longer works' },
    { value: 'other', label: 'Other' },
];
export function organizerCancellationReason(code, explanation = '') {
    if (!organizerCancellationReasons.some(reason => reason.value === code))
        throw new Error('Choose a cancellation reason.');
    if (code !== 'other')
        return code;
    return clubCancellationReason('other', explanation);
}
/** Known choices remain language independent; an authored explanation stays verbatim. */
export function clubCancellationReason(code, explanation = '') {
    if (!clubCancellationReasons.some(reason => reason.value === code))
        throw new Error('Choose a cancellation reason.');
    if (code !== 'other')
        return code;
    const text = explanation.trim().replace(/[\r\n\t]+/g, ' ');
    if (text.length < 8 || text.length > 500 || /[\u0000-\u001f\u007f]/.test(text))
        throw new Error('Explain the cancellation in 8 to 500 characters.');
    return text;
}
/** The actor comes from canonical cancellation state, never from display-name heuristics. */
export function cancellationCaption(actor, reason, language, viewerIsActor = false) {
    const captions = { club: ["Cancelled by the club", "Отменено клубом", "Klub bekor qildi"], player: ["Cancelled by player", "Отменено игроком", "O‘yinchi bekor qildi"], organizer: ["Cancelled by organizer", "Отменено организатором", "Tashkilotchi bekor qildi"], system: ["Automatically cancelled", "Отменено автоматически", "Avtomatik bekor qilindi"], coach: ["Cancelled by coach", "Отменено тренером", "Murabbiy bekor qildi"] };
    const title = actor === 'player' && viewerIsActor ? ['You cancelled the booking', 'Вы отменили бронь', 'Bronni siz bekor qildingiz'][language === 'ru' ? 1 : language === 'uz' ? 2 : 0] : actor ? captions[actor]?.[language === "ru" ? 1 : language === "uz" ? 2 : 0] : undefined;
    const value = reason ? localizeCancellationReason(reason, language) : null;
    const defaults = { 'cancelled by club': 'club', 'cancelled by the club': 'club', 'cancelled by player': 'player', 'cancelled by the player': 'player', 'cancelled by organizer': 'organizer', 'cancelled by coach': 'coach', 'automatically cancelled': 'system' };
    const redundant = Boolean(actor && defaults[(reason ?? '').trim().replace(/\.$/, '').toLowerCase()] === actor);
    return title ? value && !redundant ? title + ": " + value : title : value;
}
