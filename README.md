# FileVault - Modern File Storage & Conversion Platform

A full-stack file storage and document conversion application built with Next.js, featuring user authentication, file management, and document conversion capabilities.

## 🚀 Features

### Core Functionality
- **User Authentication** - Secure registration, login, and JWT-based sessions
- **File Storage** - Upload, organize, and manage files with drag & drop
- **Document Conversion** - Convert between PDF, DOCX, DOC, and other formats
- **File Management** - Preview, download, and delete files
- **Storage Quotas** - Track usage with configurable storage limits

### User Experience
- **Modern UI** - Beautiful, responsive design with dark/light themes
- **Real-time Progress** - Live upload and conversion progress tracking
- **Notifications** - Toast notifications and configurable preferences
- **Search & Filter** - Find files quickly with search functionality

### Security & Performance
- **Secure Authentication** - Password hashing with bcrypt, JWT tokens
- **File Validation** - Type and size validation for uploads
- **API Protection** - Middleware-protected routes with proper error handling
- **Database Optimization** - Efficient queries with Prisma ORM

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Modern component library
- **React Hook Form** - Form handling with validation

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **Prisma** - Database ORM with SQLite
- **JWT** - Authentication tokens
- **Multer** - File upload handling
- **LibreOffice** - Document conversion engine

### Development
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Zod** - Runtime type validation

## 📁 Project Structure

\`\`\`
file-storage-app/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── auth/          # Authentication endpoints
│   │   ├── files/         # File management endpoints
│   │   ├── convert/       # Document conversion endpoints
│   │   ├── user/          # User profile and settings
│   │   └── support/       # Support and contact endpoints
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main application page
├── components/            # React components
│   ├── auth/              # Authentication components
│   ├── ui/                # shadcn/ui components
│   ├── app-sidebar.tsx    # Main navigation sidebar
│   ├── header.tsx         # Application header
│   ├── file-storage.tsx   # File management interface
│   ├── file-upload.tsx    # File upload interface
│   ├── document-converter.tsx # Conversion interface
│   ├── user-profile.tsx   # User profile page
│   ├── settings-page.tsx  # Settings interface
│   └── help-support-page.tsx # Help and support
├── contexts/              # React contexts
│   └── auth-context.tsx   # Authentication state management
├── hooks/                 # Custom React hooks
│   ├── use-api.ts         # API call utilities
│   └── use-toast.ts       # Toast notifications
├── lib/                   # Utility libraries
│   ├── auth.ts            # Authentication utilities
│   ├── database.ts        # Database connection
│   ├── file-storage.ts    # File system operations
│   └── document-converter.ts # Document conversion logic
├── prisma/                # Database schema and migrations
│   └── schema.prisma      # Database schema definition
├── scripts/               # Setup and utility scripts
│   └── setup-database.js  # Database initialization
├── uploads/               # File storage directory
└── README.md              # Project documentation
\`\`\`

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- LibreOffice (for document conversion)

### Installation

1. **Clone the repository**
   \`\`\`bash
   git clone <repository-url>
   cd file-storage-app
   \`\`\`

2. **Install dependencies**
   \`\`\`bash
   npm install
   \`\`\`

3. **Set up environment variables**
   \`\`\`bash
   cp .env.example .env
   # Edit .env with your configuration
   \`\`\`

4. **Initialize the database**
   \`\`\`bash
   npx prisma generate
   npx prisma db push
   node scripts/setup-database.js
   \`\`\`

5. **Install LibreOffice** (for document conversion)
   \`\`\`bash
   # Ubuntu/Debian
   sudo apt-get install libreoffice
   
   # macOS
   brew install --cask libreoffice
   
   # Windows
   # Download from https://www.libreoffice.org/download/
   \`\`\`

6. **Start the development server**
   \`\`\`bash
   npm run dev
   \`\`\`

7. **Open your browser**
   Navigate to `http://localhost:3000`

## 📖 API Documentation

### Authentication Endpoints

#### POST /api/auth/register
Register a new user account.

**Request Body:**
\`\`\`json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword123"
}
\`\`\`

**Response:**
\`\`\`json
{
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "avatar": null
  },
  "token": "jwt_token"
}
\`\`\`

#### POST /api/auth/login
Authenticate an existing user.

**Request Body:**
\`\`\`json
{
  "email": "john@example.com",
  "password": "securepassword123"
}
\`\`\`

### File Management Endpoints

#### GET /api/files
List user's files with optional filtering.

**Query Parameters:**
- `folder` - Filter by folder (default: "/")
- `search` - Search in filenames

**Headers:**
\`\`\`
Authorization: Bearer <jwt_token>
\`\`\`

#### POST /api/files
Upload a new file.

**Request:** Multipart form data
- `file` - File to upload
- `folder` - Target folder (optional)

#### GET /api/files/[id]
Download a specific file.

#### DELETE /api/files/[id]
Delete a specific file.

### Document Conversion Endpoints

#### POST /api/convert
Start a document conversion job.

**Request Body:**
\`\`\`json
{
  "fileId": "file_id",
  "targetFormat": "pdf"
}
\`\`\`

#### GET /api/convert/[id]
Get conversion job status.

#### GET /api/convert/[id]/download
Download converted file.

### User Management Endpoints

#### GET /api/user/profile
Get user profile information.

#### PUT /api/user/profile
Update user profile.

#### GET /api/user/settings
Get user settings.

#### PUT /api/user/settings
Update user settings.

#### GET /api/user/storage
Get storage usage information.

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | Database connection string | `file:./dev.db` |
| `JWT_SECRET` | Secret key for JWT tokens | Required |
| `UPLOAD_DIR` | File upload directory | `./uploads` |
| `MAX_FILE_SIZE` | Maximum file size in bytes | `104857600` (100MB) |
| `SMTP_HOST` | SMTP server for emails | Required for contact form |
| `SMTP_PORT` | SMTP port | `587` |
| `SMTP_USER` | SMTP username | Required for contact form |
| `SMTP_PASS` | SMTP password | Required for contact form |

### File Upload Limits

- **Maximum file size:** 100MB per file
- **Supported formats:** All common file types
- **Storage quota:** 10GB per user (configurable)

### Document Conversion

Supported conversion formats:
- **Word to PDF:** DOC, DOCX → PDF
- **PDF to Word:** PDF → DOCX
- **Text to PDF:** TXT → PDF
- **OpenDocument:** ODT ↔ PDF, DOCX

## 🚀 Deployment

### Production Build

1. **Build the application**
   \`\`\`bash
   npm run build
   \`\`\`

2. **Start production server**
   \`\`\`bash
   npm start
   \`\`\`

### Environment Setup

1. **Database:** Set up a production database (PostgreSQL recommended)
2. **File Storage:** Configure cloud storage (AWS S3, Google Cloud Storage)
3. **Email Service:** Set up SMTP service for notifications
4. **LibreOffice:** Install on production server for conversions

### Security Considerations

- Use strong JWT secrets in production
- Enable HTTPS for all communications
- Implement rate limiting for API endpoints
- Regular security updates for dependencies
- File type validation and virus scanning
- Backup strategies for user data

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation:** Check this README and inline code comments
- **Issues:** Report bugs and feature requests via GitHub Issues
- **Email:** Contact support@filevault.com for direct assistance

## 🎯 Roadmap

### Upcoming Features
- [ ] File sharing with public links
- [ ] Collaborative file editing
- [ ] Advanced file organization (tags, folders)
- [ ] Bulk file operations
- [ ] API rate limiting
- [ ] File versioning
- [ ] Integration with cloud storage providers
- [ ] Mobile app development
- [ ] Advanced analytics and reporting
- [ ] Team collaboration features

### Performance Improvements
- [ ] Implement file chunking for large uploads
- [ ] Add Redis caching for frequently accessed data
- [ ] Optimize database queries with indexing
- [ ] Implement CDN for file delivery
- [ ] Add background job processing for conversions
