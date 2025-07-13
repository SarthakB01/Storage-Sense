# Storage Sense - Modern File Storage & Conversion Platform

A full-stack file storage and document conversion application built with Next.js, featuring user authentication, file management, and **cloud-based document conversion** (CloudConvert API).

---

## 🚀 Features

- **User Authentication:** Register, login, JWT-based sessions.
- **File Storage:** Upload, download, delete, and organize files.
- **Document Conversion:** Convert between PDF, DOCX, DOC, XLSX, PPTX, ODT, RTF, images, and more using CloudConvert.
- **Conversion Progress:** Real-time status and progress for each conversion job.
- **Conversion History:** View and download past conversions.
- **Storage Quotas:** Per-user storage limits with detailed usage breakdown and optimization suggestions.
- **Modern UI:** Responsive, dark/light themes, toasts, sidebar navigation.
- **Support & Help:** Contact form and help page.

---

## 🛠️ Tech Stack

- **Frontend:** Next.js (App Router), React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** Next.js API routes, Prisma ORM, SQLite (dev), CloudConvert API
- **Authentication:** JWT, context-managed on frontend
- **File Storage:** Local `uploads/` directory (can be adapted for cloud)
- **Conversion:** CloudConvert API (no local LibreOffice dependency)

---

## 📁 Project Structure

```
file-storage-app/
├── app/                    # Next.js App Router
│   ├── api/               # API routes (auth, files, convert, user, support)
│   ├── ...                # Layout, pages, styles
├── components/            # React components (auth, UI, file mgmt, converter, etc.)
├── contexts/              # React contexts (auth)
├── hooks/                 # Custom React hooks
├── lib/                   # Utility libraries (auth, db, file-storage, document-converter)
├── prisma/                # Database schema and migrations
├── scripts/               # Setup and utility scripts
├── uploads/               # File storage directory
└── README.md              # Project documentation
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm or pnpm
- **CloudConvert API key** (sign up at [cloudconvert.com](https://cloudconvert.com/))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/SarthakB01/Storage-Sense
   cd file-storage-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration, including CLOUDCONVERT_API_KEY
   ```

4. **Initialize the database**
   ```bash
   npx prisma generate
   npx prisma db push
   node scripts/setup-database.js
   ```

5. **Start the development server**
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:3000`

---

## 📖 API Documentation

### Authentication Endpoints

- `POST /api/auth/register` — Register a new user
- `POST /api/auth/login` — Login and receive JWT

### File Management Endpoints

- `GET /api/files` — List user files
- `POST /api/files` — Upload file (multipart/form-data)
- `GET /api/files/[id]` — Download file
- `DELETE /api/files/[id]` — Delete file

### Document Conversion Endpoints

- `POST /api/convert` — Start a conversion job (uses CloudConvert)
- `GET /api/convert/[id]` — Get job status
- `GET /api/convert/[id]/download` — Download converted file

### User & Storage Endpoints

- `GET /api/user/profile` — Get user profile
- `PUT /api/user/profile` — Update profile
- `GET /api/user/settings` — Get user settings
- `PUT /api/user/settings` — Update settings
- `GET /api/user/storage` — Get storage usage, breakdown, and suggestions

---

## 🔧 Configuration

### Environment Variables

| Variable                | Description                        | Default         |
|-------------------------|------------------------------------|-----------------|
| `DATABASE_URL`          | Database connection string         | `file:./dev.db` |
| `JWT_SECRET`            | Secret key for JWT tokens          | Required        |
| `UPLOAD_DIR`            | File upload directory              | `./uploads`     |
| `CLOUDCONVERT_API_KEY`  | CloudConvert API key               | Required        |
| ...                     | ...                                | ...             |

---

## 🚀 Deployment

- See the original README for production build and deployment steps.
- **Note:** You do NOT need LibreOffice for conversion; all conversions are handled via CloudConvert API.

---

## 🆘 Support

- **Documentation:** This README and inline code comments
- **Issues:** GitHub Issues
- **Email:** support@storagesense.com

---

## 🎯 Roadmap

- File sharing, collaboration, advanced analytics, mobile app, and more (see original roadmap).
