import type { OnInit } from '@angular/core';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonInput,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  IonTitle,
  IonToolbar,
  ModalController,
} from '@ionic/angular';

import { DataService } from '../core/data.service';
import type { Priority, Task } from '../core/models';
import { PRIORITIES } from '../core/models';
import { UiService } from '../core/ui.service';
import { today } from '../core/utils';

/** Formulario para crear o editar una tarea (RF-04, RF-05). */
@Component({
  selector: 'app-task-form',
  imports: [
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonInput,
    IonTextarea,
    IonSelect,
    IonSelectOption,
    IonSegment,
    IonSegmentButton,
    IonLabel,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button (click)="close()">Cancelar</ion-button>
        </ion-buttons>
        <ion-title>{{ task ? 'Editar tarea' : 'Nueva tarea' }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      @if (data.subjects().length === 0) {
        <div class="empty">
          <h3>Primero registra una materia</h3>
          <p>Cada tarea debe estar asociada a una materia.</p>
        </div>
      } @else {
        <div class="form">
          <ion-input
            label="Título *"
            labelPlacement="stacked"
            fill="outline"
            placeholder="Ej. Taller de derivadas"
            [(ngModel)]="title"
          ></ion-input>
          <ion-textarea
            label="Descripción"
            labelPlacement="stacked"
            fill="outline"
            [autoGrow]="true"
            [(ngModel)]="description"
          ></ion-textarea>
          <ion-select
            label="Materia *"
            labelPlacement="stacked"
            fill="outline"
            interface="action-sheet"
            cancelText="Cancelar"
            [(ngModel)]="subjectId"
          >
            @for (s of data.subjects(); track s.id) {
              <ion-select-option [value]="s.id">{{ s.name }}</ion-select-option>
            }
          </ion-select>
          <div class="form__row">
            <ion-input
              label="Fecha límite *"
              labelPlacement="stacked"
              fill="outline"
              type="date"
              [(ngModel)]="dueDate"
            ></ion-input>
            <ion-input
              label="Hora"
              labelPlacement="stacked"
              fill="outline"
              type="time"
              [(ngModel)]="dueTime"
            ></ion-input>
          </div>
          <div>
            <p class="form__label">Prioridad *</p>
            <ion-segment [(ngModel)]="priority">
              @for (p of priorities; track p.value) {
                <ion-segment-button [value]="p.value">
                  <ion-label>{{ p.label }}</ion-label>
                </ion-segment-button>
              }
            </ion-segment>
          </div>
          <ion-button expand="block" (click)="save()">Guardar tarea</ion-button>
        </div>
      }
    </ion-content>
  `,
})
export class TaskFormModal implements OnInit {
  readonly data = inject(DataService);
  private readonly modalCtrl = inject(ModalController);
  private readonly ui = inject(UiService);

  /** Tarea a editar; si no se envía, se crea una nueva. */
  task?: Task;
  /** Materia preseleccionada al crear desde el detalle de una materia. */
  presetSubjectId?: string;
  /** Fecha preseleccionada al crear desde el calendario. */
  presetDate?: string;

  readonly priorities = PRIORITIES;
  title = '';
  description = '';
  subjectId = '';
  dueDate = today();
  dueTime = '';
  priority: Priority = 'media';

  ngOnInit(): void {
    if (this.task) {
      this.title = this.task.title;
      this.description = this.task.description ?? '';
      this.subjectId = this.task.subjectId;
      this.dueDate = this.task.dueDate;
      this.dueTime = this.task.dueTime ?? '';
      this.priority = this.task.priority;
    } else {
      this.subjectId = this.presetSubjectId ?? this.data.subjects()[0]?.id ?? '';
      this.dueDate = this.presetDate ?? today();
    }
  }

  close(): void {
    void this.modalCtrl.dismiss(null, 'cancel');
  }

  async save(): Promise<void> {
    if (!this.title.trim() || !this.subjectId || !this.dueDate) {
      await this.ui.toast('Completa el título, la materia y la fecha límite.', 'danger');
      return;
    }
    const input = {
      title: this.title.trim(),
      description: this.description.trim() || undefined,
      subjectId: this.subjectId,
      dueDate: this.dueDate,
      dueTime: this.dueTime || undefined,
      priority: this.priority,
    };
    try {
      if (this.task) {
        await this.data.updateTask(this.task.id, input);
        await this.ui.toast('Tarea actualizada');
      } else {
        await this.data.addTask(input);
        await this.ui.toast('Tarea creada');
      }
      await this.modalCtrl.dismiss(true, 'saved');
    } catch (err) {
      await this.ui.error(err);
    }
  }
}
