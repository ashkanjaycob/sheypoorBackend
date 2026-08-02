# Anabri Platform API

بک‌اند Node.js/Express روی **MySQL 8** با Sequelize.

---

## 1. اجرا در لوکال

### پیش‌نیاز

فقط **Docker Desktop** و **Node.js 20+**. لازم نیست MySQL را روی سیستم نصب کنید.

### مرحله به مرحله

```bash
# ۱. نصب پکیج‌ها
npm install

# ۲. بالا آوردن MySQL (و Adminer روی http://localhost:8080)
docker compose up -d

# ۳. ساخت فایل .env — اگر ندارید:
cp .env.example .env
# مقدار JWT_SECRET_KEY را حتما عوض کنید

# ۴. اجرای سرور (جداول خودکار ساخته می‌شوند)
npm run dev
```

سرور روی `http://localhost:3403` بالا می‌آید و باید ببینید:

```
✅ connected to MySQL.
✅ tables are ready.
🚀 Server is running at: http://localhost:3403
```

### داده‌ی نمونه (اختیاری)

```bash
npm run db:seed     # چند دسته‌بندی و آپشن نمونه می‌سازد
```

### اتصال به MySQL

| | |
|---|---|
| Host | `127.0.0.1` |
| Port | `3306` |
| User / Pass | `sheypoor` / `sheypoor` |
| Database | `sheypoor` |
| Root pass | `root` |

از طریق ترمینال:

```bash
docker exec -it sheypoor-mysql mysql -usheypoor -psheypoor sheypoor
```

یا رابط گرافیکی Adminer: <http://localhost:8080> (سرور را `mysql` بگذارید).

اگر MySQL را مستقیم روی مک نصب کرده‌اید، به‌جای مرحله ۲ فقط `MYSQL_*` را در `.env` به تنظیمات خودتان تغییر دهید.

### دستورات مفید

```bash
docker compose logs -f mysql   # لاگ دیتابیس
docker compose down            # خاموش کردن
docker compose down -v         # خاموش + پاک کردن کل داده‌ها
```

---

## 2. تست کردن روت‌ها

```bash
# ۱. ارسال کد
curl -X POST localhost:3403/auth/send-otp \
  -H 'Content-Type: application/json' -d '{"mobile":"09120000001"}'
```

اگر `MELI_TOKEN` در `.env` خالی باشد، کد در **کنسول سرور** چاپ می‌شود و پیامک واقعی ارسال نمی‌شود (مناسب توسعه).

```bash
# ۲. گرفتن توکن
curl -X POST localhost:3403/auth/check-otp \
  -H 'Content-Type: application/json' -d '{"mobile":"09120000001","code":"12345"}'

# ۳. استفاده از توکن
curl localhost:3403/user/whoami -H "Authorization: Bearer <accessToken>"
```

مستندات کامل: <http://localhost:3403/swagger>

⚠️ برای پارامترهای فارسی در URL از `curl -G --data-urlencode` استفاده کنید،
وگرنه curl بایت خام می‌فرستد و Node درخواست را با `400` رد می‌کند:

```bash
curl -G localhost:3403/ --data-urlencode "search=پراید"
```

### فهرست روت‌ها

| Method | Path | Auth |
|---|---|:--:|
| GET | `/health` | – |
| GET | `/` (لیست آگهی + `?category=&search=`) | – |
| POST | `/auth/send-otp` | – |
| POST | `/auth/check-otp` | – |
| POST | `/auth/check-refresh-token` | – |
| GET | `/auth/logout` | ✅ |
| GET | `/user/whoami` | ✅ |
| GET | `/category` | – |
| POST | `/category` | ✅ |
| DELETE | `/category/:id` | ✅ |
| GET | `/option`, `/option/:id` | – |
| GET | `/option/by-category/:categoryId` | – |
| GET | `/option/by-category-slug/:slug` | – |
| POST | `/option` | ✅ |
| PUT | `/option/:id` | ✅ |
| DELETE | `/option/:id` | ✅ |
| GET | `/post/create` (`?slug=`) | ✅ |
| POST | `/post/create` (multipart، حداکثر ۱۰ عکس ۳MB) | ✅ |
| GET | `/post/my` | ✅ |
| GET | `/post/:id` | – |
| DELETE | `/post/delete/:id` | ✅ |

---

## 3. دیپلوی روی Render (پلن رایگان)

### ⚠️ Render دیتابیس MySQL ندارد

Render فقط PostgreSQL رایگان دارد. برای MySQL از یک سرویس بیرونی استفاده کنید:

| سرویس | پلن رایگان |
|---|---|
| [Aiven for MySQL](https://aiven.io) | ۱ ماه رایگان، بعد پولی |
| [Railway](https://railway.app) | اعتبار ماهانه رایگان |
| [Clever Cloud](https://clever-cloud.com) | MySQL رایگان ۱۰MB |
| [FreeSQLDatabase](https://freesqldatabase.com) | رایگان، محدود |

### مراحل

1. پروژه را روی GitHub پوش کنید (فایل `.env` نباید پوش شود — در `.gitignore` هست).
2. در Render: **New → Web Service** → ریپو را انتخاب کنید.
3. Runtime را روی **Docker** بگذارید (فایل `Dockerfile` آماده است).
4. Health Check Path را `/health` بگذارید.
5. در بخش Environment این متغیرها را اضافه کنید:

```
NODE_ENV=production
DATABASE_URL=mysql://user:pass@host:3306/dbname
DB_SSL=true
JWT_SECRET_KEY=<یک رشته‌ی تصادفی بلند>
COOKIE_SECRET_KEY=<یک رشته‌ی تصادفی بلند>
MAP_IR_URL=https://map.ir/reverse/no
MAP_API_KEY=<کلید map.ir>
MELI_TOKEN=<توکن ملی‌پیامک>
```

`PORT` را دستی ست نکنید — Render خودش تزریق می‌کند.

فایل `render.yaml` هم موجود است اگر بخواهید از Blueprint استفاده کنید.

### تست ایمیج داکر در لوکال

```bash
docker build -t sheypoor-api .
docker run --rm -p 3999:3999 --network sheypoorbackend_default \
  -e PORT=3999 \
  -e DATABASE_URL="mysql://sheypoor:sheypoor@mysql:3306/sheypoor" \
  -e JWT_SECRET_KEY=dev-secret \
  sheypoor-api
```

---

## 4. نکات مهم پلن رایگان Render

- **فایل‌ها پاک می‌شوند.** دیسک Render موقتی است، پس عکس‌های آپلودشده در `public/upload`
  با هر ری‌استارت یا دیپلوی از بین می‌روند. برای پروداکشن باید به S3 / Cloudinary / Liara منتقل شوند.
- **خواب می‌رود.** سرویس بعد از ۱۵ دقیقه بی‌کاری می‌خوابد و درخواست بعدی ~۵۰ ثانیه طول می‌کشد.
- جداول با `sequelize.sync()` ساخته می‌شوند. برای تغییرات ساختاری جدی بهتر است بعدا migration اضافه کنید.

---

## 5. ساختار پروژه

```
main.js                     نقطه‌ی شروع
src/
├── app.routes.js           اتصال روترها
├── config/
│   ├── database.config.js  اتصال Sequelize به MySQL
│   └── swagger.config.js
├── models/index.js         تعریف روابط + sync
├── common/
│   ├── guard/              میدلور احراز هویت (JWT)
│   ├── exception/          هندلرهای 404 و خطا
│   └── utils/              multer، map.ir، ولیدیتور شناسه
└── modules/
    ├── auth/     ارسال/بررسی OTP، refresh token
    ├── user/     whoami
    ├── category/ درخت دسته‌بندی
    ├── option/   آپشن‌های هر دسته
    └── post/     آگهی‌ها
scripts/seed.js             داده‌ی نمونه
```
