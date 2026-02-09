import Database, { type QueryResult } from '@tauri-apps/plugin-sql';

let dbInner: Database | null = null;
let initPromise: Promise<Database> | null = null;

export type InsertValue = boolean | number | string;

export function db(): Promise<Database> {
  if (dbInner) return Promise.resolve(dbInner);

  if (!initPromise) {
    initPromise = Database.load('sqlite:formulae.db').then((loaded) => {
      dbInner = loaded;
      return dbInner;
    });
  }

  return initPromise;
}

export async function insertValues(
  table: string,
  columns: string[],
  values: InsertValue[][]
): Promise<QueryResult> {
  let vals = '';

  for (let i = 0; i < values.length; i++) {
    let insertValues = values[i]
      .map((v) => {
        if (typeof v === 'string') {
          return `'${v}'`;
        }

        if (typeof v === 'boolean') {
          return v ? 'TRUE' : 'FALSE';
        }

        return v;
      })
      .join(',');

    vals += `(${insertValues})`;

    if (i < values.length - 1) {
      vals += ', ';
    }
  }

  const query = `INSERT INTO ${table} (${columns.join(',')}) VALUES ${vals}`;

  console.log(query);

  return (await db()).execute(query);
}
