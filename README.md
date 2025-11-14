# Loopdesk - Social Media Scheduler

A modern social media scheduling application for managing and scheduling posts across multiple platforms.

## Features

- 📅 **Calendar View** - Visual calendar interface for scheduled posts
- 📊 **Analytics Dashboard** - Track performance metrics across platforms
- 🔗 **Multi-Platform Support** - Support for YouTube, TikTok, LinkedIn, Facebook, Instagram, and X (Twitter)
- ⏰ **Smart Scheduling** - Schedule posts with timezone awareness
- 📹 **Video Management** - Upload and manage video content
- 🎯 **Clip Selection** - Select and schedule specific video clips

## Completed Intern Challenge Features (Ramesh)

I implemented features to reach at least 5 points for the intern challenge. Below are the completed items and notes for submission.

- E2 — Post Character Counter (2 points)

  - Live character counter in the scheduling form.
  - Grapheme-aware counting and platform-specific limits (e.g., X/Twitter 280, Instagram 2200).
  - Schedule button disables when content exceeds platform limit.

- M4 — Post Preview (3 points)
  - Platform-specific post previews in the scheduling form.
  - Improved Instagram preview UI with story-style avatar, image placeholder, caption, and action icons.
  - Preview truncates to platform character limit and shows "View more" when truncated.

Total points: 5

Approach

- Added platform metadata (`src/data/platforms.ts`) with `charLimit` values.
- Implemented `src/lib/postUtils.ts` for grapheme-aware counting and truncation helpers.
- Created `src/components/PostPreview.tsx` with platform renderers and improved Instagram preview.
- Updated `src/components/SchedulingForm.tsx` to show live counter, warning/error states, and wire preview + disable logic.
- Added tests for the utils and scheduling form. All tests pass locally.

Notes

- Tests: run `npm test` or `npx vitest --run` — currently all tests pass locally.
- To view changes: run `npm install` then `npm run dev` and open http://localhost:5173/. Use the Schedule Post flow to see the preview and counter.

Pull Request / Submission

- PR Title: [Intern Challenge] Ramesh - 5 points
- PR Description should include the completed feature list (above), total points (5), and this brief approach summary.
- Hiring form: https://tally.so/r/VLE7rj

If you want, I can create the commit and push a branch, or generate a patch you can apply and open a PR from your GitHub account.

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
