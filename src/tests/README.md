# Test Suite

This directory contains organized tests for the social media scheduler application.

## Test Structure

Tests are organized by feature:

### E1: Dark Mode Toggle

- **Location**: `src/tests/E1-dark-mode/`
- **Run**: `npm run test:E1`
- **Description**: Tests for the dark/light theme toggle functionality
- **Coverage**:
  - Theme persistence in localStorage
  - DOM attribute updates
  - System preference detection
  - Toggle functionality

### H1: Calendar Drag & Drop

- **Location**: `src/tests/H1-calendar-drag-drop/`
- **Run**: `npm run test:H1`
- **Description**: Tests for the calendar drag-and-drop rescheduling feature
- **Coverage**:
  - DateTime utilities (formatting, parsing, validation)
  - CalendarView component rendering
  - Drag-and-drop functionality
  - Accessibility features
  - Edge cases (overlaps, past dates, published posts)
  - Custom configurations

## Running Tests

### Run All Tests

```bash
npm test
```

### Run E1 Tests Only (Dark Mode)

```bash
npm run test:E1
```

### Run H1 Tests Only (Calendar Drag & Drop)

```bash
npm run test:H1
```

### Run Tests in Watch Mode

All test commands automatically run in watch mode and will re-run when files change.

### Run Tests Once (CI Mode)

```bash
npm test -- --run
```

## Test Files

### E1-dark-mode/

- `ThemeContext.test.tsx` - Theme provider and toggle tests

### H1-calendar-drag-drop/

- `datetime.test.ts` - DateTime utility function tests
- `CalendarView.test.tsx` - Calendar component integration tests

## Writing New Tests

1. Create test files in the appropriate feature folder
2. Use descriptive test names that match the feature requirements
3. Follow the existing test patterns for consistency
4. Include tests for:
   - Happy path scenarios
   - Edge cases
   - Accessibility
   - Error handling

## Test Configuration

Tests are configured in `vite.config.ts`:

- Uses `jsdom` environment for React component testing
- Globals enabled for easier test writing
- Automatically discovers `.test.ts` and `.test.tsx` files
