# MeterMate Admin Dashboard

A Next.js web application for managing meter reading jobs and personnel.

## Features

- **Authentication**: Login system with role-based access (Admin/Meter Reader)
- **House Management**: CRUD operations for house addresses with UK demo data
- **Job Assignment**: Assign jobs to meter reading personnel
- **Job Tracking**: Monitor job status and progress
- **Dashboard**: Overview of houses, jobs, and users

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env.local` file:
```
MONGODB_URI=mongodb://localhost:27017/metermate
JWT_SECRET=fce832cd907fc4f134f1cd1b8d34d54096cd27fb4978ccb0c6f2e73fcf90dd2466fdf727f9270d5ee4dadaab4b032e683ec2297d127e0e16bde5757ae4963f3a
NEXT_PUBLIC_API_URL=http://localhost:3000
```

3. Start the development server:
```bash
npm run dev
```

## Database Models

- **User**: Meter reading personnel and admins
- **House**: UK addresses with coordinates for mapping
- **Job**: Assigned tasks with status tracking

## API Endpoints

- `POST /api/auth/login` - User authentication
- `GET /api/auth/profile` - Get user profile
- `POST /api/auth/logout` - User logout
- `GET /api/houses` - List houses
- `POST /api/houses` - Create house
- `GET /api/jobs` - List jobs
- `POST /api/jobs` - Create job

## Mobile App Integration

The mobile app connects to the same database and can:
- View assigned jobs
- Update job status
- Access Google Maps for navigation
- Submit meter readings
