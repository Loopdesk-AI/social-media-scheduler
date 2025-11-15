# Features Overview

This document provides a high-level overview of implemented features in the Social Media Scheduler application.

---

## E1: Dark Mode Toggle ✅

**Difficulty:** EASY  
**Status:** Fully Implemented & Tested

### Description

A theme toggle system that allows users to switch between light and dark modes with automatic persistence.

### Key Features

- **Theme Switching**: Seamless toggle between light and dark themes
- **Persistent Storage**: Theme preference saved to `localStorage`
- **System Preference Detection**: Respects `prefers-color-scheme` media query
- **DOM Integration**: Automatically updates `data-theme` attribute on document root
- **React Context**: Global theme state management via `ThemeProvider`

### Implementation Details

- **Components**: `ThemeContext.tsx`, `useTheme.tsx`
- **Storage Key**: `theme-preference`
- **Default**: Light theme (or system preference if available)
- **Theme Values**: `'light'` | `'dark'`

### Testing

**Location:** `src/tests/E1-dark-mode/`  
**Test Command:** `npm run test:E1`  
**Coverage:** 5/5 tests passing ✓

#### Test Cases

1. ✓ Defaults to light when no preference and no prefers-color-scheme
2. ✓ Toggle functionality flips theme and updates DOM
3. ✓ Persists theme to localStorage
4. ✓ Restores theme from localStorage on mount
5. ✓ Uses prefers-color-scheme when no localStorage

### Usage Example

```tsx
import { ThemeProvider, useTheme } from "./lib/ThemeContext";

function App() {
  return (
    <ThemeProvider>
      <YourComponents />
    </ThemeProvider>
  );
}

function ThemeToggleButton() {
  const { theme, toggleTheme } = useTheme();
  return <button onClick={toggleTheme}>Current: {theme}</button>;
}
```

---

## H1: Drag-and-Drop Calendar Rescheduling ✅

**Difficulty:** HARD  
**Status:** Fully Implemented & Tested

### Description

A sophisticated month-view calendar interface with drag-and-drop functionality for rescheduling social media posts. Posts can be created via a scheduling modal, appear on the calendar, and can be rescheduled by dragging between days or through a detailed post modal.

### Key Features

#### Calendar Display
- **Month View**: Traditional calendar grid with 7-day weeks (Sunday-Saturday)
- **Rectangular Day Boxes**: Google Calendar-style layout with clear date markers
- **Current Day Highlight**: Today's date highlighted with colored circle
- **Multi-Month Navigation**: Previous/Next buttons to browse months
- **Empty State Handling**: Graceful display of days with no posts

#### Post Management
- **Create Posts**: Modal with platform selection, content input, date/time picker
- **Visual Post Cards**: Color-coded cards with platform badges
- **Post Details Modal**: Click any post to view full details
- **Inline Rescheduling**: Drag posts between days to reschedule
- **Modal Rescheduling**: Edit date/time from post details modal
- **Post Deletion**: Remove posts from details modal
- **Published Posts Lock**: Published posts are read-only (cannot be edited/deleted)

#### Drag & Drop
- **Smooth Dragging**: Intuitive click-and-drag to reschedule via @dnd-kit/core
- **Visual Feedback**: Hover states and drop target highlighting
- **Date Sync Fix**: Accurate date handling without timezone offset issues
- **Time Preservation**: Dragging maintains original time, only changes date
- **Drag Overlay**: Shows post preview while dragging
- **Click Detection**: Smart detection to differentiate clicks from drags

#### Smart Constraints
- **Published Posts**: Cannot be moved, edited, or deleted (locked)
- **Local Date Handling**: Fixed timezone issues for accurate date comparisons
- **Status Indicators**: Visual badges for scheduled/published/draft posts

### Architecture

#### Components

```
CalendarView.tsx                    # Main container with state management
├── MonthCalendarView.tsx           # Month grid with DnD context
    ├── MonthCalendarDay.tsx        # Individual day cell with drop zone
        └── MonthCalendarPostCard.tsx  # Draggable post card
├── CreatePostModal.tsx             # Post creation form
├── PostDetailsModal.tsx            # Post details & reschedule modal
└── UploadVideoModal.tsx            # Video upload interface
```

#### Type Definitions (`src/types/post.ts`)

```typescript
interface Post {
  id: string;
  platform: "x" | "facebook" | "instagram" | "linkedin" | "youtube" | "tiktok";
  content: string;
  scheduledAt: string; // ISO 8601
  status: "draft" | "scheduled" | "published";
}
```

### Implementation Details

#### Post Creation Flow

1. **Open Modal**: Click "Schedule post" button
2. **Select Platform**: Choose from X, Facebook, LinkedIn, Instagram, YouTube, TikTok
3. **Enter Content**: Type post text (280 character limit with counter)
4. **Pick Date & Time**: Use HTML5 date/time inputs
5. **Submit**: Post created with unique ID and appears on calendar
6. **Toast Notification**: Success message confirms creation

#### Drag & Drop Flow

1. **Click & Hold**: User clicks and holds on a post card
2. **Drag Start**: Post card lifts, overlay appears, cursor changes to "grabbing"
3. **Drag Over**: Hovering over day cells highlights them with colored background
4. **Drop**: Release mouse over target day
5. **Date Calculation**: 
   - Extracts original time (hours, minutes, seconds)
   - Combines with new day using local date components
   - Prevents timezone offset issues
6. **Update**: `onReschedulePost(postId, newDateTime)` called
7. **State Update**: Post moved to new date, toast notification shown

#### Post Click Flow

1. **Click Post**: Single click on any post card (not dragging)
2. **Open Modal**: `PostDetailsModal` appears
3. **View Details**: 
   - Full post content (no truncation)
   - Platform with color indicator
   - Status badge (scheduled/published)
   - Formatted date and time
4. **Actions Available**:
   - **Reschedule**: Edit date/time with new picker inputs
   - **Delete**: Remove post (with confirmation)
   - **Close**: Return to calendar

#### Date Handling (Critical Fix)

**Problem**: Posts were appearing one day ahead due to timezone conversion
**Solution**: Use local date components instead of ISO strings

```typescript
// OLD (Broken - causes timezone issues)
const dateStr = date.toISOString().split('T')[0];

// NEW (Fixed - uses local date)
const year = date.getFullYear();
const month = date.getMonth();
const day = date.getDate();
// Compare components directly
```

This ensures dates are compared in local time, preventing UTC offset issues.

#### Constraint Handling

- **Published Posts**: 
  - Visual indicator (muted colors)
  - Cannot be dragged
  - Cannot be edited in modal
  - Cannot be deleted
  - Tooltip: "Published posts cannot be rescheduled"
- **Click vs Drag**: Transform state checked to prevent modal opening during drag
- **Date Preservation**: When dragging, time is preserved (only date changes)

### Testing

**Location:** `src/tests/H1-calendar-drag-drop/`  
**Test Command:** `npm run test:H1`  
**Coverage:** 26/26 tests passing ✓

#### Test Suites

**1. DateTime Utilities (`datetime.test.ts`)** - 13 tests

- ✓ getSlotDateTime creates correct ISO strings
- ✓ formatDateTimeLabel formats correctly
- ✓ getDateString extracts date portion
- ✓ getHourFromISO extracts hour correctly
- ✓ isPastDate identifies past dates
- ✓ isPastDate identifies future dates
- ✓ getWeekDates generates 7 days starting from Sunday
- ✓ getWeekDates generates dates in YYYY-MM-DD format
- ✓ getWeekDates handles custom start dates
- ✓ formatDayHeader formats current year dates
- ✓ formatDayHeader includes year for different year
- ✓ formatDayHeader formats with correct day abbreviation
- ✓ formatDayHeader formats with correct month abbreviation

**2. CalendarView Component (`CalendarView.test.tsx`)** - 13 tests

_Rendering (3 tests)_

- ✓ should render calendar with week view
- ✓ should render posts in correct time slots
- ✓ should show published posts as non-draggable

_Accessibility (2 tests)_

- ✓ should have proper aria-labels for posts
- ✓ should have proper aria-labels for time slots

_Post Display (2 tests)_

- ✓ should display platform badges
- ✓ should truncate long content with ellipsis

_Edge Cases (2 tests)_

- ✓ should handle empty slots
- ✓ should handle mixed scheduled and published posts

_Custom Configuration (2 tests)_

- ✓ should respect custom time slots
- ✓ should use custom week start date

_Overlap Behavior (1 test)_

- ✓ should allow overlaps by default

_Date Utilities Integration (1 test)_

- ✓ should integrate with date utilities correctly

### Usage Examples

#### Basic Calendar Integration

```tsx
import { MonthCalendarView } from './components/MonthCalendarView';
import { CreatePostModal } from './components/CreatePostModal';
import { PostDetailsModal } from './components/PostDetailsModal';
import type { Post } from './types/post';

function CalendarPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Handle creating new post
  const handleCreatePost = (newPost) => {
    const post: Post = {
      id: `post-${Date.now()}`,
      ...newPost,
      status: 'scheduled',
    };
    setPosts(prev => [...prev, post]);
  };

  // Handle drag-and-drop rescheduling
  const handleReschedule = (postId: string, newDateTime: string) => {
    setPosts(prev => prev.map(post =>
      post.id === postId
        ? { ...post, scheduledAt: newDateTime }
        : post
    ));
  };

  // Handle post click to view details
  const handlePostClick = (post: Post) => {
    setSelectedPost(post);
  };

  // Handle post deletion
  const handleDelete = (postId: string) => {
    setPosts(prev => prev.filter(post => post.id !== postId));
  };

  return (
    <div>
      <button onClick={() => setShowCreateModal(true)}>
        Schedule Post
      </button>
      
      <MonthCalendarView
        posts={posts}
        onReschedulePost={handleReschedule}
        onPostClick={handlePostClick}
      />

      {showCreateModal && (
        <CreatePostModal
          onClose={() => setShowCreateModal(false)}
          onCreatePost={handleCreatePost}
        />
      )}

      {selectedPost && (
        <PostDetailsModal
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
          onReschedule={handleReschedule}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
```

#### CreatePostModal Example

```tsx
// User clicks "Schedule post" button
<CreatePostModal
  onClose={() => setShowModal(false)}
  onCreatePost={(newPost) => {
    // newPost contains: platform, content, scheduledAt
    const post: Post = {
      id: generateId(),
      ...newPost,
      status: 'scheduled',
    };
    setPosts([...posts, post]);
  }}
/>
```

#### PostDetailsModal Example

```tsx
// User clicks on a post card
<PostDetailsModal
  post={selectedPost}
  onClose={() => setSelectedPost(null)}
  onReschedule={(postId, newDateTime) => {
    // Update post's scheduledAt
    updatePostInState(postId, { scheduledAt: newDateTime });
  }}
  onDelete={(postId) => {
    // Remove post from state
    removePostFromState(postId);
  }}
/>
```

#### Legacy Weekly View (Still Available)

```tsx
import { CalendarView as WeeklyCalendar } from './components/calendar/CalendarView';

function MyScheduler() {
  const [posts, setPosts] = useState<Post[]>([...]);

  const handleReschedule = (postId: string, newDateTime: string) => {
    setPosts(prev => prev.map(post =>
      post.id === postId
        ? { ...post, scheduledAt: newDateTime }
        : post
    ));
  };

  return (
    <WeeklyCalendar
      posts={posts}
      onReschedulePost={handleReschedule}
      weekStartDate={new Date('2025-11-16')}
      timeSlots={[9, 10, 11, 12, 13, 14, 15, 16, 17]}
      allowOverlaps={true}
    />
  );
}
```

### Integration Guide

See `CALENDAR-FEATURE-SUMMARY.md` and `INTEGRATION-GUIDE.md` for detailed integration instructions.

---

## Test Infrastructure

### Configuration

- **Framework**: Vitest v0.34.6
- **Environment**: jsdom (browser simulation)
- **Globals**: Enabled (`describe`, `it`, `expect` available globally)
- **Setup**: `@testing-library/jest-dom` for extended matchers
- **Mocking**: `@dnd-kit/core` mocked for component tests

### File Structure

```
src/tests/
├── setup.ts                    # Global test setup
├── vitest.d.ts                 # TypeScript globals
├── README.md                   # Test documentation
├── E1-dark-mode/
│   └── ThemeContext.test.tsx   # 5 tests
└── H1-calendar-drag-drop/
    ├── datetime.test.ts        # 13 tests
    └── CalendarView.test.tsx   # 13 tests
```

### Test Commands

```bash
npm test              # Run all tests (31 total)
npm run test:E1       # Run E1 dark mode tests only (5 tests)
npm run test:H1       # Run H1 calendar tests only (26 tests)
```

### Test Results Summary

```
✓ E1-dark-mode/ThemeContext.test.tsx     (5 tests)
✓ H1-calendar-drag-drop/datetime.test.ts (13 tests)
✓ H1-calendar-drag-drop/CalendarView.test.tsx (13 tests)

Total: 31/31 tests passing ✓
```

---

## Dependencies

### Production

- `@dnd-kit/core` ^6.3.1 - Drag and drop functionality
- `react` ^18.3.1 - UI framework
- `react-dom` ^18.3.1 - DOM rendering

### Development

- `vitest` ^0.34.6 - Testing framework
- `@testing-library/react` ^16.1.0 - Component testing
- `@testing-library/jest-dom` ^6.6.3 - Extended matchers
- `@vitejs/plugin-react` ^4.3.4 - React support in Vite
- `typescript` ~5.6.2 - Type safety

---

## Development Guide

### Running the Application

```bash
npm install          # Install dependencies
npm run dev          # Start development server
npm run build        # Production build
npm run preview      # Preview production build
```

### Testing Workflow

```bash
npm test             # Run all tests
npm run test:E1      # Test dark mode feature
npm run test:H1      # Test calendar feature
npm test -- --watch  # Run tests in watch mode
npm test -- --ui     # Open Vitest UI
```

### Code Quality

- **TypeScript**: Strict mode enabled
- **CSS Modules**: Component-scoped styling
- **ESLint**: Code linting (configured)
- **Type Safety**: Full TypeScript coverage

---

## Browser Support

- Modern browsers with ES6+ support
- CSS Grid and Flexbox required
- localStorage API required (dark mode)
- Drag and Drop API required (calendar)

---

## Future Enhancements

### Potential Improvements

- [ ] Multi-week view (month view)
- [ ] Touch device optimization for drag-and-drop
- [ ] Keyboard shortcuts for rescheduling
- [ ] Undo/redo functionality
- [ ] Batch operations (multi-select)
- [ ] Calendar export (iCal format)
- [ ] Timezone support
- [ ] Recurring posts
- [ ] Conflict resolution UI
- [ ] Performance optimization for 100+ posts

---

## License

This project is part of an intern challenge for Loop Desk.

**Last Updated:** November 15, 2025  
**Test Coverage:** 31/31 tests passing ✓
