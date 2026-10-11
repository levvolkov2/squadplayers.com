#!/usr/bin/env python3
"""Builds the SQUAD demo page in RU / UZ / EN from demo_template.html.

Run from anywhere:  python3 site/tools/build_demo.py
Writes: demo/index.html (RU, canonical "/demo/"), ru/demo/index.html, uz/demo/index.html, en/demo/index.html.
The video itself is in Russian; descriptions and chapters are translated.
"""
import html
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
VERSION = '20261011'

# Keys whose values contain intentional markup (not escaped).
RAW = {'h1', 'protoTitle'}

RU = dict(
    title='SQUAD — Демо приложения',
    desc='Демонстрационное видео SQUAD: живая сборка iOS 1.0.7 из TestFlight — главная, поиск игры, создание матча с оплатой своей части, профиль и рейтинг.',
    navLabel='Меню', menuLabel='Открыть меню',
    navHow='Как это работает', navPlan='План реализации', navTeam='Команда', navDemo='Демо', navContacts='Контакты',
    fallback='Ваш браузер не поддерживает видео.', download='Скачать ролик (MP4)',
    meta='1:38 · запись экрана iPhone · iOS 1.0.7 из TestFlight',
    pill='Демо · живая сборка 1.0.7',
    h1='SQUAD<br><span class="accent">в работе</span>',
    lead='Запись экрана реального iPhone: тестовая сборка из TestFlight подключена к рабочему серверу SQUAD. Показываем путь игрока — от главной до матча, где каждый платит только свою часть.',
    chaptersLabel='Что показано в видео',
    c1='Главная', c1p='«Во что играем сегодня?»: уровень игрока ~2.5, выбор вида спорта, ближайшие игры, свободные корты и турниры.',
    c2='Играть', c2p='Матчи, корты и турниры с фильтрами: мой уровень, дата, вечер, район.',
    c3='Новый матч', c3p='Клуб, дата и свободное время на корте с ценой с человека.',
    c4='Формат и уровень', c4p='Парный 2×2, калибровочный или рейтинговый матч, диапазон уровня, открытый или закрытый матч.',
    c5='Оплата своей части', c5p='«Каждый платит за своё место»: итог со стоимостью корта и сервисным сбором SQUAD — до оплаты картой.',
    c6='Профиль', c6p='Уровень профиля, калибровка 0 из 5, статистика матчей, лента и игроки.',
    c7='Рейтинг города', c7p='Рейтинг Ташкента — по подтверждённым результатам после пяти калибровочных матчей.',
    c8='Чаты', c8p='Чаты матчей и поддержка SQUAD прямо в приложении.',
    noteB='Важно.',
    note='До публичного запуска в базе только тестовые клуб и корты — они подписаны «[REVIEW / TEST]». В видео матч не создаётся и оплата не проводится. Реальные клубы, начиная с Itek Tennis Club, появятся к запуску в четвёртом квартале 2026 года.',
    protoEyebrow='Прототип', protoTitle='Попробовать<br>самому',
    p1='Работающий прототип', p1p='Сборка iOS 1.0.7 в TestFlight. Напишите — пришлём приглашение для установки на iPhone в тот же день.',
    p2k='Сайт', p2='Проблема, решение, команда', p2p='Как работает SQUAD, дорожная карта, план реализации с решениями на базе ИИ и команда.',
    tin='ИНН',
)

UZ = dict(
    title='SQUAD — Ilova demosi',
    desc='SQUAD demo videosi: TestFlightdagi iOS 1.0.7 jonli versiyasi — bosh sahifa, o‘yin qidirish, har kim o‘z ulushini to‘laydigan o‘yin yaratish, profil va reyting.',
    navLabel='Menyu', menuLabel='Menyuni ochish',
    navHow='Qanday ishlaydi', navPlan='Amalga oshirish rejasi', navTeam='Jamoa', navDemo='Demo', navContacts='Aloqa',
    fallback='Brauzeringiz videoni qo‘llab-quvvatlamaydi.', download='Videoni yuklab olish (MP4)',
    meta='1:38 · iPhone ekran yozuvi · TestFlightdagi iOS 1.0.7',
    pill='Demo · jonli versiya 1.0.7',
    h1='SQUAD<br><span class="accent">amalda</span>',
    lead='Haqiqiy iPhone ekran yozuvi: TestFlight versiyasi SQUADning ishchi serveriga ulangan. O‘yinchining yo‘lini ko‘rsatamiz — bosh sahifadan har kim faqat o‘z ulushini to‘laydigan o‘yingacha.',
    chaptersLabel='Videoda nimalar ko‘rsatilgan',
    c1='Bosh sahifa', c1p='«Bugun nima o‘ynaymiz?»: o‘yinchi darajasi ~2.5, sport turini tanlash, yaqin o‘yinlar, bo‘sh kortlar va turnirlar.',
    c2='O‘ynash', c2p='O‘yinlar, kortlar va turnirlar filtrlar bilan: mening darajam, sana, kechqurun, tuman.',
    c3='Yangi o‘yin', c3p='Klub, sana va kortdagi bo‘sh vaqt — bir kishi uchun narx bilan.',
    c4='Format va daraja', c4p='Juftlik 2×2, kalibrovka yoki reyting o‘yini, daraja oralig‘i, ochiq yoki yopiq o‘yin.',
    c5='O‘z ulushini to‘lash', c5p='«Har kim o‘z joyi uchun to‘laydi»: kort narxi va SQUAD xizmat haqi bilan jami summa — karta orqali to‘lovdan oldin.',
    c6='Profil', c6p='Profil darajasi, kalibrovka 5 tadan 0, o‘yinlar statistikasi, lenta va o‘yinchilar.',
    c7='Shahar reytingi', c7p='Toshkent reytingi — besh kalibrovka o‘yinidan keyingi tasdiqlangan natijalar asosida.',
    c8='Chatlar', c8p='O‘yin chatlari va SQUAD qo‘llab-quvvatlash xizmati to‘g‘ridan-to‘g‘ri ilovada.',
    noteB='Muhim.',
    note='Ommaviy ishga tushirishgacha bazada faqat «[REVIEW / TEST]» belgili test klubi va kortlari bor. Videoda o‘yin yaratilmaydi va to‘lov amalga oshirilmaydi. Haqiqiy klublar, Itek Tennis Clubdan boshlab, 2026-yilning to‘rtinchi choragidagi ishga tushirishgacha paydo bo‘ladi.',
    protoEyebrow='Prototip', protoTitle='O‘zingiz<br>sinab ko‘ring',
    p1='Ishlaydigan prototip', p1p='TestFlightdagi iOS 1.0.7 versiyasi. Yozing — iPhone’ga o‘rnatish uchun taklifnomani o‘sha kuni yuboramiz.',
    p2k='Sayt', p2='Muammo, yechim, jamoa', p2p='SQUAD qanday ishlaydi, yo‘l xaritasi, sun’iy intellekt yechimlari bilan amalga oshirish rejasi va jamoa.',
    tin='STIR',
)

EN = dict(
    title='SQUAD — App demo',
    desc='SQUAD demo video: a live iOS 1.0.7 build from TestFlight — home, finding a game, creating a match where everyone pays their own share, profile and rating.',
    navLabel='Menu', menuLabel='Open menu',
    navHow='How it works', navPlan='Implementation plan', navTeam='Team', navDemo='Demo', navContacts='Contacts',
    fallback='Your browser does not support video.', download='Download the video (MP4)',
    meta='1:38 · iPhone screen recording · iOS 1.0.7 from TestFlight',
    pill='Demo · live build 1.0.7',
    h1='SQUAD<br><span class="accent">in action</span>',
    lead='A screen recording of a real iPhone: the TestFlight build is connected to the SQUAD production server. We show the player’s path — from the home screen to a match where everyone pays only their own share.',
    chaptersLabel='What the video shows',
    c1='Home', c1p='“What are we playing today?”: player level ~2.5, sport switch, upcoming games, free courts and tournaments.',
    c2='Play', c2p='Matches, courts and tournaments with filters: my level, date, evening, district.',
    c3='New match', c3p='Club, date and free court time with the price per player.',
    c4='Format and level', c4p='Doubles 2×2, calibration or rated match, level range, open or private match.',
    c5='Pay your share', c5p='“Everyone pays for their own spot”: the total with court cost and the SQUAD service fee — before card payment.',
    c6='Profile', c6p='Profile level, calibration 0 of 5, match stats, feed and players.',
    c7='City rating', c7p='The Tashkent rating, based on confirmed results after five calibration matches.',
    c8='Chats', c8p='Match chats and SQUAD support right in the app.',
    noteB='Important.',
    note='Before the public launch the database contains only a test club and courts labelled “[REVIEW / TEST]”. No match is created and no payment is made in the video. Real clubs, starting with Itek Tennis Club, will appear by the launch in Q4 2026.',
    protoEyebrow='Prototype', protoTitle='Try it<br>yourself',
    p1='Working prototype', p1p='The iOS 1.0.7 build in TestFlight. Write to us — we’ll send an invite to install it on your iPhone the same day.',
    p2k='Website', p2='Problem, solution, team', p2p='How SQUAD works, the roadmap, the implementation plan with AI-based solutions and the team.',
    tin='TIN',
)


NBSP_NUM = re.compile(r'(?<=\d) (?=\d{3}(?!\d))')


def keep_numbers(page):
    """Non-breaking spaces inside numbers like 500 000 (text nodes only)."""
    return re.sub(r'>([^<]+)<', lambda m: '>' + NBSP_NUM.sub(' ', m.group(1)) + '<', page)


def render(template, lang, data, canonical):
    values = {k: (v if k in RAW else html.escape(v, quote=True)) for k, v in data.items()}
    values.update(lang=lang, version=VERSION, canonical=canonical,
                  curRu=' aria-current="page"' if lang == 'ru' else '',
                  curUz=' aria-current="page"' if lang == 'uz' else '',
                  curEn=' aria-current="page"' if lang == 'en' else '')

    def sub(m):
        key = m.group(1)
        if key not in values:
            raise KeyError(f'{lang}: missing key {key}')
        return values[key]
    return keep_numbers(re.sub(r'\{\{(\w+)\}\}', sub, template))


def main():
    template = (ROOT / 'tools' / 'demo_template.html').read_text(encoding='utf-8')
    keys = set(RU)
    for name, d in (('uz', UZ), ('en', EN)):
        missing, extra = keys - set(d), set(d) - keys
        assert not missing and not extra, f'{name}: missing {missing}, extra {extra}'
    pages = {
        'demo/index.html': ('ru', RU, 'https://squadplayers.com/demo/'),
        'ru/demo/index.html': ('ru', RU, 'https://squadplayers.com/ru/demo/'),
        'uz/demo/index.html': ('uz', UZ, 'https://squadplayers.com/uz/demo/'),
        'en/demo/index.html': ('en', EN, 'https://squadplayers.com/en/demo/'),
    }
    for path, (lang, data, canonical) in pages.items():
        out = ROOT / path
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(render(template, lang, data, canonical), encoding='utf-8')
        print('built', path)


if __name__ == '__main__':
    main()
