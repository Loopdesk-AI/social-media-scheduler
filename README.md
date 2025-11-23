# Loopdesk - Social Media Scheduler

A modern social media scheduling application for managing and scheduling posts across multiple platforms.

## Features

- 📅 **Calendar View** - Visual calendar interface for scheduled posts
- 📊 **Analytics Dashboard** - Track performance metrics across platforms
- 🔗 **Multi-Platform Support** - Support for YouTube, TikTok, LinkedIn, Facebook, Instagram, and X (Twitter)
- ⏰ **Smart Scheduling** - Schedule posts with timezone awareness
- 📹 **Video Management** - Upload and manage video content
- 🎯 **Clip Selection** - Select and schedule specific video clips

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open your browser and navigate to `http://localhost:5173`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Tech Stack

- React 18 with TypeScript
- Vite for fast development
- Tailwind CSS for styling
- React Router for navigation
- Recharts for analytics visualization
- Lucide React for icons

## Project Structure

```
src/
├── components/     # React components
├── data/          # Mock data and constants
├── types/         # TypeScript type definitions
├── lib/           # Utility functions
├── App.tsx        # Main application component
└── index.tsx      # Application entry point
```




# Loopdesk - Social Media Scheduler

A modern React + TypeScript application for managing and scheduling posts across multiple social media platforms, including LinkedIn,Instagram and X (Twitter).

---

## Project Overview

This application allows users to:

- Schedule posts across multiple platforms
- Preview posts with platform-specific formatting
- Track post analytics
- Export scheduled posts
- Use templates for frequently used post formats

---

## Getting Started

### Prerequisites

- Node.js v18+  
- npm v9+  

### Installation

1. Clone the repository:

```bash
git clone https://github.com/Loopdesk-AI/social-media-scheduler.git
cd social-media-scheduler

    Install dependencies:

npm install

    Start the development server:

npm run dev

    Open your browser and navigate to http://localhost:5173.

Scripts

    npm run dev – Start development server

    npm run build – Build production version

    npm run preview – Preview production build

    npm run lint – Run ESLint

Tech Stack

    React 18 with TypeScript

    Vite for fast development

    Tailwind CSS for styling

    React Router for navigation

    Recharts for analytics

    Lucide React for icons

Project Structure

src/
├── components/   # Reusable React components
├── context/      # React Context providers
├── data/         # Mock data and constants
├── types/        # TypeScript type definitions
├── lib/          # Utility functions
├── App.tsx       # Main application component
└── index.tsx     # Entry point

Intern Challenge – Noble Biju

Total Points: 14
E1 – Dark Mode Toggle (2 points)

    Toggle in header with theme persisted in localStorage

    Smooth toggle applied across all UI components

E2 – Post Character Counter (2 points)

    Real-time character counter for posts

    Platform-specific limits (Twitter/X: 280, LinkedIn: 3000, Instagram: 2200)

    Warning at 90% and error state at limit exceeded

E3 – Export Scheduled Posts to CSV (2 points)

    Export button in Calendar View

    CSV includes: Date, Time, Platform, Status, Content

E4 – Search & Filter Posts (2 points)

    Search posts by content

    Filter by platform and status (scheduled, published, draft)

    Real-time updates with responsive UI

M2 – Post Templates Library (3 points)

    Full CRUD support for templates

    Variables supported: {DATE}, {PLATFORM}, {USERNAME}

    Apply templates directly in SchedulePostModal

M4 – Platform Preview (3 points)

    Live preview for Twitter/X, LinkedIn, and Instagram

    Reflects character limits and formatting

    Responsive design for all screen sizes

    Screenshots for each feature are attached in the PR comments.

Notes

    LocalStorage is used for template persistence and dark mode preference.

    The project follows TypeScript best practices with strict type definitions.

    All new features are tested for functional correctness.
