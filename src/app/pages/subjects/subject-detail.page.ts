import { Component, computed, inject, input } from '@angular/core';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonTitle,
  IonToolbar,
  ModalController,
  NavController,
} from '@ionic/angular';

import { SubjectFormModal } from '../../components/subject-form.modal';
import { TaskFormModal } from '../../components/task-form.modal';
import { TaskItemComponent } from '../../components/task-item.component';
import { DataService } from '../../core/data.service';
import type { Task } from '../../core/models';
import { UiService } from '../../core/ui.service';

/** Detalle de Materia (/tabs/subjects/:id): datos, tareas asociadas, editar y eliminar (RF-03). */
@Component({
  selector: 'app-subject-detail',
  imports: [
    TaskItemComponent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonButton,
    IonIcon,
    IonContent,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/tabs/subjects" text=""></ion-back-button>
        </ion-buttons>
        <ion-title>Detalle de materia</ion-title>
        @if (subject()) {
          <ion-buttons slot="end">
            <ion-button (click)="edit()" aria-label="Editar materia">
              <ion-icon slot="icon-only" name="create-outline"></ion-icon>
            </ion-button>
          </ion-buttons>
        }
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      @if (subject(); as s) {
        <div class="detail card" [style.--accent]="s.color">
          <h1>{{ s.name }}</h1>
          <p class="meta"><ion-icon name="school-outline"></ion-icon> {{ s.teacher }}</p>
          <p class="meta"><ion-icon name="time-outline"></ion-icon> {{ s.schedule }}</p>
          @if (s.room) {
            <p class="meta"><ion-icon name="location-outline"></ion-icon> {{ s.room }}</p>
          }
        </div>

        <div class="section-title">
          <h2>Tareas ({{ tasks().length }})</h2>
          <ion-button size="small" fill="clear" (click)="newTask()">
            <ion-icon slot="start" name="add"></ion-icon>
            Agregar
          </ion-button>
        </div>
        @for (t of tasks(); track t.id) {
          <app-task-item [task]="t" [color]="s.color" (completedChange)="toggle(t, $event)" (open)="openTask(t)" />
        } @empty {
          <div class="empty empty--small">
            <p>Esta materia aún no tiene tareas.</p>
          </div>
        }

        <div class="actions">
          <ion-button expand="block" fill="outline" color="danger" (click)="remove()">
            <ion-icon slot="start" name="trash-outline"></ion-icon>
            Eliminar materia
          </ion-button>
        </div>
      } @else {
        <div class="empty">
          <h3>Materia no encontrada</h3>
          <p>Es posible que haya sido eliminada.</p>
        </div>
      }
    </ion-content>
  `,
})
export class SubjectDetailPage {
  private readonly data = inject(DataService);
  private readonly modal = inject(ModalController);
  private readonly nav = inject(NavController);
  private readonly ui = inject(UiService);

  readonly id = input.required<string>();
  readonly subject = computed(() => this.data.subjects().find((s) => s.id === this.id()));
  readonly tasks = computed(() =>
    this.data
      .tasks()
      .filter((t) => t.subjectId === this.id())
      .sort((a, b) => Number(a.completed) - Number(b.completed) || a.dueDate.localeCompare(b.dueDate)),
  );

  async edit(): Promise<void> {
    const modal = await this.modal.create({ component: SubjectFormModal, componentProps: { subject: this.subject() } });
    await modal.present();
  }

  async newTask(): Promise<void> {
    const modal = await this.modal.create({ component: TaskFormModal, componentProps: { presetSubjectId: this.id() } });
    await modal.present();
  }

  async toggle(task: Task, completed: boolean): Promise<void> {
    await this.data.setTaskCompleted(task.id, completed);
  }

  openTask(task: Task): void {
    void this.nav.navigateForward(['/tabs/tasks', task.id]);
  }

  async remove(): Promise<void> {
    const s = this.subject();
    if (!s) return;
    const count = this.tasks().length;
    const ok = await this.ui.confirm(
      'Eliminar materia',
      count
        ? `Se eliminará "${s.name}" junto con sus ${count} tarea(s). Esta acción no se puede deshacer.`
        : `¿Seguro que quieres eliminar "${s.name}"?`,
    );
    if (!ok) return;
    await this.data.deleteSubject(s.id);
    await this.ui.toast('Materia eliminada');
    await this.nav.navigateBack('/tabs/subjects');
  }
}
