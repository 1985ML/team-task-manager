
# Team Task Manager - Phase 1

A comprehensive team task management application built with Next.js, TypeScript, and PostgreSQL.

## 🚀 Features

### Phase 1 - Core Task Management
- **User Authentication**: Secure email/password authentication with NextAuth.js
- **Task Management**: Create, assign, update, and track tasks with priorities and due dates
- **Team Structure**: Create teams and manage team membership
- **Dashboard**: Overview of tasks, team activity, and progress tracking
- **Task Views**: List and Kanban board views for better task visualization
- **Notifications**: In-app notifications for task updates and assignments
- **Comments**: Basic commenting system for task collaboration

### Technical Stack
- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, Radix UI components
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with secure session management
- **State Management**: React hooks with optimistic updates
- **Form Handling**: React Hook Form with Zod validation

## 📋 Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- Yarn package manager

### Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd team_task_manager
```

2. **Install dependencies**
```bash
cd app
yarn install
```

3. **Set up environment variables**
Create a `.env` file in the app directory:
```bash
DATABASE_URL="your_postgresql_connection_string"
NEXTAUTH_SECRET="your_nextauth_secret"
NEXTAUTH_URL="http://localhost:3000"
```

4. **Set up the database**
```bash
yarn prisma generate
yarn prisma db push
```

5. **Seed the database (optional)**
```bash
yarn prisma db seed
```

6. **Start the development server**
```bash
yarn dev
```

The application will be available at `http://localhost:3000`.

## 📁 Project Structure

```
team_task_manager/
├── app/                    # Next.js application root
│   ├── app/               # App router pages
│   │   ├── api/          # API routes
│   │   ├── auth/         # Authentication pages
│   │   ├── dashboard/    # Dashboard pages
│   │   ├── layout.tsx    # Root layout
│   │   └── page.tsx      # Home page
│   ├── components/       # React components
│   │   ├── dashboard/    # Dashboard components
│   │   ├── tasks/        # Task-related components
│   │   └── ui/           # UI components (Radix)
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utility libraries
│   ├── prisma/           # Database schema
│   └── types/            # TypeScript type definitions
├── README.md             # This file
└── .gitignore           # Git ignore rules
```

## 🎯 Key Features Overview

### User Management
- User registration and login
- Profile management
- Team invitation system

### Task Management
- Create tasks with title, description, priority, and due date
- Assign tasks to team members
- Track task status (To Do, In Progress, Completed)
- Task filtering and sorting

### Team Collaboration
- Create and manage teams
- Add team members
- Team-based task visibility
- Activity tracking

### Dashboard & Analytics
- Personal task overview
- Team progress tracking
- Recent activity feed
- Task completion statistics

## 🔐 Authentication & Security

- Secure password hashing with bcryptjs
- JWT-based session management
- Protected API routes
- Role-based access control
- CSRF protection

## 🗄️ Database Schema

### Core Tables
- **Users**: User accounts and profiles
- **Teams**: Team information and settings
- **TeamMembers**: User-team relationships
- **Tasks**: Task details and metadata
- **Comments**: Task comments and discussions
- **Notifications**: User notifications

## 📱 Responsive Design

The application is fully responsive and optimized for:
- Desktop browsers (1200px+)
- Tablets (768px - 1199px)
- Mobile devices (320px - 767px)

## 🚧 Upcoming Features (Phase 2)

- Advanced role-based permissions
- File attachments for tasks
- Real-time collaboration
- Advanced analytics and reporting
- API integrations
- Enhanced notification system
- Bulk task operations
- Custom task templates

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙋‍♂️ Support

For support and questions, please open an issue in the GitHub repository.

---

**Team Task Manager** - Streamlining team productivity, one task at a time.
