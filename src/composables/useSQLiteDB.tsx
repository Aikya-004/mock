import { useEffect, useRef, useState } from "react";
import {
  SQLiteDBConnection,
  SQLiteConnection,
  CapacitorSQLite,
} from "@capacitor-community/sqlite";

const useSQLiteDB = () => {
  const db = useRef<SQLiteDBConnection>();
  const sqlite = useRef<SQLiteConnection>();
  const [initialized, setInitialized] = useState<boolean>(false);

  useEffect(() => {
    const initializeDB = async () => {
      if (sqlite.current) return;

      sqlite.current = new SQLiteConnection(CapacitorSQLite);
      const ret = await sqlite.current.checkConnectionsConsistency();
      const isConn = (await sqlite.current.isConnection("db_vite", false))
        .result;

      if (ret.result && isConn) {
        db.current = await sqlite.current.retrieveConnection("db_vite", false);
      } else {
        db.current = await sqlite.current.createConnection(
          "db_vite",
          false,
          "no-encryption",
          1,
          false
        );
      }

      await initializeTables();
      setInitialized(true);
    };

    initializeDB();
  }, []);

  const performSQLAction = async (
    action: (db: SQLiteDBConnection | undefined) => Promise<void>,
    cleanup?: () => Promise<void>
  ) => {
    try {
      await db.current?.open();
      await action(db.current);
    } catch (error) {
      alert((error as Error).message);
    } finally {
      try {
        (await db.current?.isDBOpen())?.result && (await db.current?.close());
        cleanup && (await cleanup());
      } catch {}
    }
  };

  const initializeTables = async () => {
    performSQLAction(async (db: SQLiteDBConnection | undefined) => {
      const queryCreateTable = `
      CREATE TABLE IF NOT EXISTS medicines (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        type TEXT,
        quantity TEXT,
        expiry_date TEXT,
        batch_no TEXT,
        price REAL
      );
    `;
      const respCT = await db?.execute(queryCreateTable);
      console.log(`Table creation result: ${JSON.stringify(respCT)}`);
    });
  };

  return { performSQLAction, initialized };
};

export default useSQLiteDB;
