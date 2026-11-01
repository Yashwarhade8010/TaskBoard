# Taskboard

A simple CRUD app: **React** (Vite) frontend, **Node/Express** API, **MySQL** database.
You can add, edit, delete, filter and change the status of tasks.

```
Browser -> React (:5173) --/api--> Express (:3000) -> MySQL (:3306)
```

## Run it locally

**1. Database.** Install MySQL 8 and create the database:

```sql
CREATE DATABASE taskboard CHARACTER SET utf8mb4;
```

**2. Backend.**

```bash
cd backend
cp .env.example .env      # put your MySQL user/password in .env
npm install
npm run dev               # http://localhost:3000, creates the tables on first start
npm test                  # unit tests (no database needed)
```

**3. Frontend.**

```bash
cd frontend
npm install
npm run dev               # http://localhost:5173 (proxies /api to the backend)
```

## API

| Method | Path | Notes |
|---|---|---|
| GET | `/api/tasks?status=&limit=&offset=` | list, paginated |
| GET | `/api/tasks/:id` | |
| POST | `/api/tasks` | `{title, description?, status?}` |
| PUT | `/api/tasks/:id` | partial update |
| DELETE | `/api/tasks/:id` | |

`status` is one of `todo`, `in_progress`, `done`.

## Project layout

```
backend/    Express API, SQL migrations, tests
frontend/   React UI
```
