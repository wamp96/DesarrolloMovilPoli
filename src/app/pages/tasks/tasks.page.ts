import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonAvatar,
  IonButton,
  IonChip,
  IonContent,
  IonFab,
  IonFabButton,
  IonIcon,
  IonSearchbar,
  IonSelect,
  IonSelectOption,
  IonToggle,
  ModalController,
  NavController,
} from '@ionic/angular';

import { TaskFormModal } from '../../components/task-form.modal';
import { TaskItemComponent } from '../../components/task-item.component';
import { AuthService } from '../../core/auth.service';
import { DataService } from '../../core/data.service';
import type { Priority, Task } from '../../core/models';
import { PRIORITIES } from '../../core/models';
import { UiService } from '../../core/ui.service';
import { PRIORITY_ORDER, daysUntil, greeting, initials } from '../../core/utils';

type SortBy = 'dueDate' | 'priority' | 'title';

/**
 * Página de Tareas (/tabs/tasks): listado de tareas pendientes y completadas con
 * búsqueda y filtrado por materia, estado y prioridad (RF-06).
 */
@Component({
  selector: 'app-tasks',
  imports: [
    FormsModule,
    TaskItemComponent,
    IonContent,
    IonAvatar,
    IonButton,
    IonIcon,
    IonSearchbar,
    IonChip,
    IonSelect,
    IonSelectOption,
    IonToggle,
    IonFab,
    IonFabButton,
  ],
  templateUrl: './tasks.page.html',
  styleUrl: './tasks.page.scss',
})
export class TasksPage {
  readonly auth = inject(AuthService);
  readonly data = inject(DataService);
  private readonly modal = inject(ModalController);
  private readonly nav = inject(NavController);
  private readonly ui = inject(UiService);

  readonly priorities = PRIORITIES;
  readonly initials = initials;
  readonly greeting = greeting();

  // Filtros
  readonly search = signal('');
  readonly priority = signal<Priority | 'todas'>('todas');
  readonly subjectFilter = signal<string>('todas');
  readonly sortBy = signal<SortBy>('dueDate');
  readonly hideCompleted = signal(false);
  readonly showFilters = signal(false);

  /** Resumen superior: % de avance, pendientes, que vencen esta semana y completadas. */
  readonly stats = computed(() => {
    const tasks = this.data.tasks();
    const completed = tasks.filter((t) => t.completed).length;
    const pending = tasks.length - completed;
    const thisWeek = tasks.filter((t) => !t.completed && daysUntil(t.dueDate) <= 7).length;
    const progress = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;
    return { completed, pending, thisWeek, progress };
  });

  readonly filtered = computed(() => {
    const q = this.search().trim().toLowerCase();
    const priority = this.priority();
    const subjectId = this.subjectFilter();
    const subjects = new Map(this.data.subjects().map((s) => [s.id, s]));

    const list = this.data.tasks().filter((t) => {
      if (this.hideCompleted() && t.completed) return false;
      if (priority !== 'todas' && t.priority !== priority) return false;
      if (subjectId !== 'todas' && t.subjectId !== subjectId) return false;
      if (q) {
        const subject = subjects.get(t.subjectId);
        const haystack = `${t.title} ${t.description ?? ''} ${subject?.name ?? ''}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
    return list.sort((a, b) => this.compare(a, b));
  });

  /** Tareas filtradas agrupadas por materia, como en el mockup. */
  readonly groups = computed(() => {
    const bySubject = new Map<string, Task[]>();
    for (const t of this.filtered()) {
      bySubject.set(t.subjectId, [...(bySubject.get(t.subjectId) ?? []), t]);
    }
    return this.data
      .subjects()
      .filter((s) => bySubject.has(s.id))
      .map((subject) => {
        const tasks = bySubject.get(subject.id)!;
        return { subject, tasks, pending: tasks.filter((t) => !t.completed).length };
      });
  });

  readonly hasActiveFilters = computed(
    () =>
      this.search().trim() !== '' ||
      this.priority() !== 'todas' ||
      this.subjectFilter() !== 'todas' ||
      this.hideCompleted(),
  );

  private compare(a: Task, b: Task): number {
    // Las pendientes van antes que las completadas.
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    switch (this.sortBy()) {
      case 'priority':
        return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] || a.dueDate.localeCompare(b.dueDate);
      case 'title':
        return a.title.localeCompare(b.title, 'es');
      default:
        return (
          `${a.dueDate} ${a.dueTime ?? '23:59'}`.localeCompare(`${b.dueDate} ${b.dueTime ?? '23:59'}`) ||
          PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
        );
    }
  }

  clearFilters(): void {
    this.search.set('');
    this.priority.set('todas');
    this.subjectFilter.set('todas');
    this.hideCompleted.set(false);
  }

  async toggle(task: Task, completed: boolean): Promise<void> {
    try {
      await this.data.setTaskCompleted(task.id, completed);
    } catch (err) {
      await this.ui.error(err);
    }
  }

  openTask(task: Task): void {
    void this.nav.navigateForward(['/tabs/tasks', task.id]);
  }

  openReminders(): void {
    void this.nav.navigateForward('/tabs/profile/settings');
  }

  async newTask(): Promise<void> {
    if (this.data.subjects().length === 0) {
      const go = await this.ui.confirm(
        'Sin materias',
        'Para crear una tarea primero debes registrar al menos una materia.',
        'Ir a Materias',
        false,
      );
      if (go) await this.nav.navigateRoot('/tabs/subjects');
      return;
    }
    const modal = await this.modal.create({ component: TaskFormModal });
    await modal.present();
  }
}
