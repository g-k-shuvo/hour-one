// System folder IDs
export const SYSTEM_FOLDER_IDS = {
  TODAY: 'today',
  INBOX: 'inbox',
  DONE: 'done',
} as const;

export type SystemFolderId = typeof SYSTEM_FOLDER_IDS[keyof typeof SYSTEM_FOLDER_IDS];

// Task Folder
export interface TaskFolder {
  id: string;
  name: string;
  icon: string;        // lucide icon name
  isSystem: boolean;   // true = cannot delete
  order: number;
  color?: string;      // for custom folders
}

// Task types
export interface Task {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string;
  completedAt?: string;
  folderId: string;    // defaults to 'inbox'
}

// Quick Link types
export interface QuickLink {
  id: string;
  name: string;
  url: string;
  icon?: string;
  groupId?: string;      // optional group association
  pinned?: boolean;      // pinned to dashboard
  pinnedOrder?: number;  // order in pinned bar
}

export interface LinkGroup {
  id: string;
  name: string;
  color?: string;        // optional accent color
  pinned?: boolean;
  pinnedOrder?: number;
}

// Weather types
export interface HourlyForecast {
  time: string; // e.g., "8PM", "9PM"
  temperature: number;
  icon: string;
}

export interface DailyForecast {
  day: string; // e.g., "WED", "THU"
  icon: string;
  high: number;
  low: number;
}

export interface WeatherData {
  temperature: number;
  condition: string;
  icon: string;
  location: string;
  humidity?: number;
  feelsLike?: number;
  // Extended data
  windSpeed?: number;
  windDirection?: number;
  precipitation?: number;
  uvIndex?: number;
  pressure?: number;
  visibility?: number;
  sunrise?: string;
  sunset?: string;
  hourlyForecast?: HourlyForecast[];
  dailyForecast?: DailyForecast[];
}

// Quote types
export interface Quote {
  text: string;
  author?: string;
}

// Mantra types
export interface Mantra {
  id: string;
  text: string;
}

// Focus types
export interface DailyFocus {
  text: string;
  date: string;
  completed: boolean;
}

// Widget position types (for future drag-and-drop)
export interface WidgetPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Background image types
export interface BackgroundImage {
  url: string;
  photographer?: string;
  photographerUrl?: string;
  location?: string;
}
