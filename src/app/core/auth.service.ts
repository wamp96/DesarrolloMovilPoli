import { Injectable, computed, inject, signal } from '@angular/core';

import type { PublicUser, User, UserSettings } from './models';
import { StorageService } from './storage.service';
import { normalizeEmail, randomSalt, sha256, uid } from './utils';

const USERS_KEY = 'users';
const SESSION_KEY = 'session';

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  securityQuestion: string;
  securityAnswer: string;
  career?: string;
  semester?: string;
}

/**
 * Autenticación local (RF-01, RF-02, RF-09).
 * Los usuarios se guardan en el dispositivo con la contraseña y la respuesta de
 * seguridad cifradas con SHA-256 y sal (RNF-05).
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly storage = inject(StorageService);

  private readonly _user = signal<PublicUser | null>(null);
  /** Usuario con sesión activa, o null. */
  readonly user = this._user.asReadonly();
  readonly isLoggedIn = computed(() => this._user() !== null);

  private initPromise: Promise<void> | null = null;

  /** Restaura la sesión guardada. Se ejecuta una sola vez al arrancar la app. */
  init(): Promise<void> {
    this.initPromise ??= (async () => {
      const sessionId = await this.storage.get<string | null>(SESSION_KEY, null);
      if (!sessionId) return;
      const user = (await this.users()).find((u) => u.id === sessionId);
      this._user.set(user ? this.toPublic(user) : null);
      if (!user) await this.storage.remove(SESSION_KEY);
    })();
    return this.initPromise;
  }

  async register(data: RegisterData): Promise<void> {
    const users = await this.users();
    const email = normalizeEmail(data.email);
    if (users.some((u) => u.email === email)) {
      throw new Error('Ya existe una cuenta registrada con ese correo.');
    }
    const salt = randomSalt();
    const user: User = {
      id: uid(),
      name: data.name.trim(),
      email,
      salt,
      passwordHash: await sha256(salt + data.password),
      securityQuestion: data.securityQuestion,
      securityAnswerHash: await sha256(salt + this.normalizeAnswer(data.securityAnswer)),
      career: data.career?.trim() || undefined,
      semester: data.semester?.trim() || undefined,
      settings: { notifications: true, reminderHours: 24 },
      createdAt: new Date().toISOString(),
    };
    await this.storage.set(USERS_KEY, [...users, user]);
    await this.startSession(user);
  }

  async login(email: string, password: string): Promise<void> {
    const user = (await this.users()).find((u) => u.email === normalizeEmail(email));
    if (!user || (await sha256(user.salt + password)) !== user.passwordHash) {
      throw new Error('Correo o contraseña incorrectos.');
    }
    await this.startSession(user);
  }

  async logout(): Promise<void> {
    await this.storage.remove(SESSION_KEY);
    this._user.set(null);
  }

  /** Devuelve la pregunta de seguridad de la cuenta asociada al correo (RF-02). */
  async getSecurityQuestion(email: string): Promise<string> {
    const user = (await this.users()).find((u) => u.email === normalizeEmail(email));
    if (!user) throw new Error('No existe una cuenta registrada con ese correo.');
    return user.securityQuestion;
  }

  /** Restablece la contraseña si la respuesta de seguridad es correcta (RF-02). */
  async resetPassword(email: string, answer: string, newPassword: string): Promise<void> {
    const users = await this.users();
    const user = users.find((u) => u.email === normalizeEmail(email));
    if (!user) throw new Error('No existe una cuenta registrada con ese correo.');
    const answerHash = await sha256(user.salt + this.normalizeAnswer(answer));
    if (answerHash !== user.securityAnswerHash) {
      throw new Error('La respuesta de seguridad no es correcta.');
    }
    user.passwordHash = await sha256(user.salt + newPassword);
    await this.storage.set(USERS_KEY, users);
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await this.updateCurrent(async (user) => {
      if ((await sha256(user.salt + currentPassword)) !== user.passwordHash) {
        throw new Error('La contraseña actual no es correcta.');
      }
      user.passwordHash = await sha256(user.salt + newPassword);
    });
  }

  /** Actualiza nombre, correo, carrera, semestre y foto (RF-09). */
  async updateProfile(changes: Pick<User, 'name' | 'email' | 'career' | 'semester' | 'photo'>): Promise<void> {
    const email = normalizeEmail(changes.email);
    const users = await this.users();
    const current = this._user();
    if (users.some((u) => u.email === email && u.id !== current?.id)) {
      throw new Error('Ese correo ya está en uso por otra cuenta.');
    }
    await this.updateCurrent(async (user) => {
      user.name = changes.name.trim();
      user.email = email;
      user.career = changes.career?.trim() || undefined;
      user.semester = changes.semester?.trim() || undefined;
      user.photo = changes.photo || undefined;
    });
  }

  async updateSettings(settings: UserSettings): Promise<void> {
    await this.updateCurrent(async (user) => {
      user.settings = { ...settings };
    });
  }

  /** Elimina la cuenta del usuario actual (los datos se borran desde DataService). */
  async deleteAccount(): Promise<void> {
    const current = this._user();
    if (!current) return;
    const users = await this.users();
    await this.storage.set(
      USERS_KEY,
      users.filter((u) => u.id !== current.id),
    );
    await this.logout();
  }

  private async updateCurrent(mutate: (user: User) => Promise<void>): Promise<void> {
    const current = this._user();
    if (!current) throw new Error('No hay una sesión activa.');
    const users = await this.users();
    const user = users.find((u) => u.id === current.id);
    if (!user) throw new Error('La cuenta ya no existe.');
    await mutate(user);
    await this.storage.set(USERS_KEY, users);
    this._user.set(this.toPublic(user));
  }

  private async startSession(user: User): Promise<void> {
    await this.storage.set(SESSION_KEY, user.id);
    this._user.set(this.toPublic(user));
  }

  private users(): Promise<User[]> {
    return this.storage.get<User[]>(USERS_KEY, []);
  }

  private normalizeAnswer(answer: string): string {
    return answer.trim().toLowerCase();
  }

  private toPublic(user: User): PublicUser {
    const { passwordHash: _p, salt: _s, securityAnswerHash: _a, ...rest } = user;
    return rest;
  }
}
