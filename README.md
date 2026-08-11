# Tophat Financial

Tophat Financial is a comprehensive, highly interactive personal finance and tactical portfolio planner. It enables users to project their income, visualize their savings trajectory, plan for college expenses, and dynamically allocate their tactical portfolio—all synchronized securely with a serverless backend.

## 🚀 Core Modules

- **Income Planner**: Project your take-home pay, savings, and capital income over a 25-year horizon with advanced, customizable auto-escalation toggles ("Save Your Raise").
- **Savings Planner**: Work backwards from your desired retirement income to calculate the exact required monthly contributions needed today.
- **College Planner**: Dynamically switch between "Target Goal" and "Monthly Contribution" modes to seamlessly balance your 529 education planning.
- **Deployment Dashboard**: A robust tactical allocation module that calculates asset weightings, highlights real-time rebalancing requirements, and visualizes your portfolio health against your targets.

## 🛠️ Tech Stack

- **Frontend Framework**: Next.js (React), written in TypeScript
- **Styling & UI**: Tailwind CSS, beautifully crafted with `shadcn/ui` components
- **Data Visualization**: Recharts for dynamic, responsive charting
- **Backend Infrastructure**: Firebase Authentication, Cloud Firestore
- **API/Functions**: Handled by the companion Python Gen-2 Cloud Functions backend (`plannerpy`)

## 🏗️ Local Development

### Prerequisites
- Node.js (v18+)
- npm 

### Quick Start
1. **Install dependencies**
   ```bash
   npm install
   ```
2. **Set up Environment Variables**
   Create a `.env.local` file at the root of the project with your Firebase configuration:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```
3. **Run the development server**
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) to view the application in your browser.

## 🤝 Architecture Notes
This repository contains the frontend Tophat application. The accompanying serverless Python backend (`plannerpy`) handles all backend logic, enforcing strict user-auth isolation and managing the nested Firestore subcollection architecture.

---
*Built for financial clarity and independence.*
