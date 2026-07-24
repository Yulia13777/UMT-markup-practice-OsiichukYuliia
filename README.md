# Flora — UMT Markup Practice

---

## Live preview

## Figma

## https://www.figma.com/design/2Tj16H7IO7dq1ViTvIh57V/Flora

Лендинг квіткового магазину **Flora**, створений за макетом Figma.

Проєкт містить адаптивну верстку, слайдери, каталог букетів, модальні вікна, форми з валідацією, mock REST API та підтримку GitHub Pages.

## Можливості

- Адаптивна верстка
- Мобільне меню
- Hero, About, Contacts і Footer
- Слайдер популярних букетів
- Каталог із пагінацією
- Слайдер відгуків
- Модалки товару та замовлення
- Валідація форми

## Стек

- Vite 8
- HTML5 + CSS (Flexbox, Grid)
- JavaScript (ES Modules)
- Axios
- json-server
- Google Fonts
- SVG Sprite
- AOS

## Структура

```
.
├── index.html
├── db.json                 # дані для json-server: bestsellers, products, feedbacks
├── vite.config.js          # Vite + static-API emitter + копіювання images/
├── package.json
├── styles/
│   ├── reset.css           # власний reset поверх normalize
│   ├── colors.css          # CSS custom properties (кольори)
│   ├── fonts.css           # змінні розмірів шрифтів
│   ├── styles.css          # основні стилі
│   └── shared.css          # інфра: лоадери, нотифікації, override-и
├── js/
│   ├── apiClient.js        # axios-інстанс + static-mode interceptor
│   ├── catalogue.js        # каталог букетів + серверна пагінація
│   ├── bestsellers-slider.js
│   ├── feedback-slider.js
│   ├── modal.js            # модалки товару + замовлення, валідація форми
│   ├── mobile-menu.js
│   ├── button-cooldown.js
│   ├── notifications.js    # тост-нотифікації помилок
│   └── utils.js            # хелпери: форматер ціни, resolver зображень
├── images/                 # фото букетів і секцій (@1x + @2x)
└── icons/
    └── sprite.svg          # SVG-sprite з іконками
```

## Запуск

Встановити залежності:

```bash
npm install
```

Запустити локально (два термінали):

```bash
npm run api
npm run dev
```

Відкрити:

```
http://localhost:4000
```

Для перевірки режиму GitHub Pages:

```bash
npm run preview:pages
```

## API

| Endpoint                                | Опис                  |
| --------------------------------------- | --------------------- |
| GET `/api/bestsellers`                  | Популярні букети      |
| GET `/api/products?_page=N&_per_page=8` | Каталог із пагінацією |
| GET `/api/feedbacks`                    | Відгуки               |

## npm-скрипти

| Скрипт                  | Призначення                    |
| ----------------------- | ------------------------------ |
| `npm run dev`           | Vite dev-сервер                |
| `npm run api`           | json-server                    |
| `npm run build`         | Продакшен-білд                 |
| `npm run preview`       | Перегляд збірки                |
| `npm run preview:pages` | Перегляд у режимі GitHub Pages |

## Деплой

Проєкт автоматично публікується на **GitHub Pages** через workflow у `.github/workflows/deploy.yml`. Для Pages використовується статичний API, оскільки json-server там недоступний.

### Корисні npm-скрипти

| Скрипт                  | Що робить                            |
| ----------------------- | ------------------------------------ |
| `npm run dev`           | Vite dev-сервер (порт 4000)          |
| `npm run api`           | json-server (порт 3001)              |
| `npm run build`         | Продакшен-білд у `dist/`             |
| `npm run preview`       | Прев'ю зібраного `dist/` (порт 4173) |
| `npm run preview:pages` | Білд + прев'ю у static-API режимі    |

### Деплой

Сайт публікується на GitHub Pages з гілки `main` через workflow
`.github/workflows/deploy.yml`. Кожен push у `main` запускає білд у
static-API режимі (json-server недоступний на Pages) і деплоїть `dist/`
у Pages environment.
