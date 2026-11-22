import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

import type { Subject, Task, UserSettings } from './models';
import { parseISODate } from './utils';

/**
 * Recordatorios locales de tareas próximas a vencer (RF-08).
 * Usa notificaciones locales del sistema operativo, programadas en el propio
 * dispositivo, por lo que no requieren servidor. En el navegador no hacen nada.
 */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly enabled = Capacitor.isNativePlatform();

  /** Pide permiso al usuario para mostrar notificaciones. */
  async requestPermission(): Promise<boolean> {
    if (!this.enabled) return false;
    const status = await LocalNotifications.requestPermissions();
    return status.display === 'granted';
  }

  /** Cancela todos los recordatorios y vuelve a programar los de las tareas pendientes. */
  async reschedule(tasks: Task[], subjects: Subject[], settings: UserSettings | undefined): Promise<void> {
    if (!this.enabled) return;
    try {
      const pending = await LocalNotifications.getPending();
      if (pending.notifications.length) {
        await LocalNotifications.cancel({ notifications: pending.notifications.map((n) => ({ id: n.id })) });
      }
      if (!settings?.notifications) return;
      if (!(await this.requestPermission())) return;

      const now = Date.now();
      const notifications = tasks
        .filter((t) => !t.completed)
        .map((task) => {
          const due = parseISODate(task.dueDate);
          const [h, m] = (task.dueTime ?? '23:59').split(':').map(Number);
          due.setHours(h, m, 0, 0);
          const at = new Date(due.getTime() - settings.reminderHours * 3_600_000);
          const subject = subjects.find((s) => s.id === task.subjectId);
          return {
            id: this.numericId(task.id),
            title: `Tarea próxima a vencer: ${task.title}`,
            body: `${subject?.name ?? 'Materia'} · vence en ${settings.reminderHours} h`,
            schedule: { at, allowWhileIdle: true },
            extra: { taskId: task.id },
          };
        })
        .filter((n) => n.schedule.at.getTime() > now);

      if (notifications.length) {
        await LocalNotifications.schedule({ notifications });
      }
    } catch (err) {
      console.warn('No se pudieron programar los recordatorios', err);
    }
  }

  /** Las notificaciones locales requieren un id entero de 32 bits. */
  private numericId(id: string): number {
    let hash = 0;
    for (const ch of id) hash = (hash * 31 + ch.charCodeAt(0)) | 0;
    return Math.abs(hash);
  }
}
