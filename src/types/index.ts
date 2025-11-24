// Platform types
export type Platform = {
  id: string;
  name: string;
  description: string;
  icon: string;
  isPro: boolean;
};

// Video types
export type Video = {
  id: string;
  duration: string;
  title: string;
  status: string;
  thumbnail: string;
};

// Clip types
export type Clip = {
  id: string;
  duration: string;
  number: number;
  title: string;
  thumbnail1: string;
  thumbnail2: string;
};

// Navigation types
export type ViewType = 'calendar' | 'analytics' | 'social' | 'content-library' | 'account';

// Date types for calendar
export type CalendarDay = {
  date: Date;
  isCurrentMonth: boolean;
};

// Scheduling types
export type SchedulingDay = {
  date: number;
  isCurrentMonth: boolean;
  fullDate: Date;
};

// Analytics types
export type ChartDataPoint = {
  date: string;
  views: number;
};

export type AudienceMetric = {
  label: string;
  value: string;
};
