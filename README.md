# 🧊 FRESHGUARD — Hệ thống Giám sát Kho Lạnh IoT

FreshGuard là hệ thống quản lý và giám sát kho lạnh thông minh theo thời gian thực, sử dụng cảm biến IoT kết nối qua MQTT (Adafruit IO). Hệ thống cho phép theo dõi nhiệt độ, độ ẩm, cảnh báo tự động và điều khiển thiết bị từ xa thông qua dashboard web.

---

## 🗂️ Cấu trúc Project

```
Ung_dung_quan_li_kho_lanh-main/
├── backend/       # NestJS REST API + WebSocket + MQTT
└── frontend/      # React + Vite Dashboard
```

---

## ✨ Tính năng chính

- 📊 **Dashboard tổng quan** — theo dõi trạng thái tất cả kho lạnh
- 🌡️ **Giám sát thời gian thực** — nhiệt độ & độ ẩm từ cảm biến qua MQTT + WebSocket
- 🔔 **Cảnh báo tự động** — phát hiện và ghi log khi vượt ngưỡng cho phép
- 🎛️ **Điều khiển thiết bị** — bật/tắt thiết bị từ xa (có cooldown chống spam)
- ⏰ **Lịch hẹn tự động** — lên lịch bật/tắt thiết bị theo giờ
- 📁 **Quản lý kho & khu vực** — phân cấp Kho → Khu vực → Thiết bị
- 🍱 **Quản lý loại thực phẩm** — lưu quy tắc bảo quản theo từng loại thực phẩm
- 👥 **Phân quyền người dùng** — Admin và Operator với quyền hạn khác nhau
- 📈 **Lịch sử & Báo cáo** — xem lịch sử cảm biến, xuất file CSV
- 🔌 **WebSocket** — cập nhật dữ liệu live không cần refresh trang

---

## 🛠️ Tech Stack

| Phần | Công nghệ |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, Recharts, Socket.IO Client |
| Backend | NestJS, TypeORM, MySQL, MQTT (Adafruit IO), Socket.IO |
| Database | MySQL |
| IoT Broker | Adafruit IO (MQTT) |

---

## ⚙️ Yêu cầu hệ thống

- Node.js >= 18
- MySQL >= 8.0
- Tài khoản [Adafruit IO](https://io.adafruit.com) (để nhận dữ liệu cảm biến)

---

## 🚀 Hướng dẫn cài đặt

### 1. Clone project

```bash
git clone https://github.com/EThanose2/Ung_dung_quan_li_kho_lanh.git
cd Ung_dung_quan_li_kho_lanh-main
```

### 2. Cài đặt Database

Tạo database MySQL và import file SQL có sẵn:

```bash
mysql -u root -p -e "CREATE DATABASE freshguard;"
mysql -u root -p freshguard < backend/database/freshguard.sql
```

### 3. Cài đặt Backend

```bash
cd backend
npm install
```

Tạo file `.env` trong thư mục `backend/`:

```env
PORT=3000

# MySQL
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_password
DB_NAME=freshguard

# Adafruit IO (MQTT)
ADAFRUIT_USERNAME=your_adafruit_username
ADAFRUIT_KEY=your_adafruit_key
```

> ⚠️ Sau khi tạo `.env`, cập nhật lại `src/app.module.ts` để đọc từ biến môi trường thay vì hardcode.

Chạy backend:

```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

Backend chạy tại: `http://localhost:3000`

### 4. Cài đặt Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend chạy tại: `http://localhost:5173`

---

## 🧪 Chạy Tests (Backend)

```bash
cd backend

# Unit tests
npm run test

# Unit tests với coverage report
npm run test:cov

# E2E tests (cần DB đang chạy)
npm run test:e2e

# Watch mode (tự chạy lại khi code thay đổi)
npm run test:watch
```

> ⚠️ E2E test yêu cầu MySQL và MQTT đang hoạt động. Nên chạy unit test trước để kiểm tra nhanh.

---

## 📡 API Endpoints

### Auth
| Method | Endpoint | Mô tả |
|---|---|---|
| POST | `/api/auth/login` | Đăng nhập |
| POST | `/api/auth/logout` | Đăng xuất |

### Warehouses & Areas
| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/api/warehouses` | Danh sách kho |
| GET | `/api/warehouses/dashboard` | Dữ liệu dashboard tổng quan |
| POST | `/api/warehouses` | Tạo kho mới |
| PUT | `/api/warehouses/:id` | Cập nhật kho |
| DELETE | `/api/warehouses/:id` | Xóa kho |
| GET | `/api/areas` | Danh sách khu vực |
| POST | `/api/areas` | Tạo khu vực |
| PUT | `/api/areas/:id/settings` | Cập nhật ngưỡng cảnh báo |

### Devices (IoT)
| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/api/devices` | Danh sách thiết bị |
| POST | `/api/devices` | Thêm thiết bị |
| PUT | `/api/devices/:id` | Cập nhật thiết bị |
| DELETE | `/api/devices/:id` | Xóa thiết bị |
| POST | `/api/devices/control` | Điều khiển thiết bị (bật/tắt) |

### Telemetry & Logs
| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/api/sensors/history` | Lịch sử dữ liệu cảm biến |
| GET | `/api/sensors/export` | Xuất CSV |
| GET | `/api/action-logs` | Nhật ký hành động |
| GET | `/api/alert-logs` | Nhật ký cảnh báo |

---

## 👤 Phân quyền

| Role | Quyền hạn |
|---|---|
| **ADMIN** | Toàn quyền: quản lý kho, khu vực, thiết bị, người dùng |
| **OPERATOR** | Chỉ xem và điều khiển các khu vực được phân công |

---

## 📁 Cấu trúc thư mục Backend

```
backend/src/
├── auth/          # Đăng nhập, phân quyền
├── users/         # Quản lý người dùng
├── facilities/    # Kho lạnh, khu vực, loại thực phẩm
├── iot/           # Thiết bị IoT, lịch hẹn
├── telemetry/     # Dữ liệu cảm biến, logs, báo cáo
├── mqtt/          # Kết nối MQTT Adafruit IO
├── gateway/       # WebSocket Gateway (Socket.IO)
└── entities/      # TypeORM Entities (DB schema)
```

---

## 📁 Cấu trúc thư mục Frontend

```
frontend/src/app/
├── pages/         # Các trang: Dashboard, Warehouse, Device, Alerts...
├── components/    # UI components dùng chung
├── api/           # Axios API calls
├── store.ts       # State management
└── routes.tsx     # Cấu hình routing
```

---

## 📝 Lưu ý

- File `.env` chứa thông tin nhạy cảm, **không commit lên GitHub**. Đảm bảo `.env` đã có trong `.gitignore`.
- Hiện tại password được lưu dạng plaintext (phù hợp cho đồ án). Production nên dùng `bcrypt`.
- `synchronize: false` trong TypeORM config — schema DB được quản lý bằng file SQL, không tự động tạo/sửa bảng.
