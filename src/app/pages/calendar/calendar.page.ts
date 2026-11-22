import { Component, computed, inject, signal } from '@angular/core';
import {
  ActionSheetController,
  IonButton,
  IonButtons,
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonTitle,
  IonToolbar,
  ModalController,
  NavController,
} from '@ionic/angular';

import { EventFormModal } from '../../components/event-form.modal';
import { TaskFormModal } from '../../components/task-form.modal';
import { DataService } from '../../core/data.service';
import type { CalendarEvent, Task } from '../../core/models';
import { UiService } from '../../core/ui.service';
import { WEEKDAYS_SHORT, monthLabel, parseISODate, priorityLabel, toISODate, today } from '../../core/utils';

interface AgendaItem {
  kind: 'task' | 'event';
  time: string;
  title: string;
  subtitle: string;
  color: string;
  done?: boolean;
  task?: Task;
  event?: CalendarEvent;
}

/**
 * Calendario académico (/tabs/calendar): muestra por día las entregas de tareas y los
 * eventos registrados, con indicadores en los días que tienen actividades (RF-07).
 */
@Component({
  selector: 'app-calendar',
  imports: [IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon, IonContent, IonFab, IonFabButton],
  templateUrl: './calendar.page.html',
  styleUrl: './calendar.page.scss',
})
export class CalendarPage {
  private readonly data = inject(DataService);
  private readonly modal = inject(ModalController);
  private readonly nav = inject(NavController);
  private readonly sheet = inject(ActionSheetController);
  private readonly ui = inject(UiService);

  readonly selected = signal(today());
  /** Lunes de la semana visible. */
  readonly weekStart = signal(this.mondayOf(today()));

  readonly title = computed(() => monthLabel(parseISODate(this.selected())));

  readonly week = computed(() => {
    const start = parseISODate(this.weekStart());
    const busy = this.busyDays();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const iso = toISODate(d);
      return {
        iso,
        day: d.getDate(),
        label: WEEKDAYS_SHORT[d.getDay()],
        busy: busy.has(iso),
        isToday: iso === today(),
      };
    });
  });

  /** Días que tienen tareas pendientes o eventos. */
  private readonly busyDays = computed(() => {
    const set = new Set<string>();
    for (const t of this.data.tasks()) if (!t.completed) set.add(t.dueDate);
    for (const e of this.data.events()) set.add(e.date);
    return set;
  });

  readonly agenda = computed<AgendaItem[]>(() => {
    const day = this.selected();
    const subjects = new Map(this.data.subjects().map((s) => [s.id, s]));
    const tasks: AgendaItem[] = this.data
      .tasks()
      .filter((t) => t.dueDate === day)
      .map((t) => {
        const s = subjects.get(t.subjectId);
        return {
          kind: 'task',
          time: t.dueTime ?? '23:59',
          title: `Entrega: ${t.title}`,
          subtitle: `${s?.name ?? 'Materia'} · Prioridad ${priorityLabel(t.priority)}`,
          color: s?.color ?? '#2563eb',
          done: t.completed,
          task: t,
        };
      });
    const events: AgendaItem[] = this.data
      .events()
      .filter((e) => e.date === day)
      .map((e) => {
        const s = e.subjectId ? subjects.get(e.subjectId) : undefined;
        return {
          kind: 'event',
          time: e.time,
          title: e.title,
          subtitle: [e.location, s?.name].filter(Boolean).join(' · ') || 'Evento',
          color: s?.color ?? '#64748b',
          event: e,
        };
      });
    return [...tasks, ...events].sort((a, b) => a.time.localeCompare(b.time));
  });

  readonly isToday = computed(() => this.selected() === today());

  shiftWeek(delta: number): void {
    const d = parseISODate(this.weekStart());
    d.setDate(d.getDate() + delta * 7);
    this.weekStart.set(toISODate(d));
    const sel = parseISODate(this.selected());
    sel.setDate(sel.getDate() + delta * 7);
    this.selected.set(toISODate(sel));
  }

  goToday(): void {
    this.selected.set(today());
    this.weekStart.set(this.mondayOf(today()));
  }

  async open(item: AgendaItem): Promise<void> {
    if (item.task) {
      void this.nav.navigateForward(['/tabs/tasks', item.task.id]);
    } else if (item.event) {
      await this.openEvent(item.event);
    }
  }

  /** Panel de Detalle de Evento con las acciones editar y eliminar. */
  private async openEvent(event: CalendarEvent): Promise<void> {
    const sheet = await this.sheet.create({
      header: event.title,
      subHeader: [event.time, event.location, event.notes].filter(Boolean).join(' · '),
      buttons: [
        { text: 'Editar evento', icon: 'create-outline', data: 'edit' },
        { text: 'Eliminar evento', icon: 'trash-outline', role: 'destructive', data: 'delete' },
        { text: 'Cerrar', role: 'cancel' },
      ],
    });
    await sheet.present();
    const { data } = await sheet.onDidDismiss<string>();
    if (data === 'edit') {
      const modal = await this.modal.create({ component: EventFormModal, componentProps: { event } });
      await modal.present();
    } else if (data === 'delete') {
      const ok = await this.ui.confirm('Eliminar evento', `¿Seguro que quieres eliminar "${event.title}"?`);
      if (ok) {
        await this.data.deleteEvent(event.id);
        await this.ui.toast('Evento eliminado');
      }
    }
  }

  async add(): Promise<void> {
    const sheet = await this.sheet.create({
      header: 'Agregar al calendario',
      buttons: [
        { text: 'Nuevo evento', icon: 'calendar-outline', data: 'event' },
        { text: 'Nueva tarea', icon: 'clipboard-outline', data: 'task' },
        { text: 'Cancelar', role: 'cancel' },
      ],
    });
    await sheet.present();
    const { data } = await sheet.onDidDismiss<string>();
    if (data === 'event') {
      const modal = await this.modal.create({
        component: EventFormModal,
        componentProps: { presetDate: this.selected() },
      });
      await modal.present();
    } else if (data === 'task') {
      const modal = await this.modal.create({
        component: TaskFormModal,
        componentProps: { presetDate: this.selected() },
      });
      await modal.present();
    }
  }

  private mondayOf(iso: string): string {
    const d = parseISODate(iso);
    const offset = (d.getDay() + 6) % 7; // lunes = 0
    d.setDate(d.getDate() - offset);
    return toISODate(d);
  }
}
