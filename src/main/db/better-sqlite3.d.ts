declare module 'better-sqlite3' {
  interface SqliteDatabase {
    exec(sql: string): this;
    prepare(sql: string): Statement;
    close(): this;
  }
  interface Statement {
    run(...params: unknown[]): { changes: number; lastInsertRowid: number };
    get(...params: unknown[]): unknown;
    all(...params: unknown[]): unknown[];
  }
  const Database: new (filename: string) => SqliteDatabase;
  export = Database;
}
