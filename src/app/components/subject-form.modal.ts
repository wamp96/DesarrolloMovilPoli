import type { OnInit } from '@angular/core';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonInput,
  IonTitle,
  IonToolbar,
  ModalController,
} from '@ionic/angular';

import { DataService } from '../core/data.service';
import type { Subject } from '../core/models';
import { SUBJECT_COLORS } from '../core/models';
import { UiService } from '../core/ui.service';

/** Formulario para crear o editar una materia (RF-03). */
@Component({
  selector: 'app-subject-form',
  imports: [FormsModule, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonInput],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button (click)="close()">Cancelar</ion-button>
        </ion-buttons>
        <ion-title>{{ subject ? 'Editar materia' : 'Nueva materia' }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <div class="form">
        <ion-input
          label="Nombre *"
          labelPlacement="stacked"
          fill="outline"
          placeholder="Ej. Cálculo Integral"
          [(ngModel)]="name"
        ></ion-input>
        <ion-input
          label="Docente *"
          labelPlacement="stacked"
          fill="outline"
          placeholder="Ej. Dr. Andrés Mejía"
          [(ngModel)]="teacher"
        ></ion-input>
        <ion-input
          label="Horario *"
          labelPlacement="stacked"
          fill="outline"
          placeholder="Ej. Lun y Mié 08:00 - 10:00"
          [(ngModel)]="schedule"
        ></ion-input>
        <ion-input
          label="Aula / lugar"
          labelPlacement="stacked"
          fill="outline"
          placeholder="Ej. Aula 304 · Bloque B"
          [(ngModel)]="room"
        ></ion-input>
        <div>
          <p class="form__label">Color</p>
          <div class="color-picker">
            @for (c of colors; track c) {
              <button
                type="button"
                class="color-picker__dot"
                [class.color-picker__dot--active]="c === color"
                [style.background]="c"
                [attr.aria-label]="'Color ' + c"
                (click)="color = c"
              ></button>
            }
          </div>
        </div>
        <ion-button expand="block" (click)="save()">Guardar materia</ion-button>
      </div>
    </ion-content>
  `,
})
export class SubjectFormModal implements OnInit {
  private readonly data = inject(DataService);
  private readonly modalCtrl = inject(ModalController);
  private readonly ui = inject(UiService);

  subject?: Subject;

  readonly colors = SUBJECT_COLORS;
  name = '';
  teacher = '';
  schedule = '';
  room = '';
  color = SUBJECT_COLORS[0]!;

  ngOnInit(): void {
    if (this.subject) {
      this.name = this.subject.name;
      this.teacher = this.subject.teacher;
      this.schedule = this.subject.schedule;
      this.room = this.subject.room ?? '';
      this.color = this.subject.color;
    } else {
      this.color = SUBJECT_COLORS[this.data.subjects().length % SUBJECT_COLORS.length]!;
    }
  }

  close(): void {
    void this.modalCtrl.dismiss(null, 'cancel');
  }

  async save(): Promise<void> {
    if (!this.name.trim() || !this.teacher.trim() || !this.schedule.trim()) {
      await this.ui.toast('Completa el nombre, el docente y el horario.', 'danger');
      return;
    }
    const input = {
      name: this.name.trim(),
      teacher: this.teacher.trim(),
      schedule: this.schedule.trim(),
      room: this.room.trim() || undefined,
      color: this.color,
    };
    try {
      if (this.subject) {
        await this.data.updateSubject(this.subject.id, input);
        await this.ui.toast('Materia actualizada');
      } else {
        await this.data.addSubject(input);
        await this.ui.toast('Materia creada');
      }
      await this.modalCtrl.dismiss(true, 'saved');
    } catch (err) {
      await this.ui.error(err);
    }
  }
}
