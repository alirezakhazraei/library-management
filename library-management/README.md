# Library Management System API

A role-based library management REST API built as an internship-level
project with **NestJS**, **TypeScript**, and **Prisma** (SQLite).

Members can browse books and borrow/return them. Librarians and Admins
manage the book catalog. Admins can also view all registered users.

## Tech Stack

- TypeScript
- NestJS (modules, controllers, services, guards, decorators)
- Prisma ORM + SQLite (zero external setup - just works)
- JWT authentication (`@nestjs/jwt`, `passport-jwt`)
- bcrypt for password hashing
- class-validator / class-transformer for request validation

## Why NestJS is organized this way

NestJS groups code by **feature module**, not by file type. Each feature
(`auth`, `users`, `books`, `borrow`) has its own folder with a
`*.module.ts`, `*.controller.ts`, `*.service.ts`, and `dto/` folder.

```
src/
  app.module.ts        Root module - imports every feature module
  main.ts               Entry point - bootstraps the app, global pipes/filters

  common/
    enums/role.enum.ts           Role: ADMIN | LIBRARIAN | MEMBER
    decorators/roles.decorator.ts    @Roles(Role.ADMIN) - marks allowed roles on a route
    decorators/current-user.decorator.ts  @CurrentUser() - pulls the logged-in user
    guards/jwt-auth.guard.ts     Verifies the JWT (is this user logged in?)
    guards/roles.guard.ts        Checks role against @Roles metadata (is this user allowed?)
    filters/http-exception.filter.ts  Consistent JSON error responses

  prisma/
    prisma.service.ts     Wraps PrismaClient as an injectable service
    prisma.module.ts      @Global so every module can inject PrismaService

  auth/          register, login, JWT strategy
  users/         admin-only: list all users
  books/         book catalog CRUD
  borrow/        borrow/return books, borrow history

prisma/
  schema.prisma   Database models: User, Book, BorrowRecord
```

### How role-based auth works here

1. `JwtAuthGuard` runs first - verifies the JWT token is valid and attaches
   `{ userId, email, role }` to `req.user`.
2. `RolesGuard` runs second - reads the `@Roles(...)` metadata on the route
   (set via the `@Roles()` decorator) and checks `req.user.role` is in that
   list. If a route has no `@Roles()`, any authenticated user is allowed.
3. Public routes (like browsing books) skip both guards entirely.

Example from `books.controller.ts`:
```ts
@Post()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.LIBRARIAN)
create(@Body() dto: CreateBookDto) {
  return this.booksService.create(dto);
}
```

## Getting Started

### 1. Prerequisites
- Node.js 18+

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
```bash
cp .env.example .env
```
The default `.env.example` already uses SQLite (`file:./dev.db`), so there's
nothing extra to install or configure for the database - just generate a
`JWT_SECRET` (see below) and you're ready.

Generate a secure JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```
Paste the result into `.env` as `JWT_SECRET=...`.

### 4. Create the database
```bash
npx prisma migrate dev --name init
```
This reads `prisma/schema.prisma` and creates `prisma/dev.db` with the
`User`, `Book`, and `BorrowRecord` tables.

### 5. Run the server
```bash
npm run start:dev
```
API available at `http://localhost:3000`.

### Optional: browse your data visually
```bash
npm run prisma:studio
```

## API Reference

### Auth
| Method | Endpoint             | Access | Description                          |
|--------|------------------------|--------|----------------------------------------|
| POST   | `/auth/register`       | Public | Register (`role` optional, defaults to `MEMBER`) |
| POST   | `/auth/login`          | Public | Login, returns `accessToken`          |

**Register body:**
```json
{ "name": "Ali", "email": "ali@example.com", "password": "123456", "role": "LIBRARIAN" }
```
`role` is one of `ADMIN`, `LIBRARIAN`, `MEMBER` (optional, defaults to `MEMBER`).

### Books
| Method | Endpoint      | Access                | Description            |
|--------|----------------|------------------------|--------------------------|
| GET    | `/books`       | Public                 | List all books          |
| GET    | `/books/:id`   | Public                 | Get one book             |
| POST   | `/books`       | ADMIN, LIBRARIAN       | Add a new book           |
| PUT    | `/books/:id`   | ADMIN, LIBRARIAN       | Update a book             |
| DELETE | `/books/:id`   | ADMIN                  | Delete a book             |

**Create book body:**
```json
{ "title": "Clean Code", "author": "Robert C. Martin", "isbn": "9780132350884", "totalCopies": 3 }
```

### Borrow / Return
All routes require `Authorization: Bearer <token>`.

| Method | Endpoint              | Access             | Description                       |
|--------|------------------------|--------------------|-------------------------------------|
| POST   | `/borrow`              | Any logged-in user | Borrow a book                      |
| PATCH  | `/borrow/:id/return`   | Any logged-in user | Return a borrowed book             |
| GET    | `/borrow/my-history`   | Any logged-in user | My own borrow history              |
| GET    | `/borrow`              | ADMIN, LIBRARIAN    | Full borrow history (all members)  |

**Borrow body:**
```json
{ "bookId": 1 }
```
A `MEMBER` always borrows for themselves. An `ADMIN`/`LIBRARIAN` can issue a
book on behalf of another user by adding `"userId": 5`.

### Users
| Method | Endpoint  | Access | Description        |
|--------|------------|--------|----------------------|
| GET    | `/users`   | ADMIN  | List all registered users |

## Notes on the borrow logic

`BorrowService.borrowBook`:
1. Checks the book exists and has `availableCopies > 0`.
2. Creates a `BorrowRecord` and decrements `availableCopies` **in a single
   Prisma transaction**, so the copy count can never drift out of sync with
   actual borrow records even if something fails mid-way.
3. Sets `dueDate` 14 days from now (see `LOAN_PERIOD_DAYS` in the service -
   easy to tweak).

`BorrowService.returnBook` reverses this: marks the record `RETURNED`,
stamps `returnedAt`, and increments `availableCopies` back up - also in a
transaction.

## Pushing this to GitHub

```bash
git init
git add .
git commit -m "Initial commit: library management API (NestJS, TypeScript, Prisma, role-based auth)"
git branch -M main
git remote add origin <your-empty-github-repo-url>
git push -u origin main
```

`.env` and `prisma/dev.db` are already in `.gitignore` - never commit real
secrets or your local database file, only `.env.example`.

Suggested follow-up commits to build out your history:
```bash
git commit -m "Add pagination to book listing"
git commit -m "Add unit tests for BorrowService"
git commit -m "Add Swagger/OpenAPI documentation"
```
