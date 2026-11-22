import type { OnInit } from '@angular/core';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  IonTitle,
  IonToolbar,
  ModalController,
} from '@ionic/angular';

import { DataService } from '../core/data.service';
import type { CalendarEvent } from '../core/models';
import { UiService } from '../core/ui.service';
import { today } from '../core/utils';

/** Formulario de evento del calendario académico: clases, tutorías, exámenes (RF-07). */
@Component({
  selector: 'app-event-form',
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
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button (click)="close()">Cancelar</ion-button>
        </ion-buttons>
        <ion-title>{{ event ? 'Editar evento' : 'Nuevo evento' }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <div class="form">
        <ion-input
          label="Título *"
          labelPlacement="stacked"
          fill="outline"
          placeholder="Ej. Tutoría grupal"
          [(ngModel)]="title"
        ></ion-input>
        <div class="form__row">
          <ion-input label="Fecha *" labelPlacement="stacked" fill="outline" type="date" [(ngModel)]="date"></ion-input>
          <ion-input label="Hora *" labelPlacement="stacked" fill="outline" type="time" [(ngModel)]="time"></ion-input>
        </div>
        <ion-input
          label="Lugar"
          labelPlacement="stacked"
          fill="outline"
          placeholder="Ej. Biblioteca central"
          [(ngModel)]="location"
        ></ion-input>
        <ion-select
          label="Materia (opcional)"
          labelPlacement="stacked"
          fill="outline"
          interface="action-sheet"
          cancelText="Cancelar"
          [(ngModel)]="subjectId"
        >
          <ion-select-option value="">Ninguna</ion-select-option>
          @for (s of data.subjects(); track s.id) {
            <ion-select-option [value]="s.id">{{ s.name }}</ion-select-option>
          }
        </ion-select>
        <ion-textarea
          label="Notas"
          labelPlacement="stacked"
          fill="outline"
          [autoGrow]="true"
          [(ngModel)]="notes"
        ></ion-textarea>
        <ion-button expand="block" (click)="save()">Guardar evento</ion-button>
      </div>
    </ion-content>
  `,
})
export class EventFormModal implements OnInit {
  readonly data = inject(DataService);
  private readonly modalCtrl = inject(ModalController);
  private readonly ui = inject(UiService);

  event?: CalendarEvent;
  presetDate?: string;

  title = '';
  date = today();
  time = '08:00';
  location = '';
  subjectId = '';
  notes = '';

  ngOnInit(): void {
    if (this.event) {
      this.title = this.event.title;
      this.date = this.event.date;
      this.time = this.event.time;
      this.location = this.event.location ?? '';
      this.subjectId = this.event.subjectId ?? '';
      this.notes = this.event.notes ?? '';
    } else if (this.presetDate) {
      this.date = this.presetDate;
    }
  }

  close(): void {
    void this.modalCtrl.dismiss(null, 'cancel');
  }

  async save(): Promise<void> {
    if (!this.title.trim() || !this.date || !this.time) {
      await this.ui.toast('Completa el título, la fecha y la hora.', 'danger');
      return;
    }
    const input = {
      title: this.title.trim(),
      date: this.date,
      time: this.time,
      location: this.location.trim() || undefined,
      subjectId: this.subjectId || undefined,
      notes: this.notes.trim() || undefined,
    };
    try {
      if (this.event) {
        await this.data.updateEvent(this.event.id, input);
        await this.ui.toast('Evento actualizado');
      } else {
        await this.data.addEvent(input);
        await this.ui.toast('Evento creado');
      }
      await this.modalCtrl.dismiss(true, 'saved');
    } catch (err) {
      await this.ui.error(err);
    }
  }
}
