import type { WritableSignal } from '@angular/core';
import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';

import { AuthService } from './auth.service';
import type { CalendarEvent, Subject, Task } from './models';
import { NotificationService } from './notification.service';
import { StorageService } from './storage.service';
import { uid } from './utils';

const SUBJECTS_KEY = 'subjects';
const TASKS_KEY = 'tasks';
const EVENTS_KEY = 'events';

export type SubjectInput = Omit<Subject, 'id' | 'userId' | 'createdAt'>;
export type TaskInput = Omit<Task, 'id' | 'userId' | 'createdAt' | 'completed' | 'completedAt'>;
export type EventInput = Omit<CalendarEvent, 'id' | 'userId' | 'createdAt'>;

/**
 * Gestión local de materias (RF-03), tareas (RF-04, RF-05, RF-06) y eventos del
 * calendario (RF-07). Solo expone los registros del usuario con sesión activa (RNF-05).
 */
@Injectable({ providedIn: 'root' })
export class DataService {
  private readonly storage = inject(StorageService);
  private readonly auth = inject(AuthService);
  private readonly notifications = inject(NotificationService);

  private readonly _subjects = signal<Subject[]>([]);
  private readonly _tasks = signal<Task[]>([]);
  private readonly _events = signal<CalendarEvent[]>([]);

  readonly subjects = computed(() => [...this._subjects()].sort((a, b) => a.name.localeCompare(b.name, 'es')));
  readonly tasks = this._tasks.asReadonly();
  readonly events = this._events.asReadonly();

  constructor() {
    // Recarga los datos cada vez que cambia el usuario con sesión activa.
    effect(() => {
      const userId = this.auth.user()?.id ?? null;
      untracked(() => void this.load(userId));
    });
  }

  private async load(userId: string | null): Promise<void> {
    if (!userId) {
      this._subjects.set([]);
      this._tasks.set([]);
      this._events.set([]);
      return;
    }
    const [subjects, tasks, events] = await Promise.all([
      this.storage.get<Subject[]>(SUBJECTS_KEY, []),
      this.storage.get<Task[]>(TASKS_KEY, []),
      this.storage.get<CalendarEvent[]>(EVENTS_KEY, []),
    ]);
    this._subjects.set(subjects.filter((s) => s.userId === userId));
    this._tasks.set(tasks.filter((t) => t.userId === userId));
    this._events.set(events.filter((e) => e.userId === userId));
    void this.syncReminders();
  }

  // ---------- Consultas ----------

  subjectById(id: string): Subject | undefined {
    return this._subjects().find((s) => s.id === id);
  }

  taskById(id: string): Task | undefined {
    return this._tasks().find((t) => t.id === id);
  }

  eventById(id: string): CalendarEvent | undefined {
    return this._events().find((e) => e.id === id);
  }

  tasksBySubject(subjectId: string): Task[] {
    return this._tasks().filter((t) => t.subjectId === subjectId);
  }

  // ---------- Materias (RF-03) ----------

  async addSubject(input: SubjectInput): Promise<Subject> {
    const subject: Subject = { ...input, id: uid(), userId: this.userId(), createdAt: new Date().toISOString() };
    await this.saveAll(SUBJECTS_KEY, this._subjects, [...this._subjects(), subject]);
    return subject;
  }

  async updateSubject(id: string, input: SubjectInput): Promise<void> {
    await this.saveAll(
      SUBJECTS_KEY,
      this._subjects,
      this._subjects().map((s) => (s.id === id ? { ...s, ...input } : s)),
    );
  }

  /** Elimina la materia junto con sus tareas, ya que toda tarea debe tener materia (RF-04). */
  async deleteSubject(id: string): Promise<void> {
    await this.saveAll(
      SUBJECTS_KEY,
      this._subjects,
      this._subjects().filter((s) => s.id !== id),
    );
    await this.saveAll(
      TASKS_KEY,
      this._tasks,
      this._tasks().filter((t) => t.subjectId !== id),
    );
    await this.saveAll(
      EVENTS_KEY,
      this._events,
      this._events().map((e) => (e.subjectId === id ? { ...e, subjectId: undefined } : e)),
    );
    void this.syncReminders();
  }

  // ---------- Tareas (RF-04, RF-05) ----------

  async addTask(input: TaskInput): Promise<Task> {
    this.assertSubject(input.subjectId);
    const task: Task = {
      ...input,
      id: uid(),
      userId: this.userId(),
      completed: false,
      createdAt: new Date().toISOString(),
    };
    await this.saveAll(TASKS_KEY, this._tasks, [...this._tasks(), task]);
    void this.syncReminders();
    return task;
  }

  async updateTask(id: string, input: TaskInput): Promise<void> {
    this.assertSubject(input.subjectId);
    await this.saveAll(
      TASKS_KEY,
      this._tasks,
      this._tasks().map((t) => (t.id === id ? { ...t, ...input } : t)),
    );
    void this.syncReminders();
  }

  async setTaskCompleted(id: string, completed: boolean): Promise<void> {
    await this.saveAll(
      TASKS_KEY,
      this._tasks,
      this._tasks().map((t) =>
        t.id === id ? { ...t, completed, completedAt: completed ? new Date().toISOString() : undefined } : t,
      ),
    );
    void this.syncReminders();
  }

  async deleteTask(id: string): Promise<void> {
    await this.saveAll(
      TASKS_KEY,
      this._tasks,
      this._tasks().filter((t) => t.id !== id),
    );
    void this.syncReminders();
  }

  // ---------- Eventos del calendario (RF-07) ----------

  async addEvent(input: EventInput): Promise<CalendarEvent> {
    const event: CalendarEvent = { ...input, id: uid(), userId: this.userId(), createdAt: new Date().toISOString() };
    await this.saveAll(EVENTS_KEY, this._events, [...this._events(), event]);
    return event;
  }

  async updateEvent(id: string, input: EventInput): Promise<void> {
    await this.saveAll(
      EVENTS_KEY,
      this._events,
      this._events().map((e) => (e.id === id ? { ...e, ...input } : e)),
    );
  }

  async deleteEvent(id: string): Promise<void> {
    await this.saveAll(
      EVENTS_KEY,
      this._events,
      this._events().filter((e) => e.id !== id),
    );
  }

  // ---------- Cuenta ----------

  /** Borra todos los registros del usuario actual (usado al eliminar la cuenta). */
  async deleteAllForCurrentUser(): Promise<void> {
    const userId = this.userId();
    for (const key of [SUBJECTS_KEY, TASKS_KEY, EVENTS_KEY]) {
      const all = await this.storage.get<{ userId: string }[]>(key, []);
      await this.storage.set(
        key,
        all.filter((r) => r.userId !== userId),
      );
    }
    this._subjects.set([]);
    this._tasks.set([]);
    this._events.set([]);
    await this.notifications.reschedule([], [], undefined);
  }

  /** Reprograma los recordatorios según las tareas y ajustes actuales (RF-08). */
  syncReminders(): Promise<void> {
    return this.notifications.reschedule(this._tasks(), this._subjects(), this.auth.user()?.settings);
  }

  // ---------- Internos ----------

  private userId(): string {
    const id = this.auth.user()?.id;
    if (!id) throw new Error('No hay una sesión activa.');
    return id;
  }

  private assertSubject(subjectId: string): void {
    if (!this.subjectById(subjectId)) {
      throw new Error('La tarea debe estar asociada a una materia registrada.');
    }
  }

  /**
   * Guarda la lista del usuario actual conservando los registros de los demás usuarios
   * que comparten el mismo almacenamiento del dispositivo.
   */
  private async saveAll<T extends { userId: string }>(
    key: string,
    target: WritableSignal<T[]>,
    mine: T[],
  ): Promise<void> {
    const userId = this.userId();
    const all = await this.storage.get<T[]>(key, []);
    await this.storage.set(key, [...all.filter((r) => r.userId !== userId), ...mine]);
    target.set(mine);
  }
}
