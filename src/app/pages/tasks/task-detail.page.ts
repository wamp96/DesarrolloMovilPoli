import { Component, computed, inject, input } from '@angular/core';
import {
  ActionSheetController,
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonTitle,
  IonToolbar,
  ModalController,
  NavController,
} from '@ionic/angular';

import { TaskFormModal } from '../../components/task-form.modal';
import { DataService } from '../../core/data.service';
import { UiService } from '../../core/ui.service';
import { priorityColor, priorityLabel, relativeDue, shortDate } from '../../core/utils';

/** Detalle de Tarea (/tabs/tasks/:id): editar, cambiar estado y eliminar (RF-04). */
@Component({
  selector: 'app-task-detail',
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonButton,
    IonIcon,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/tabs/tasks" text=""></ion-back-button>
        </ion-buttons>
        <ion-title>Detalle de tarea</ion-title>
        @if (task()) {
          <ion-buttons slot="end">
            <ion-button (click)="edit()" aria-label="Editar tarea">
              <ion-icon slot="icon-only" name="create-outline"></ion-icon>
            </ion-button>
          </ion-buttons>
        }
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      @if (task(); as t) {
        <div class="detail card" [style.--accent]="subject()?.color">
          <span class="pill pill--{{ priorityColor(t.priority) }}">Prioridad {{ priorityLabel(t.priority) }}</span>
          <h1 [class.done]="t.completed">{{ t.title }}</h1>
          @if (t.description) {
            <p>{{ t.description }}</p>
          }
        </div>

        <ion-list class="card card--flush" lines="inset">
          <ion-item button (click)="openSubject()">
            <ion-icon slot="start" name="book-outline" color="primary"></ion-icon>
            <ion-label>
              <p>Materia</p>
              <h3>{{ subject()?.name ?? 'Sin materia' }}</h3>
            </ion-label>
          </ion-item>
          <ion-item>
            <ion-icon slot="start" name="calendar-outline" color="primary"></ion-icon>
            <ion-label>
              <p>Fecha límite</p>
              <h3>{{ shortDate(t.dueDate) }}{{ t.dueTime ? ' · ' + t.dueTime : '' }} ({{ relativeDue(t.dueDate) }})</h3>
            </ion-label>
          </ion-item>
          <ion-item button (click)="changeState()">
            <ion-icon
              slot="start"
              [name]="t.completed ? 'checkmark-circle' : 'ellipse-outline'"
              [color]="t.completed ? 'success' : 'medium'"
            ></ion-icon>
            <ion-label>
              <p>Estado</p>
              <h3>{{ t.completed ? 'Completada' : 'Pendiente' }}</h3>
            </ion-label>
          </ion-item>
        </ion-list>

        <div class="actions">
          <ion-button expand="block" (click)="toggle()">
            {{ t.completed ? 'Marcar como pendiente' : 'Marcar como completada' }}
          </ion-button>
          <ion-button expand="block" fill="outline" color="danger" (click)="remove()">
            <ion-icon slot="start" name="trash-outline"></ion-icon>
            Eliminar tarea
          </ion-button>
        </div>
      } @else {
        <div class="empty">
          <h3>Tarea no encontrada</h3>
          <p>Es posible que haya sido eliminada.</p>
        </div>
      }
    </ion-content>
  `,
})
export class TaskDetailPage {
  private readonly data = inject(DataService);
  private readonly modal = inject(ModalController);
  private readonly nav = inject(NavController);
  private readonly sheet = inject(ActionSheetController);
  private readonly ui = inject(UiService);

  /** Parámetro :id de la ruta. */
  readonly id = input.required<string>();
  readonly task = computed(() => this.data.tasks().find((t) => t.id === this.id()));
  readonly subject = computed(() => {
    const t = this.task();
    return t ? this.data.subjectById(t.subjectId) : undefined;
  });

  readonly priorityColor = priorityColor;
  readonly priorityLabel = priorityLabel;
  readonly shortDate = shortDate;
  readonly relativeDue = relativeDue;

  async edit(): Promise<void> {
    const modal = await this.modal.create({ component: TaskFormModal, componentProps: { task: this.task() } });
    await modal.present();
  }

  /** Panel de Estado de Tarea. */
  async changeState(): Promise<void> {
    const t = this.task();
    if (!t) return;
    const sheet = await this.sheet.create({
      header: 'Estado de la tarea',
      buttons: [
        { text: 'Pendiente', icon: 'ellipse-outline', data: false },
        { text: 'Completada', icon: 'checkmark-circle-outline', data: true },
        { text: 'Cancelar', role: 'cancel' },
      ],
    });
    await sheet.present();
    const { data, role } = await sheet.onDidDismiss<boolean>();
    if (role !== 'cancel' && typeof data === 'boolean' && data !== t.completed) {
      await this.data.setTaskCompleted(t.id, data);
      await this.ui.toast(data ? 'Tarea completada' : 'Tarea marcada como pendiente');
    }
  }

  async toggle(): Promise<void> {
    const t = this.task();
    if (!t) return;
    await this.data.setTaskCompleted(t.id, !t.completed);
    await this.ui.toast(t.completed ? 'Tarea marcada como pendiente' : '¡Tarea completada!');
  }

  async remove(): Promise<void> {
    const t = this.task();
    if (!t) return;
    const ok = await this.ui.confirm(
      'Eliminar tarea',
      `¿Seguro que quieres eliminar "${t.title}"? Esta acción no se puede deshacer.`,
    );
    if (!ok) return;
    await this.data.deleteTask(t.id);
    await this.ui.toast('Tarea eliminada');
    await this.nav.navigateBack('/tabs/tasks');
  }

  openSubject(): void {
    const s = this.subject();
    if (s) void this.nav.navigateForward(['/tabs/subjects', s.id]);
  }
}
