import type { SemanticData } from '../types';

export function validateTableData(value: unknown): SemanticData {
  const raw = value as Partial<SemanticData> | null;
  if (!raw || typeof raw !== 'object' || !Array.isArray(raw.columns) || !Array.isArray(raw.data)) throw new Error('Invalid table: expected columns and data arrays.');
  const keys = new Set<string>();
  for (const column of raw.columns) {
    if (!column || typeof column.key !== 'string' || !column.key.trim() || typeof column.label !== 'string' || keys.has(column.key)) throw new Error('Invalid table: each column needs a unique key and a text label.');
    keys.add(column.key);
  }
  if (raw.data.some(row => !row || typeof row !== 'object' || Array.isArray(row))) throw new Error('Invalid table: each row must be an object.');
  if (raw.summary !== undefined && typeof raw.summary !== 'string') throw new Error('Invalid table summary.');
  if (raw.suggestedTitle !== undefined && typeof raw.suggestedTitle !== 'string') throw new Error('Invalid table title.');
  return {summary: raw.summary ?? '', suggestedTitle: raw.suggestedTitle ?? 'Untitled Dataset', columns: raw.columns.map(({key,label}) => ({key,label})), data: raw.data};
}
