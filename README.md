# SQUAD — squadplayers.com

Статический сайт SQUAD (RU / UZ / EN), хостинг — GitHub Pages.

## Главная страница

Главная собирается из шаблона: тексты — в `tools/build_home.py`, разметка — в `tools/home_template.html`.
После правок:

```bash
python3 tools/build_home.py
```

Скрипт пишет `index.html`, `ru/index.html`, `uz/index.html`, `en/index.html`. Руками эти файлы не править.

## Локальный просмотр

```bash
python3 -m http.server 4173
```

Открыть `http://127.0.0.1:4173/`.
