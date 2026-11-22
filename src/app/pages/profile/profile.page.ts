import { Component, computed, inject } from '@angular/core';
import {
  IonAvatar,
  IonContent,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  ModalController,
  NavController,
} from '@ionic/angular';

import { ChangePasswordModal } from '../../components/change-password.modal';
import { ProfileFormModal } from '../../components/profile-form.modal';
import { AuthService } from '../../core/auth.service';
import { DataService } from '../../core/data.service';
import { UiService } from '../../core/ui.service';
import { initials } from '../../core/utils';

/** Página de Perfil (/tabs/profile): datos del usuario y opciones de cuenta (RF-09, RF-02). */
@Component({
  selector: 'app-profile',
  imports: [IonContent, IonAvatar, IonList, IonItem, IonIcon, IonLabel],
  template: `
    <ion-content [fullscreen]="true">
      <div class="page profile">
        @if (auth.user(); as u) {
          <ion-avatar class="avatar avatar--xl">
            @if (u.photo) {
              <img [src]="u.photo" alt="Foto de perfil" />
            } @else {
              <span>{{ initials(u.name) }}</span>
            }
          </ion-avatar>
          <h1>{{ u.name }}</h1>
          <p class="profile__email">{{ u.email }}</p>
          @if (u.career || u.semester) {
            <p class="profile__meta">
              {{ u.career }}{{ u.career && u.semester ? ' · ' : '' }}{{ u.semester ? 'Semestre ' + u.semester : '' }}
            </p>
          }
        }

        <div class="profile__stats card">
          <div>
            <strong>{{ stats().subjects }}</strong>
            <span>Materias</span>
          </div>
          <div>
            <strong>{{ stats().tasks }}</strong>
            <span>Tareas</span>
          </div>
          <div>
            <strong>{{ stats().rate }}%</strong>
            <span>Cumplimiento</span>
          </div>
        </div>

        <ion-list class="card card--flush" lines="inset">
          <ion-item button detail (click)="editProfile()">
            <ion-icon slot="start" name="person-circle-outline" color="primary"></ion-icon>
            <ion-label>Editar perfil</ion-label>
          </ion-item>
          <ion-item button detail (click)="changePassword()">
            <ion-icon slot="start" name="key-outline" color="primary"></ion-icon>
            <ion-label>Cambiar contraseña</ion-label>
          </ion-item>
          <ion-item button detail (click)="settings()">
            <ion-icon slot="start" name="settings-outline" color="primary"></ion-icon>
            <ion-label>Ajustes de cuenta y recordatorios</ion-label>
          </ion-item>
          <ion-item button detail="false" (click)="logout()">
            <ion-icon slot="start" name="log-out-outline" color="danger"></ion-icon>
            <ion-label color="danger">Cerrar sesión</ion-label>
          </ion-item>
        </ion-list>
      </div>
    </ion-content>
  `,
  styles: `
    .profile {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding-top: calc(var(--ion-safe-area-top, 0px) + 32px);
      text-align: center;

      h1 {
        margin: 12px 0 2px;
        font-size: 22px;
        font-weight: 800;
      }
      ion-list {
        width: 100%;
        margin-top: 16px;
      }
    }
    .profile__email {
      margin: 0;
      color: var(--ion-color-medium);
      font-size: 14px;
    }
    .profile__meta {
      margin: 4px 0 0;
      color: var(--ion-color-medium);
      font-size: 13px;
    }
    .profile__stats {
      width: 100%;
      margin-top: 20px;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      div {
        display: flex;
        flex-direction: column;
      }
      strong {
        font-size: 20px;
        color: var(--ion-color-primary-shade);
      }
      span {
        font-size: 12px;
        color: var(--ion-color-medium);
      }
    }
  `,
})
export class ProfilePage {
  readonly auth = inject(AuthService);
  private readonly data = inject(DataService);
  private readonly modal = inject(ModalController);
  private readonly nav = inject(NavController);
  private readonly ui = inject(UiService);

  readonly initials = initials;

  readonly stats = computed(() => {
    const tasks = this.data.tasks();
    const done = tasks.filter((t) => t.completed).length;
    return {
      subjects: this.data.subjects().length,
      tasks: tasks.length,
      rate: tasks.length ? Math.round((done / tasks.length) * 100) : 0,
    };
  });

  async editProfile(): Promise<void> {
    const modal = await this.modal.create({ component: ProfileFormModal });
    await modal.present();
  }

  async changePassword(): Promise<void> {
    const modal = await this.modal.create({ component: ChangePasswordModal });
    await modal.present();
  }

  settings(): void {
    void this.nav.navigateForward('/tabs/profile/settings');
  }

  /** Alerta de confirmación antes de cerrar sesión (RF-02). */
  async logout(): Promise<void> {
    const ok = await this.ui.confirm(
      'Cerrar sesión',
      '¿Quieres cerrar tu sesión en este dispositivo?',
      'Cerrar sesión',
      false,
    );
    if (!ok) return;
    await this.auth.logout();
    await this.nav.navigateRoot('/auth/login');
  }
}
