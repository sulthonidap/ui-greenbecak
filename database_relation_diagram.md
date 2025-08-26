# Diagram Relasi Database GreenBecak

## 📊 Diagram Relasi Tabel

```
┌─────────────┐    1:1    ┌─────────────┐    1:1    ┌─────────────────┐
│    USERS    │◄─────────►│   DRIVERS   │◄─────────►│ DRIVER_LOCATIONS│
│             │           │             │           │                 │
│ • id (PK)   │           │ • id (PK)   │           │ • id (PK)       │
│ • username  │           │ • user_id   │           │ • driver_id     │
│ • email     │           │ • driver_code│          │ • latitude      │
│ • role      │           │ • name      │           │ • longitude     │
│ • name      │           │ • phone     │           │ • is_online     │
│ • phone     │           │ • status    │           │ • last_seen     │
│ • address   │           │ • vehicle_type│         └─────────────────┘
└─────────────┘           └─────────────┘
         │                        │
         │ 1:N                    │ 1:N
         ▼                        ▼
┌─────────────┐           ┌─────────────────┐
│   ORDERS    │           │   WITHDRAWALS   │
│             │           │                 │
│ • id (PK)   │           │ • id (PK)       │
│ • order_number│         │ • driver_id     │
│ • customer_id│          │ • amount        │
│ • driver_id │           │ • status        │
│ • tariff_id │           │ • bank_name     │
│ • status    │           │ • account_number│
│ • price     │           │ • account_name  │
│ • distance  │           └─────────────────┘
└─────────────┘
         │
         │ N:1
         ▼
┌─────────────┐    1:1    ┌─────────────┐
│   TARIFFS   │◄─────────►│  PAYMENTS   │
│             │           │             │
│ • id (PK)   │           │ • id (PK)   │
│ • name      │           │ • order_id  │
│ • min_distance│         │ • amount    │
│ • max_distance│         │ • method    │
│ • price     │           │ • status    │
│ • is_active │           │ • reference │
└─────────────┘           └─────────────┘

┌─────────────┐    1:N    ┌─────────────────┐
│    USERS    │◄─────────►│  NOTIFICATIONS  │
│             │           │                 │
│ • id (PK)   │           │ • id (PK)       │
│ • username  │           │ • user_id       │
│ • email     │           │ • title         │
│ • role      │           │ • message       │
│ • name      │           │ • type          │
│ • phone     │           │ • priority      │
│ • address   │           │ • is_read       │
└─────────────┘           └─────────────────┘
```

## 🔗 Penjelasan Relasi

### **Relasi One-to-One (1:1)**
- **User ↔ Driver**: Satu user bisa menjadi satu driver
- **Driver ↔ DriverLocation**: Satu driver punya satu lokasi aktif
- **Order ↔ Payment**: Satu order punya satu payment

### **Relasi One-to-Many (1:N)**
- **User → Orders**: Satu user bisa punya banyak order
- **Driver → Orders**: Satu driver bisa kerjakan banyak order
- **Driver → Withdrawals**: Satu driver bisa punya banyak withdrawal
- **User → Notifications**: Satu user bisa punya banyak notifikasi
- **Tariff → Orders**: Satu tariff bisa digunakan untuk banyak order

### **Relasi Many-to-One (N:1)**
- **Orders → User**: Banyak order bisa dimiliki satu user
- **Orders → Driver**: Banyak order bisa dikerjakan satu driver
- **Orders → Tariff**: Banyak order bisa menggunakan satu tariff
- **Withdrawals → Driver**: Banyak withdrawal bisa dimiliki satu driver
- **Notifications → User**: Banyak notifikasi bisa dimiliki satu user

## 📋 Status Enums

### **User Role**
- `admin` - Administrator sistem
- `customer` - Pelanggan
- `driver` - Pengemudi becak

### **Driver Status**
- `active` - Aktif dan siap menerima order
- `inactive` - Tidak aktif
- `on_trip` - Sedang dalam perjalanan

### **Order Status**
- `pending` - Menunggu konfirmasi
- `accepted` - Diterima driver
- `completed` - Selesai
- `cancelled` - Dibatalkan

### **Payment Status**
- `pending` - Menunggu pembayaran
- `paid` - Sudah dibayar
- `failed` - Gagal
- `refunded` - Dikembalikan

### **Vehicle Type**
- `becak_manual` - Becak manual
- `becak_motor` - Becak motor
- `becak_listrik` - Becak listrik
- `andong` - Andong

## 🎯 Alur Bisnis Utama

1. **Customer** membuat **Order**
2. **Order** menggunakan **Tariff** untuk kalkulasi harga
3. **Driver** menerima dan mengerjakan **Order**
4. **Payment** dibuat untuk **Order**
5. **Driver** bisa melakukan **Withdrawal** dari penghasilan
6. **Notifications** dikirim ke **User** untuk update status
