# Отчёт код-ревью TASK-001 (роль `code-reviewer`)

## Context Summary

Ревью покрывает рабочее дерево против `HEAD` (`777c7c7`). Это изменённые `package.json`, `package-lock.json`, `vite.config.ts`, `src/App.tsx`, `src/App.css` и новые `src/features/sessions/*` и `src/test/setup.ts`. Сверял с `requirements.md` (AC-1…AC-14, AC-15 как справка), `implementation-plan.md` и правилами из `rulesets/common/code-reviewer`, `rulesets/framework/code-reviewer` и React-индекса `coder`. `rulesets/project/` пуст. Код я прочитал целиком, но `npm test`, `lint` и `build` не запускал: у роли нет таких инструментов. Результаты этих команд в `workflow-log.md` взяты со слов `coder`, я их не проверял.

## Verdict: PASS

Блокеров основного пути нет, и я не нашёл дефектов уровня should-fix. Ниже неблокирующие замечания и остаточные пробелы. Вердикт выведен из чтения кода и **не подтверждён запуском**.

## Findings

### Блокеры основного пути

Не найдено.

### Неблокирующие замечания

**N1. Низкий контраст цвета ошибок в тёмной теме (low, a11y).**
- `src/App.css:69-72` задаёт `color: #c62828` для `.load-error` и `.field-error`.
- В тёмной теме фон `--bg: #16171d` (`src/index.css:38`). По моему расчёту контраст около 3.2:1, а для текста 14–18px нужно 4.5:1.
- Сценарий: при `prefers-color-scheme: dark` сообщения валидации и ошибки загрузки читаются хуже.
- Это общая a11y-практика, а не правило репозитория.

**N2. Нет индикации ожидания при создании (low, UX).**
- `CreateSessionForm.tsx:~92-94`: во время запроса кнопка `Create session` и оба поля просто `disabled`, текста или спиннера нет.
- AC-9 выполнен, так как повторная отправка невозможна. Но в `rulesets/common/shared/web-interface-guidelines/command.md` (раздел Forms) сказано "spinner during request".
- Сценарий: при задержке мока 400 мс форма на мгновение выглядит зависшей.

**N3. Отказ `createSession` даёт необработанный reject (informational, вне объёма).**
- `SessionsWorkspace.tsx:56-69`: `try/finally` без `catch`. Ошибка пробросится из `await onSubmit` в `CreateSessionForm.tsx:~39`.
- Это соответствует решению 3 и D7: флаг сбрасывается в `finally` (строки 65-68), форма не зависает. Это не дефект, фиксирую для информации.

**N4. При ошибке списка недоступны `New session` и фильтр (observation).**
- `SessionsWorkspace.tsx:93-103`: тулбар рендерится только при `loadState === 'ready'`.
- Требования этого не запрещают, а AC-3 и AC-2 выполнены. Если поведение нежелательно, его нужно зафиксировать в плане.

**N5. Мелочи (nit).**
- Ошибки валидации остаются на экране до следующей отправки, пока пользователь правит поле.
- В `src/index.css` остались мёртвые стили демо (`#social .button-icon`, `.counter`, `#root` и др.). План разрешал не трогать файл.
- Классы `status-*` в `SessionList.tsx:~22` не имеют стилей.
- В моке сессия `scheduled` с `startsAt: '2027-02-10…'` (`mockSessionsApi.ts:15`) со временем окажется в прошлом. Это не влияет на AC.

## Покрытие AC (по коду и тестам)

| AC | Реализация | Автотест |
| --- | --- | --- |
| AC-1 | `SessionsWorkspace.tsx:35-40`, `SessionList.tsx` (title, status, `Intl.DateTimeFormat`) | Да, essential-тест |
| AC-2 | `role="status"` `Loading sessions…` (стр. 80-82), строки только в `ready` | Нет |
| AC-3 | `role="alert"` с `Retry` (стр. 84-90). `handleRetry` ставит `loading`, повторяет `listSessions` через `loadAttempt` (стр. 51-54) | Нет |
| AC-4 | `StatusFilter.tsx`: 4 кнопки, `aria-pressed`, по умолчанию `'all'` (стр. 26) | Частично (`aria-pressed` проверяется) |
| AC-5 | Фильтр на клиенте, `visibleSessions` считается в рендере (стр. 71-74) | Да (`listSessions` вызван 1 раз) |
| AC-6 | Кнопка `New session` открывает форму (стр. 98-109) | Да |
| AC-7 | `validation.ts:20-28`: trim, 3–80, сообщение с правилом | Частично (короткий заголовок) |
| AC-8 | `validation.ts:30-37`: пусто, NaN или `<= now` | Частично (прошлая дата) |
| AC-9 | Двойная защита: `disabled`, `if (isSubmitting)` в форме (стр. 26), `isSubmittingRef` в `handleCreate` (стр. 57-59) | Нет |
| AC-10 | Trim, ISO, добавление в конец (стр. 62), статус `scheduled` присваивает мок | Да |
| AC-11 | D1: `setFilter('all')` после успеха (стр. 63), решение зафиксировано в плане | Да (`aria-pressed` у `All`) |
| AC-12 | Данные только в `mockSessionsApi.ts`; UI получает `SessionsApi` через проп `api` | Да, через fake-api |
| AC-13 | MSW и бэкенда нет, in-memory мок (D2) | н/п |
| AC-14 | `SessionsWorkspace.test.tsx:43-102`, создание end-to-end, плюс валидация (104-126) | Тесты есть, прогон не проверен |

Без автотестов остаются AC-2, AC-3 и AC-9. Это допустимо: в плане они помечены как "additional, optional".

## Соответствие плану и правилам

- **План:** все файлы из раздела 4 созданы или изменены. Исключение: `validation.test.ts` (помечен optional). `tsconfig*`, `eslint.config.js`, `rulesets/`, `.claude/`, `main.tsx` и `index.css` не тронуты. Дефолтный мок подключён в одном месте (`SessionsWorkspace.tsx:15-16`). Тест использует `fireEvent.change` для `datetime-local` и дату 2099 вместо fake timers, как в плане.
- **React-правила:**
  - Состояние выводится в рендере, без дублирующего state.
  - Функциональные `setState` используются там, где нужно.
  - Условный рендер явный (`? :  null`).
  - Статика вынесена из рендера (`OPTIONS`, `Intl.DateTimeFormat`).
  - Зависимости эффекта узкие (`[api, loadAttempt]`).
  - Защита от устаревшего ответа (`isStale`) безопасна под `StrictMode`.
  - Эффект не вызывает синхронных `setState`.
- **Web Interface Guidelines:**
  - У полей есть `label`, `name`, `autoComplete="off"`.
  - Ошибки стоят рядом с полями (`aria-describedby`, `role="alert"`), фокус уходит на первое невалидное поле.
  - Даты форматируются через `Intl`, у кнопок есть `:focus-visible`, нет `transition: all`.
  - Отклонения: N1 и N2.
- **Типы и сборка:** `SubmitEvent` есть в `@types/react` (проверено в `node_modules`). Импорты типов соответствуют `verbatimModuleSyntax`.

## Evidence

- **Прочитано:** файлы роли, команды и скилла; `requirements.md`; `implementation-plan.md`; все 11 файлов в `src/features/sessions/`, `src/test/setup.ts`, `src/App.tsx`, `src/App.css`, `src/index.css`; `tsconfig.app.json`; `git diff` для `package.json`, `vite.config.ts` и `src/App.tsx`; `workflow-log.md`.
- **Команды:** `git diff`, `git log` и read-only `git status --short` / `git diff --stat`.
- **Не запускалось:** `npm test`, `npm run lint`, `npm run build`, `npm run dev` и браузерная проверка. Заявленные `coder` результаты (2/2 тестов, lint и build проходят) мной не подтверждены.
- **Версии зависимостей** (`vitest ^5.1.1`, `jsdom ^29.1.1`, `jest-dom ^8.0.0` и др.) я не проверял на совместимость. Полагаюсь на `package-lock.json` и заявленный `coder` прогон.

## Остаточные пробелы

1. Независимый прогон `test`, `lint` и `build` не выполнен.
2. AC-15 (ручная проверка в браузере) не сделан: раздел `Manual Browser Observation` в `workflow-log.md` пока шаблон.
3. Нет автотестов для AC-2, AC-3, AC-9 и граничных значений AC-7 и AC-8 (81 символ, только пробелы, пустая дата).

## Next Step

Основная рекомендация: **`verify`**. Он независимо прогонит `npm test`, `npm run lint` и `npm run build`, то есть закроет пробел 1. Это прямое условие моего PASS.

Альтернативы:
- **`browser-verify`**: для AC-15, нужен до записи в `workflow-log.md`.
- **`test-generator`**: если хотите покрыть AC-3 (Retry), AC-9 и границы AC-7/AC-8.
- **`coder`**: только если решите править N1 или N2. Блокирующих оснований нет.

Какую роль запускать, решаете вы. Я ничего не запускал и файлы не менял. STOP.