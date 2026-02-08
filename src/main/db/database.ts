import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';

let db: InstanceType<typeof Database> | null = null;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS scripts (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  title       TEXT    NOT NULL,
  body        TEXT    NOT NULL,
  speech_speed INTEGER NOT NULL DEFAULT 150,
  settings    TEXT    NOT NULL DEFAULT '{}',
  created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);
`;

export function getDb(): InstanceType<typeof Database> {
  if (!db) {
    const userData = app.getPath('userData');
    const dbPath = path.join(userData, 'notchprompter.db');
    db = new Database(dbPath);
    db.exec(SCHEMA);
  }
  return db;
}

export function initDatabase(): void {
  getDb();
}

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}
