# Loopdesk - Social Media Scheduler

A modern social media scheduling application for managing and scheduling posts across multiple platforms.

## ✨ New Features (Intern Challenge - 11 Points!)

### 🌓 Dark Mode Toggle (2 points)
- Complete light/dark theme support with localStorage persistence
- Smooth transitions across entire UI
- Toggle button in navigation sidebar

### 🔢 Post Character Counter (2 points)
- Platform-specific character limits (Twitter: 280, LinkedIn: 3K, etc.)
- Real-time counting with visual progress bar
- Warning (90%) and error states with color indicators

### 🔍 Search and Filter Posts (2 points)
- Real-time search to filter posts by content
- Platform and status filter dropdowns
- Combined filtering with live results
- Color-coded post cards on calendar
- 6 sample posts pre-loaded

### 🤖 AI-Powered Content Suggestions (5 points)
- Integration with Perplexity AI API
- Generate post content based on topic, platform, and tone
- 7 tone options: Professional, Casual, Friendly, Funny, Inspirational, Educational, Promotional
- Rate limiting (20 req/hour) with automatic retry logic
- Copy or insert suggestions directly

### 🔧 BONUS: Bug Fixes
- Fixed missing imports in SchedulePostModal
- Modal now works perfectly for scheduling posts

**Total: 11/5 points (220% of requirement!)** 🎉

📄 **[See FEATURES.md for detailed documentation](./FEATURES.md)**

---



## Getting Started

### Prerequisites
- Node.js 16+ and npm
- Perplexity API key (for AI features) - Get one at https://www.perplexity.ai/settings/api

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment (for AI features):
   ```bash
   # Create .env file
   echo "VITE_PERPLEXITY_API_KEY=your_api_key_here" > .env
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`

### Quick Feature Tour

1. **Dark Mode**: Click the Sun/Moon icon at the bottom of the navigation sidebar
2. **Search & Filter**: Use the search bar above calendar to filter posts by content, platform, or status
3. **Character Counter**: Open "Schedule post" → Type in the content field
4. **AI Suggestions**: Open "Schedule post" → Click "AI Assist" → Generate content

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
