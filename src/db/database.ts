
import * as SQLite from 'expo-sqlite';

import type { Product } from '@/api/products';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export function getDb() {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync('market.db');

      await db.execAsync(`
        PRAGMA journal_mode = WAL;

        CREATE TABLE IF NOT EXISTS products (
          id INTEGER PRIMARY KEY NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          category TEXT,
          price REAL,
          rating REAL,
          stock INTEGER,
          brand TEXT,
          thumbnail TEXT,
          images TEXT,
          position INTEGER,
          cached_at INTEGER
        );

        CREATE TABLE IF NOT EXISTS listings (
          local_id INTEGER PRIMARY KEY AUTOINCREMENT,
          owner TEXT NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          category TEXT,
          price REAL NOT NULL,
          photo_uri TEXT,
          latitude REAL,
          longitude REAL,
          place_name TEXT,
          created_at INTEGER NOT NULL,
          synced INTEGER NOT NULL DEFAULT 0,
          remote_id INTEGER
        );

        CREATE INDEX IF NOT EXISTS idx_listings_owner_synced
        ON listings (owner, synced);
      `);

      return db;
    })();
  }

  return dbPromise;
}

// ---------------- products cache ----------------

type ProductRow = Omit<Product, 'images'> & {
  images: string | null;
};

function rowToProduct(row: ProductRow): Product {
  let images: string[] = [];

  try {
    images = row.images ? JSON.parse(row.images) : [];
  } catch {
    images = [];
  }

  return { ...row, images };
}

export async function cacheProducts(
  products: Product[],
  startPosition: number
) {
  const db = await getDb();

  await db.withTransactionAsync(async () => {
    for (const [index, p] of products.entries()) {
      await db.runAsync(
        `INSERT OR REPLACE INTO products
          (id, title, description, category, price, rating, stock,
           brand, thumbnail, images, position, cached_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        p.id,
        p.title,
        p.description,
        p.category,
        p.price,
        p.rating,
        p.stock,
        p.brand,
        p.thumbnail,
        JSON.stringify(p.images),
        startPosition + index,
        Date.now()
      );
    }
  });
}

export async function getCachedProducts(): Promise<Product[]> {
  const db = await getDb();

  const rows = await db.getAllAsync<ProductRow>(
    `SELECT id, title, description, category, price, rating, stock,
            brand, thumbnail, images
     FROM products
     ORDER BY position ASC`
  );

  return rows.map(rowToProduct);
}

export async function getCachedProduct(
  id: number
): Promise<Product | null> {
  const db = await getDb();

  const row = await db.getFirstAsync<ProductRow>(
    `SELECT id, title, description, category, price, rating, stock,
            brand, thumbnail, images
     FROM products
     WHERE id = ?`,
    id
  );

  return row ? rowToProduct(row) : null;
}

// ---------------- listings (offline queue) ----------------

export type Listing = {
  local_id: number;
  owner: string;
  title: string;
  description: string;
  category: string;
  price: number;
  photo_uri: string | null;
  latitude: number | null;
  longitude: number | null;
  place_name: string | null;
  created_at: number;
  synced: number; // 0 = waiting in the queue, 1 = live on the server
  remote_id: number | null;
};

export type NewListing = Omit<
  Listing,
  'local_id' | 'created_at' | 'synced' | 'remote_id'
>;

export async function addListing(listing: NewListing) {
  const db = await getDb();

  const result = await db.runAsync(
    `INSERT INTO listings
      (owner, title, description, category, price, photo_uri,
       latitude, longitude, place_name, created_at, synced)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
    listing.owner,
    listing.title,
    listing.description,
    listing.category,
    listing.price,
    listing.photo_uri,
    listing.latitude,
    listing.longitude,
    listing.place_name,
    Date.now()
  );

  return result.lastInsertRowId;
}

export async function getListings(
  owner: string
): Promise<Listing[]> {
  const db = await getDb();

  return db.getAllAsync<Listing>(
    'SELECT * FROM listings WHERE owner = ? ORDER BY created_at DESC',
    owner
  );
}

export async function getPendingListings(
  owner: string
): Promise<Listing[]> {
  const db = await getDb();

  return db.getAllAsync<Listing>(
    `SELECT * FROM listings
     WHERE owner = ? AND synced = 0
     ORDER BY created_at ASC`,
    owner
  );
}

export async function markListingSynced(
  localId: number,
  remoteId: number
) {
  const db = await getDb();

  await db.runAsync(
    'UPDATE listings SET synced = 1, remote_id = ? WHERE local_id = ?',
    remoteId,
    localId
  );
}
