# MSA PROPERTY & ASSET — FULL STACK v1

Versi ini mempertahankan tampilan premium MSA dan menambahkan Worker API + Cloudflare D1.

## Struktur
- `public/` website publik + admin
- `src/index.js` Worker API
- `db/schema.sql` database D1
- `wrangler.jsonc` konfigurasi Worker

## Deploy Cloudflare
1. Buat D1 database bernama `MSA_PROPERTY_DB`.
2. Jalankan `db/schema.sql` pada database tersebut.
3. Salin **Database ID** ke `wrangler.jsonc` menggantikan `PASTE_D1_DATABASE_ID_HERE`.
4. Deploy project sebagai Worker + Static Assets.
5. Set environment variables:
   - `ADMIN_USER` = username admin pilihan bro
   - `ADMIN_PASSWORD` = password admin kuat
   - `SESSION_SECRET` = random secret panjang
6. Pastikan binding D1 bernama `DB` dan asset binding bernama `ASSETS`.

## Catatan keamanan
Jangan memakai password contoh untuk produksi. Admin login sekarang divalidasi server-side dan memakai cookie session HttpOnly.

## API utama
- GET `/api/assets`
- POST `/api/assets` (admin)
- PATCH `/api/assets/:id` (admin)
- DELETE `/api/assets/:id` (admin)
- POST `/api/login`
- POST `/api/logout`
- GET/POST `/api/team`
- GET `/api/contact-number`
- POST/GET `/api/owner-submissions`
- GET `/api/health`

Foto file asli belum disimpan ke R2 pada v1; field `image_url` disiapkan untuk tahap R2.
