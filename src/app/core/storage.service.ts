import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage';

/**
 * Envoltura de Ionic Storage. En el navegador y en el WebView de Android/iOS
 * usa IndexedDB, con respaldo en localStorage, y persiste entre sesiones.
 */
@Injectable({ providedIn: 'root' })
export class StorageService {
  private readonly storage = new Storage({ name: 'gestu_db' });
  private readyPromise: Promise<Storage> | null = null;

  private ready(): Promise<Storage> {
    this.readyPromise ??= this.storage.create();
    return this.readyPromise;
  }

  async get<T>(key: string, fallback: T): Promise<T> {
    const db = await this.ready();
    const value = (await db.get(key)) as T | null;
    return value ?? fallback;
  }

  async set<T>(key: string, value: T): Promise<void> {
    const db = await this.ready();
    await db.set(key, value);
  }

  async remove(key: string): Promise<void> {
    const db = await this.ready();
    await db.remove(key);
  }
}
