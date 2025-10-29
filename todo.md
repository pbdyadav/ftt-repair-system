FTT Repairing Management System - Development Plan
Core Features to Implement:
1. Authentication & Layout
src/components/Layout.tsx - Main layout with navigation
src/pages/Login.tsx - Staff login page
src/contexts/AuthContext.tsx - Authentication context
src/lib/auth.ts - Authentication utilities
2. Job Management
src/pages/Dashboard.tsx - Job list/dashboard with filters
src/pages/NewJob.tsx - New job entry form
src/components/JobCard.tsx - Individual job display component
src/components/JobForm.tsx - Reusable job form component
3. Data & State Management
src/lib/database.ts - Database operations (localStorage for MVP)
src/lib/whatsapp.ts - WhatsApp notification utilities
src/types/job.ts - TypeScript interfaces
src/lib/jobUtils.ts - Job number generation and utilities
4. UI Updates
Update src/pages/Index.tsx - Landing/welcome page
Update index.html - App title and branding
Update src/index.css - Custom styles for branding
MVP Implementation Strategy:
Use localStorage for data persistence (can be upgraded to Supabase later)
Simulate WhatsApp notifications with browser notifications/alerts
Simple authentication with hardcoded staff credentials
Focus on core functionality first
File Structure:
Keep all components modular and reusable
Use TypeScript interfaces for type safety
Implement responsive design with Tailwind CSS
Use Royal Blue (#0047AB) as primary color theme