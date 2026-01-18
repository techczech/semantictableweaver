export interface Column {
  key: string;
  label: string;
}

export interface SemanticData {
  summary: string;
  columns: Column[];
  data: Record<string, any>[];
  suggestedTitle?: string;
}

export interface SavedTable {
  id: string;
  name: string;
  timestamp: number;
  data: SemanticData;
}

export type ProcessingState = 'idle' | 'processing' | 'analyzed' | 'error';

export interface FileInput {
  type: 'text' | 'file';
  content: string; // Text content or Base64 string
  mimeType?: string; // For files
  fileName?: string;
}

export type ChartType = 'bar' | 'line' | 'area' | 'composed';