# Matriks Role Admin AyoCuci

Dokumen ini adalah acuan final untuk role admin, halaman web admin, dan aksi yang boleh dijalankan.

## Prinsip

- `Master Admin` bukan preset role. Itu status akun sistem khusus dengan `adm_is_master = true`.
- Role biasa harus mengikuti fitur nyata di app, bukan sekadar CRUD generik.
- Permission harus ditegakkan di 2 lapis:
  - page-level untuk akses halaman
  - action-level untuk tombol atau aksi sensitif

## Role Preset

### CS / Support

Fokus:
- Support harian untuk tenant, owner, topup, dan notifikasi.

Page yang boleh diakses:
- `dashboard`
- `tenants`
- `users`
- `customers`
- `topups`
- `subscriptions`
- `notifications`
- `account-deletions`
- `fixer`

Aksi yang boleh:
- `read`
- `update` terbatas
- `confirm`
- `cancel`
- `export`

### Operations

Fokus:
- Operasional tenant, status, insiden, dan pemulihan dasar.

Page yang boleh diakses:
- `dashboard`
- `analytics`
- `tenants`
- `users`
- `customers`
- `topups`
- `subscriptions`
- `notifications`
- `referrals`
- `account-deletions`
- `fixer`

Aksi yang boleh:
- `read`
- `update`
- `suspend`
- `activate`
- `reset_data`
- `confirm`
- `cancel`
- `export`

### Growth / Marketing

Fokus:
- Promo, konten, tutorial, referral, dan broadcast.

Page yang boleh diakses:
- `dashboard`
- `analytics`
- `customers`
- `subscriptions`
- `packages`
- `vouchers`
- `notifications`
- `content`
- `tutorials`
- `referrals`

Aksi yang boleh:
- `read`
- `create`
- `update`
- `delete`
- `activate`
- `suspend`
- `broadcast`
- `approve`
- `reject`
- `export`

### Finance / Billing

Fokus:
- Approval finansial, kontrol billing, konfigurasi ekonomi, dan risiko.

Page yang boleh diakses:
- `dashboard`
- `analytics`
- `tenants`
- `users`
- `topups`
- `subscriptions`
- `economy`
- `legal`
- `fixer`
- `referrals`

Aksi yang boleh:
- `read`
- `approve`
- `reject`
- `confirm`
- `cancel`
- `update`
- `reset_data`
- `export`

### Master Admin

Fokus:
- Akses penuh untuk kontrol internal sistem.

Hak:
- `admin-management`
- semua page lain
- semua aksi
- assign role
- create/update/delete admin

Catatan:
- Hak ini tidak boleh diberikan sebagai preset ke akun lain.

## Halaman Master-Only

- `admin-management`
- seluruh manajemen role admin

## Ringkasan Pembagian Aksi Sensitif

- `tenants`
  - `read`, `update`, `delete`, `suspend`, `activate`, `reset_data`
- `users`
  - `read`, `update`, `delete`
- `topups`
  - `read`, `confirm`, `cancel`, `export`
- `notifications`
  - `read`, `broadcast`, `delete`
- `content`
  - `read`, `create`, `update`, `delete`
- `tutorials`
  - `read`, `create`, `update`, `delete`
- `vouchers`
  - `read`, `create`, `update`, `delete`, `activate`, `suspend`
- `economy`
  - `read`, `create`, `update`, `delete`
- `referrals`
  - `read`, `approve`, `reject`, `export`
- `legal`
  - `read`, `update`
- `fixer`
  - `read`, `reset_data`

## Catatan Implementasi

- Menu sidebar harus disembunyikan jika role tidak punya permission.
- Tombol sensitif harus dibungkus `PermissionGate`.
- Detail page seperti `tenants/[id]` dan `users/[id]` harus ikut page-level guard.
- Jika satu page dipakai lintas role, pembatasan harus di level aksi, bukan hanya page.
