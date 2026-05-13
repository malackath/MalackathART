# PRD — Elena Cruz Art Gallery

## Original Problem Statement
> Quiero un sitio web para exponer cuadros con posibilidad de ser comprados. El sitio debe mostrar información mía como artista, las obras y un listado de las futuras exposiciones. Al hacer clic en cada obra llevará a una página donde muestre a gran tamaño la obra seleccionada, nombre, año, técnica y breve descripción de la misma. Las obras son muy coloridas por lo que el sitio debe ser blanco o negro con poca intervención de colores fuertes. Estilo minimalista con fuentes sans serif y modernas.

## User Choices (locked)
- Stripe Checkout (real integration, test key in env)
- Admin panel for managing artworks + exhibitions
- Black/dark minimalist theme
- Bilingual ES / EN
- Sample artworks/exhibitions seeded (replaceable from admin)

## Architecture
- **Backend**: FastAPI (`/app/backend/server.py`), MongoDB (motor), JWT auth (`pyjwt`), bcrypt, emergentintegrations Stripe wrapper
- **Frontend**: React 19 + react-router-dom 7 + Tailwind + shadcn/ui + sonner; Cabinet Grotesk + Satoshi via Fontshare
- **Auth**: Single admin user, seeded on startup from `ADMIN_EMAIL` / `ADMIN_PASSWORD` env
- **Payments**: `/api/checkout/session`, `/api/checkout/status/{sid}`, `/api/webhook/stripe` with `payment_transactions` collection

## User Personas
1. **Visitor / Collector** — Browses works, reads bio, buys via Stripe
2. **Curator / Press** — Reads bio + upcoming exhibitions, contacts via email
3. **Artist (Admin)** — Manages catalog and exhibitions through `/admin`

## Core Requirements (static)
- Home with hero, featured work, recent works, upcoming exhibitions
- Works catalog (grid) → Work detail page (large image, title, year, technique, description, price, buy)
- Exhibitions list
- About artist page (bio + portrait)
- Contact page
- Admin login + dashboard (CRUD artworks + exhibitions)
- EN/ES toggle persisted in localStorage

## Implemented (2026-02)
- All public pages (Home, Works, WorkDetail, Exhibitions, About, Contact)
- Admin login + protected dashboard with two-tab CRUD
- Stripe checkout flow with redirect + polling Success page
- Bilingual content (per-field `*_en` and `bio_en`)
- Dark editorial design (Cabinet Grotesk display + Satoshi body, asymmetric layouts)
- Seed data: 4 artworks, 3 exhibitions, artist info
- Backend 16/16 tests + frontend critical flows tested

## Backlog / Next Tasks
**P1**
- Image upload to object storage for admin (currently uses URLs)
- Real Stripe key swap (production) — currently `sk_test_emergent` stub
- Order confirmation emails (Resend / SendGrid)
**P2**
- Press / publications section
- Newsletter signup
- Series / collections grouping for artworks
- Shipping address capture in checkout metadata
**P3**
- Past exhibitions archive (currently only upcoming list)
- SEO meta tags + sitemap + OG images

## Test Credentials
- Admin: `admin@artist.com` / `Admin123!`
