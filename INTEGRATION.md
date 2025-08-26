# 🚀 Integrasi Frontend dengan Backend

## 📋 Overview

Frontend React sudah terintegrasi dengan backend Go yang menyediakan API lengkap untuk sistem GreenBecak.

## 🔧 Setup Backend

### 1. Install Dependencies
```bash
cd backend
go mod download
```

### 2. Setup Environment
```bash
cp env.example .env
# Edit .env sesuai konfigurasi database dan server
```

### 3. Setup Database
```bash
# Pastikan MySQL/PostgreSQL sudah running
# Database akan dibuat otomatis saat pertama kali run
```

### 4. Run Backend
```bash
go run main.go
# Server akan berjalan di http://localhost:8080
```

## 🔧 Setup Frontend

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Environment
```bash
cp env.example .env.local
# Edit .env.local untuk konfigurasi API
```

### 3. Run Frontend
```bash
npm run dev
# Frontend akan berjalan di http://localhost:5173
```

## 📡 API Endpoints

### Authentication
- `POST /api/auth/login` - Login user
- `POST /api/auth/register` - Register user
- `GET /api/profile` - Get user profile

### Orders
- `POST /api/orders` - Create order
- `GET /api/orders` - Get all orders
- `GET /api/orders/:id` - Get specific order
- `PUT /api/orders/:id` - Update order
- `DELETE /api/orders/:id` - Delete order

### Driver Specific
- `GET /api/driver/orders` - Get driver orders
- `PUT /api/driver/orders/:id/accept` - Accept order
- `PUT /api/driver/orders/:id/complete` - Complete order
- `GET /api/driver/earnings` - Get driver earnings
- `POST /api/driver/withdrawals` - Create withdrawal
- `GET /api/driver/withdrawals` - Get driver withdrawals
- `POST /api/driver/location` - Update location
- `PUT /api/driver/online-status` - Set online status

### Admin Specific
- `GET /api/admin/users` - Get all users
- `POST /api/admin/drivers` - Create driver
- `GET /api/admin/drivers` - Get all drivers
- `GET /api/admin/analytics` - Get analytics
- `GET /api/admin/withdrawals` - Get withdrawals
- `PUT /api/admin/withdrawals/:id` - Update withdrawal

## 🔐 Authentication Flow

### 1. Login Process
```typescript
// Frontend akan mengirim credentials ke backend
const response = await authAPI.login({ username, password });

// Backend akan mengembalikan JWT token
// Token disimpan di localStorage
localStorage.setItem('authToken', response.token);
```

### 2. Protected Routes
```typescript
// Setiap request akan menyertakan token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### 3. Auto Logout
```typescript
// Jika token expired, user akan otomatis logout
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);
```

## 📊 Data Flow

### 1. Order Creation
```typescript
// Customer membuat order
const orderData = {
  pedicabCode: "GT-001",
  distanceOption: { id: "dekat", price: 10000 },
  whatsappNumber: "08123456789"
};

await ordersAPI.createOrder(orderData);
```

### 2. Driver Accept Order
```typescript
// Driver menerima order
await driverAPI.acceptOrder(orderId);
```

### 3. Driver Complete Order
```typescript
// Driver menyelesaikan order
await driverAPI.completeOrder(orderId);
```

## 🎯 Features yang Sudah Terintegrasi

### ✅ Authentication
- Login admin/driver dengan backend
- JWT token management
- Auto logout saat token expired
- Protected routes

### ✅ Orders Management
- Create order dari customer
- Accept/complete order dari driver
- Real-time order status updates

### ✅ Driver Features
- View available orders
- Accept/complete orders
- Earnings tracking
- Withdrawal requests
- Location tracking

### ✅ Admin Features
- User management
- Driver management
- Analytics dashboard
- Withdrawal approval
- Order monitoring

## 🚨 Error Handling

### Frontend Error Handling
```typescript
try {
  await api.someEndpoint();
} catch (error: any) {
  const message = error.response?.data?.message || 'Terjadi kesalahan';
  setError(message);
}
```

### Backend Error Response
```json
{
  "error": true,
  "message": "Deskripsi error",
  "code": "ERROR_CODE"
}
```

## 🔧 Development Tips

### 1. Environment Variables
```bash
# .env.local
VITE_API_URL=http://localhost:8080/api
VITE_DEV_MODE=true
```

### 2. CORS Configuration
Backend sudah dikonfigurasi untuk menerima request dari:
- `http://localhost:3000`
- `http://localhost:5173`

### 3. API Testing
Gunakan tools seperti Postman atau curl untuk test API:
```bash
# Test login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### 4. Database Seeding
Backend menyediakan data seeding untuk testing:
```bash
# Data default akan dibuat otomatis
# Admin: admin/admin123
# Driver: driver1/driver123
```

## 🚀 Deployment

### Backend Deployment
```bash
# Build binary
go build -o greenbecak-backend

# Run with environment variables
SERVER_PORT=8080 DATABASE_URL=... ./greenbecak-backend
```

### Frontend Deployment
```bash
# Build for production
npm run build

# Deploy ke Vercel/Netlify
# Pastikan environment variables sudah diset
```

## 📝 Notes

1. **Backend harus running** sebelum frontend bisa berfungsi penuh
2. **Database harus setup** dengan schema yang benar
3. **Environment variables** harus dikonfigurasi dengan benar
4. **CORS** sudah dikonfigurasi untuk development
5. **JWT tokens** akan expired sesuai konfigurasi backend

## 🔍 Troubleshooting

### Common Issues

1. **CORS Error**
   - Pastikan backend running di port 8080
   - Check CORS configuration di backend

2. **401 Unauthorized**
   - Token expired atau invalid
   - Check localStorage untuk authToken

3. **500 Server Error**
   - Check backend logs
   - Verify database connection
   - Check environment variables

4. **Network Error**
   - Verify API URL di .env.local
   - Check if backend is running
   - Check firewall/network settings
