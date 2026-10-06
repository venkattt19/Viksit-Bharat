# Viksit Bharat - Rural Work Monitoring System

A comprehensive government work monitoring system designed for three-tier administration (Village, Block, and District officers) to manage rural development projects with real-time face recognition, fraud detection, and approval workflows.

## Features

### Core Modules

1. **Worker Registration**
   - Real-time face capture using device camera
   - Unique Worker ID generation (VB-YYYY-XXXXX format)
   - Comprehensive worker profile management
   - Bank account details for wage payments

2. **Face Recognition Attendance**
   - Daily attendance marking with face verification
   - GPS location tracking for check-in/check-out
   - Face match scoring system
   - Attendance type classification (present, half-day, absent)

3. **Project Management**
   - Create and track rural development projects
   - Project types: road, canal, building, etc.
   - Budget tracking and timeline management
   - Multi-status workflow (planned, active, completed, suspended)

4. **Work Progress Submission**
   - Upload geotagged images of work completed
   - Worker count and work description
   - Measurement tracking
   - Location verification

5. **Multi-Level Approval Workflow**
   - Three-tier approval system
   - Level 1: Village Officer
   - Level 2: Block Officer
   - Level 3: District Officer
   - Comments and rejection reasons

6. **Wage Calculation**
   - Automated wage calculation based on attendance
   - Daily rate configuration
   - Deduction management
   - Payment tracking with reference numbers

7. **AI-Powered Fraud Detection**
   - Real-time fraud analysis using Databricks
   - Multiple fraud detection algorithms:
     - Face match verification
     - Location mismatch detection
     - Unusual wage patterns
     - Missing evidence checks
   - Severity-based alert system (low, medium, high, critical)

8. **Real-Time Dashboards**
   - Role-based data visualization
   - Key metrics and statistics
   - Pending approvals tracking
   - Quick action buttons

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Real-time**: Supabase Realtime
- **Storage**: Supabase Storage
- **Edge Functions**: Supabase Edge Functions (Deno)
- **AI Processing**: Databricks (via Edge Function)
- **Icons**: Lucide React

## Database Schema

### Main Tables

- **officers** - Government officials with role-based access
- **workers** - Registered workers/farmers
- **worker_face_data** - Face recognition embeddings
- **projects** - Rural development projects
- **attendance** - Daily attendance records
- **work_progress** - Work submissions with images
- **approvals** - Multi-level approval workflow
- **wages** - Wage calculations and payments
- **fraud_alerts** - AI-generated fraud alerts
- **audit_logs** - Complete system audit trail

### Storage Buckets

- **worker-faces** - Worker face ID images
- **work-progress-images** - Geotagged work photos
- **attendance-photos** - Attendance verification photos

## User Roles

### 1. Village Officer
- Register workers in their village
- Mark daily attendance
- Submit work progress
- Manage village-level projects
- View village-specific data

### 2. Block Officer
- Oversee multiple villages
- Approve village-level submissions
- Create block-level projects
- Monitor block-wide activities

### 3. District Officer
- District-wide oversight
- Final approval authority
- View all district data
- Monitor fraud alerts
- Generate reports

## Security Features

- Row Level Security (RLS) on all tables
- Role-based data access
- Jurisdiction-based filtering
- Encrypted face data storage
- Audit logging for all operations
- Secure file upload policies

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Supabase account and project
- Environment variables configured

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables in `.env`:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. Run the development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
```

## Fraud Detection

The system includes an Edge Function (`fraud-detection`) that integrates with Databricks for AI-powered fraud detection:

- **Face Match Verification**: Flags low confidence face matches
- **Location Verification**: Detects attendance from incorrect locations
- **Wage Anomalies**: Identifies unusual wage calculations
- **Evidence Checks**: Ensures proper documentation

To enable Databricks integration, configure these environment variables:
- `DATABRICKS_TOKEN` - Your Databricks API token
- `DATABRICKS_ENDPOINT` - Your Databricks model endpoint

The system works with mock fraud detection by default if Databricks is not configured.

## Key Workflows

### Worker Registration Flow
1. Officer opens Workers page
2. Clicks "Register Worker"
3. Captures face photo using camera
4. Fills in worker details
5. System generates unique Worker ID
6. Face data stored for future verification

### Attendance Flow
1. Officer selects project and date
2. Captures worker's face photo
3. System matches face against registered data
4. Records GPS location
5. Marks attendance with confidence score
6. Fraud detection runs in background

### Approval Flow
1. Village officer submits work progress
2. Creates approval request (Level 1)
3. Block officer reviews and approves (Level 2)
4. District officer final approval (Level 3)
5. Upon approval, wages can be calculated

### Wage Payment Flow
1. System calculates wages based on attendance
2. Creates wage record with deductions
3. Requires approval workflow
4. Payment processed with reference number
5. Audit trail maintained

## Architecture Highlights

- **Real-time Updates**: Supabase Realtime for live data sync
- **Offline Support**: Progressive Web App capabilities
- **Responsive Design**: Mobile-first approach
- **Type Safety**: Full TypeScript coverage
- **Security First**: RLS policies on all data access

## Development

### Project Structure

```
src/
├── components/        # Reusable UI components
├── context/          # React Context providers
├── lib/              # Utility libraries
├── pages/            # Page components
├── types/            # TypeScript type definitions
└── App.tsx           # Main application component

supabase/
└── functions/        # Edge Functions
    └── fraud-detection/  # Fraud detection service
```

## Support

For issues or questions, contact the development team or refer to the technical documentation.

## License

Government of India - Internal Use Only
