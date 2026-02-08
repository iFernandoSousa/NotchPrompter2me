import type { Script, ScriptCreatePayload, ScriptUpdatePayload } from '../../shared/types';
import { getDb } from './database';

export function createScript(payload: ScriptCreatePayload): Script {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO scripts (title, body, speech_speed, settings, created_at, updated_at)
    VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
  `);
  const settingsJson = JSON.stringify(payload.settings);
  stmt.run(payload.title, payload.body, payload.speech_speed, settingsJson);
  const row = db.prepare('SELECT * FROM scripts WHERE id = last_insert_rowid()').get() as Script;
  return row;
}

export function readScript(id: number): Script | null {
  const db = getDb();
  const row = db.prepare('SELECT * FROM scripts WHERE id = ?').get(id) as Script | undefined;
  return row ?? null;
}

export function listScripts(): Script[] {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM scripts ORDER BY updated_at DESC').all() as Script[];
  return rows;
}

export function updateScript(payload: ScriptUpdatePayload): Script | null {
  const db = getDb();
  const settingsJson = JSON.stringify(payload.settings);
  const result = db
    .prepare(
      `UPDATE scripts SET title = ?, body = ?, speech_speed = ?, settings = ?, updated_at = datetime('now') WHERE id = ?`
    )
    .run(payload.title, payload.body, payload.speech_speed, settingsJson, payload.id);
  if (result.changes === 0) return null;
  return readScript(payload.id) ?? null;
}

export function deleteScript(id: number): boolean {
  const db = getDb();
  const result = db.prepare('DELETE FROM scripts WHERE id = ?').run(id);
  return result.changes > 0;
}
