# Matriks Page / Action Admin AyoCuci

Dokumen ini adalah versi presisi per halaman dan aksi UI untuk implementasi permission di admin web.

## `dashboard`
- Access: `read`
- Actions: `export`

## `analytics`
- Access: `read`
- Actions: `export`

## `tenants`
- Access: `read`
- Actions: `update`, `delete`, `suspend`, `activate`, `reset_data`
- Detail page: `tenants/[id]` wajib ikut `read`

## `users`
- Access: `read`
- Actions: `update`, `delete`
- Detail page: `users/[id]` wajib ikut `read`

## `customers`
- Access: `read`
- Actions: `export`

## `topups`
- Access: `read`
- Actions: `confirm`, `cancel`, `export`

## `subscriptions`
- Access: `read`
- Actions: `export`

## `packages`
- Access: `read`
- Actions: `create`, `update`, `delete`

## `vouchers`
- Access: `read`
- Actions: `create`, `update`, `delete`, `activate`, `suspend`

## `notifications`
- Access: `read`
- Actions: `broadcast`, `delete`
- Detail audit token: `delete`

## `content`
- Access: `read`
- Actions: `create`, `update`, `delete`

## `tutorials`
- Access: `read`
- Actions: `create`, `update`, `delete`

## `referrals`
- Access: `read`
- Actions: `approve`, `reject`, `export`

## `economy`
- Access: `read`
- Actions: `create`, `update`, `delete`
- Config update dan bank management harus dipisah di UI, tapi tetap di bawah permission yang sama

## `legal`
- Access: `read`
- Actions: `update`

## `fixer`
- Access: `read`
- Actions: `reset_data`

## `account-deletions`
- Access: `read`
- Actions: `export`

## `admin-management`
- Access: master-only
- Actions: `read`, `create`, `update`, `delete`, `assign_role`, `manage`

## Implementasi UI

- Page-level guard:
  - `PermissionGate module="..." action="read"`
- Action-level guard:
  - bungkus tombol create/update/delete/approve/broadcast/reset
- Data table action:
  - tombol di row dan modal juga harus ikut guard
- Master-only:
  - menu dan route harus ditutup untuk akun non-master
