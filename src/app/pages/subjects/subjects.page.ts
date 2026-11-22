import { Component, computed, inject } from '@angular/core';
import {
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

import { SubjectFormModal } from '../../components/subject-form.modal';
import { DataService } from '../../core/data.service';
import type { Subject } from '../../core/models';

/** Página de Materias (/tabs/subjects) con el avance de tareas de cada una (RF-03). */
@Component({
  selector: 'app-subjects',
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonFab, IonFabButton, IonIcon],
  template: `
    <ion-header [translucent]="true">
      <ion-toolbar>
        <ion-title>Materias</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content [fullscreen]="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Materias</ion-title>
        </ion-toolbar>
      </ion-header>

      <div class="page">
        <p class="page__sub">
          {{ rows().length }} {{ rows().length === 1 ? 'materia inscrita' : 'materias inscritas' }}
        </p>

        @for (r of rows(); track r.subject.id) {
          <button class="subject card" type="button" (click)="open(r.subject)">
            <span class="subject__icon" [style.background]="r.subject.color + '22'" [style.color]="r.subject.color">
              {{ r.subject.name.charAt(0) }}
            </span>
            <span class="subject__body">
              <strong>{{ r.subject.name }}</strong>
              <span class="subject__meta">{{ r.subject.teacher }} · {{ r.subject.schedule }}</span>
              <span class="bar"><span [style.width.%]="r.progress" [style.background]="r.subject.color"></span></span>
              <span class="subject__meta">{{ r.done }}/{{ r.total }} tareas completadas</span>
            </span>
            <span class="subject__count">{{ r.pending }}<small>pend.</small></span>
          </button>
        } @empty {
          <div class="empty">
            <h3>Aún no tienes materias</h3>
            <p>Registra tus materias para poder asociarles tareas. Toca el botón +.</p>
          </div>
        }
      </div>

      <ion-fab slot="fixed" vertical="bottom" horizontal="end">
        <ion-fab-button (click)="create()" aria-label="Nueva materia">
          <ion-icon name="add"></ion-icon>
        </ion-fab-button>
      </ion-fab>
    </ion-content>
  `,
})
export class SubjectsPage {
  private readonly data = inject(DataService);
  private readonly modal = inject(ModalController);
  private readonly nav = inject(NavController);

  readonly rows = computed(() =>
    this.data.subjects().map((subject) => {
      const tasks = this.data.tasks().filter((t) => t.subjectId === subject.id);
      const done = tasks.filter((t) => t.completed).length;
      return {
        subject,
        total: tasks.length,
        done,
        pending: tasks.length - done,
        progress: tasks.length ? (done / tasks.length) * 100 : 0,
      };
    }),
  );

  open(subject: Subject): void {
    void this.nav.navigateForward(['/tabs/subjects', subject.id]);
  }

  async create(): Promise<void> {
    const modal = await this.modal.create({ component: SubjectFormModal });
    await modal.present();
  }
}
