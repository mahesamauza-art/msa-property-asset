MSA PROPERTY & ASSET — FULL STACK v1

Ini bukan lagi Worker static-only. Paket ini berisi Worker API + Static Assets + Cloudflare D1.

1. Buat D1 database: MSA_PROPERTY_DB.
2. Jalankan db/schema.sql pada D1.
3. Isi database_id di wrangler.jsonc.
4. Deploy project ini sebagai Worker.
5. Pastikan binding D1 = DB dan Static Assets = ASSETS.
6. Set secrets/variables:
   ADMIN_USER
   ADMIN_PASSWORD
   SESSION_SECRET
7. Buka /admin/ untuk login.

Keamanan: jangan gunakan password contoh untuk produksi.
Foto file asli belum memakai R2; field image_url disiapkan untuk tahap R2.
