import { createUzbekDateFormatter, uzsCurrency } from "./marketplace-format.js";
export const publicShareCopy = {
    en: { title: 'Play together', intro: 'Book courts and find matches and coaches in Tashkent.', open: 'Open in SQUAD', download: 'Get SQUAD',
        testing: 'SQUAD is currently available to invited testers. Use your SQUAD invitation on iPhone or your invited Google account on Android.',
        stores: 'Install SQUAD, then return to this invitation to open it in the app.', iosTesting: 'Install TestFlight', androidTesting: 'Android testing',
        invite: 'Invitation code', private: 'You have been invited to a private match. Open SQUAD to check access and available places.',
        loading: 'Loading the match…', unavailable: 'This match is unavailable or has ended. Open SQUAD to find your next game.',
        details: 'Match details', places: 'Places available', price: 'Total per player', free: 'Free', current: 'Availability and price are checked again in the app.',
        badLink: 'This link is incomplete or invalid. Ask the sender for a new invitation.', home: 'SQUAD home', retry: 'Try again', failed: 'The match could not be loaded. Try again or open SQUAD.' },
    ru: { title: 'Играйте вместе', intro: 'Бронируйте корты, находите матчи и тренеров в Ташкенте.', open: 'Открыть в SQUAD', download: 'Скачать SQUAD',
        testing: 'SQUAD сейчас доступен приглашённым тестировщикам. На iPhone используйте приглашение SQUAD, на Android — приглашённый аккаунт Google.',
        stores: 'Установите SQUAD, затем вернитесь к приглашению и откройте его в приложении.', iosTesting: 'Установить TestFlight', androidTesting: 'Тестирование Android',
        invite: 'Код приглашения', private: 'Вас пригласили в закрытый матч. Откройте SQUAD, чтобы проверить доступ и свободные места.',
        loading: 'Загружаем матч…', unavailable: 'Матч недоступен или уже завершён. Найдите следующую игру в SQUAD.',
        details: 'О матче', places: 'Свободных мест', price: 'Итого за игрока', free: 'Бесплатно', current: 'Наличие мест и цена повторно проверяются в приложении.',
        badLink: 'Ссылка неполная или неверная. Попросите отправителя прислать новое приглашение.', home: 'На главную SQUAD', retry: 'Попробовать ещё раз', failed: 'Не удалось загрузить матч. Попробуйте ещё раз или откройте SQUAD.' },
    uz: { title: 'Birga o‘ynang', intro: 'Toshkentda kortlarni bron qiling, o‘yinlar va murabbiylarni toping.', open: 'SQUADda ochish', download: 'SQUADni yuklab olish',
        testing: 'SQUAD hozir taklif qilingan sinovchilar uchun mavjud. iPhoneda SQUAD taklifidan, Androidda taklif qilingan Google akkauntingizdan foydalaning.',
        stores: 'SQUADni o‘rnating, keyin taklifga qaytib, uni ilovada oching.', iosTesting: 'TestFlightni o‘rnatish', androidTesting: 'Android sinovi',
        invite: 'Taklif kodi', private: 'Siz yopiq o‘yinga taklif qilindingiz. Kirish va bo‘sh joylarni tekshirish uchun SQUADni oching.',
        loading: 'O‘yin yuklanmoqda…', unavailable: 'O‘yin mavjud emas yoki yakunlangan. SQUADda keyingi o‘yiningizni toping.',
        details: 'O‘yin haqida', places: 'Bo‘sh joylar', price: 'Bir o‘yinchi uchun jami', free: 'Bepul', current: 'Bo‘sh joylar va narx ilovada qayta tekshiriladi.',
        badLink: 'Havola to‘liq emas yoki noto‘g‘ri. Yuboruvchidan yangi taklif so‘rang.', home: 'SQUAD bosh sahifasi', retry: 'Qayta urinish', failed: 'O‘yin yuklanmadi. Qayta urinib ko‘ring yoki SQUADni oching.' },
};
export const shareDownloadLinks = (storesVerified = false) => storesVerified ? {
    ios: 'https://apps.apple.com/app/id6817815282', android: 'https://play.google.com/store/apps/details?id=com.squad.androidsquad',
} : {
    ios: 'https://apps.apple.com/app/testflight/id899247664', android: 'https://play.google.com/apps/testing/com.squad.androidsquad',
};
const object = (value) => value !== null && typeof value === 'object' && !Array.isArray(value) ? value : null;
const boundedText = (value, maximum) => typeof value === 'string' && value.trim().length > 0 && value.length <= maximum && !/[\u0000-\u001f]/.test(value);
export function decodePublicMatchCard(value, expectedId) {
    const row = object(value), venue = object(row?.venue);
    if (!row || !venue || row.id !== expectedId || !['padel', 'tennis', 'football'].includes(String(row.sportId)) ||
        !boundedText(venue.name, 200) || !boundedText(venue.address, 500) || !boundedText(venue.timezone, 64) ||
        !boundedText(row.courtName, 200) || typeof row.startsAt !== 'string' || typeof row.endsAt !== 'string' ||
        !Number.isFinite(Date.parse(row.startsAt)) || !(Date.parse(row.endsAt) > Date.parse(row.startsAt)) ||
        !Number.isInteger(row.seats) || Number(row.seats) < 1 || Number(row.seats) > 100 ||
        !Number.isInteger(row.availableSeats) || Number(row.availableSeats) < 0 || Number(row.availableSeats) > Number(row.seats) ||
        typeof row.pricePerSeatUzs !== 'string' || !/^(0|[1-9]\d{0,18})$/.test(row.pricePerSeatUzs) || BigInt(row.pricePerSeatUzs) > BigInt('9223372036854775807'))
        return null;
    try {
        new Intl.DateTimeFormat('en', { timeZone: venue.timezone });
    }
    catch {
        return null;
    }
    // Copy only the public projection; unexpected fields never reach the view.
    return { id: expectedId, sportId: row.sportId, startsAt: row.startsAt, endsAt: row.endsAt,
        venue: { name: venue.name, address: venue.address, timezone: venue.timezone }, courtName: row.courtName,
        availableSeats: Number(row.availableSeats), seats: Number(row.seats), pricePerSeatUzs: row.pricePerSeatUzs };
}
export function presentPublicMatchCard(card, language) {
    const locale = { en: 'en-GB', ru: 'ru-RU', uz: 'uz-Latn-UZ' }[language];
    const sport = { padel: { en: 'Padel', ru: 'Падел', uz: 'Padel' }, tennis: { en: 'Tennis', ru: 'Теннис', uz: 'Tennis' }, football: { en: 'Football', ru: 'Футбол', uz: 'Futbol' } }[card.sportId][language];
    const formatter = (options) => language === 'uz' ? createUzbekDateFormatter(options) : new Intl.DateTimeFormat(locale, options);
    const day = formatter({ timeZone: card.venue.timezone, weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(card.startsAt));
    const time = formatter({ timeZone: card.venue.timezone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
    const price = card.pricePerSeatUzs === '0' ? publicShareCopy[language].free : card.pricePerSeatUzs.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' ' + uzsCurrency(language);
    return { sport, day, time: time.format(new Date(card.startsAt)) + '–' + time.format(new Date(card.endsAt)), price };
}
