# 📝 AI Prompts Log: Time Tracker Project

Цей документ містить ключові промпти, використані під час розробки Time Tracker, та описує логіку прийняття технічних рішень.

## 1. Ініціалізація та Архітектура (Clean Architecture)
**Мета:** Побудова масштабованої структури проєкту з розділенням відповідальності між шарами.

> **Prompt:**
> Role: Act as a Senior AI Full-Stack Developer.
> Task: Build a professional Time Tracker web application with clean architecture.
> Technical Stack:
> - Frontend: Next.js (App Router) with TailwindCSS.
> - Backend: Next.js API Routes.
> - Database: Replit Postgres using Drizzle ORM.
> - UI Library: Shadcn UI + Lucide React icons.
>
> Architecture Requirements (MANDATORY):
> Organize the project into distinct layers to ensure modularity:
> - Presentation: UI components in /components, pages in /app.
> - Logic Layer: State and timer business logic in /hooks (e.g., useTimer.ts).
> - API/Client Layer: Fetchers in /lib/api.ts.
> - Data Layer: Schema and DB connection in /server/db.ts and /shared/schema.ts.
>
> Strict Rule: DO NOT put all code in a single file.

## 2. Бізнес-логіка та Валідація
**Мета:** Реалізація функцій трекінгу з дотриманням бізнес-правил.

> **Prompt:**
> Detailed Functionality:
> - Global Tracker: Persistent header with a "Start/Stop" button, Task Name input (with autocomplete), and Project selector.
> - Task Management: List of "Today's Entries" grouped by project with total time calculation. Manual edit in HH:mm format.
> - Project Management: Dedicated page to create/edit projects with color coding.
> - Reports & Export: Day/Week/Month views with functional 'Export to CSV' button.
>
> Critical Logic & Validation:
> - Future Time Protection: Prevent tracking or setting time for future dates.
> - NaN Protection: Robust date parsing to prevent "NaN:NaN" in UI.
> - Persistence: Sync active timer state with DB on page refresh.

## 3. Технічний дебаг: Виправлення Type Mismatch
**Мета:** Вирішення помилки `400 Bad Request` через некоректну валідацію типів дати.

> **Prompt:**
> The bug is identified: the validation schema expects a Date object, but receives a JSON string for startTime. Please fix this:
> - Update Schema: In shared/schema.ts, change validation for startTime and endTime from z.date() to z.coerce.date().
> - Check API Route: Ensure req.body is passed through schema.parse() before sending to Drizzle.
> - Manual Entry Fix: Apply the same z.coerce.date() fix for manual time entry logic.
