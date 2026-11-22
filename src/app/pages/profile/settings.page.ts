import type { OnInit } from '@angular/core';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Capacitor } from '@capacitor/core';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonNote,
  IonSelect,
  IonSelectOption,
  IonTitle,
  IonToggle,
  IonToolbar,
  NavController,
} from '@ionic/angular';

import { AuthService } from '../../core/auth.service';
import { DataService } from '../../core/data.service';
import { NotificationService } from '../../core/notification.service';
import { UiService } from '../../core/ui.service';

/** Ajustes de Cuenta (/tabs/profile/settings): recordatorios (RF-08) y eliminación de la cuenta. */
@Component({
  selector: 'app-settings',
  imports: [
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonButton,
    IonContent,
    IonList,
    IonListHeader,
    IonItem,
    IonLabel,
    IonToggle,
    IonSelect,
    IonSelectOption,
    IonNote,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/tabs/profile" text=""></ion-back-button>
        </ion-buttons>
        <ion-title>Ajustes de cuenta</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-list class="card card--flush" lines="inset">
        <ion-list-header>Recordatorios</ion-list-header>
        <ion-item>
          <ion-toggle [(ngModel)]="notifications" (ionChange)="save()">Avisarme de tareas próximas a vencer</ion-toggle>
        </ion-item>
        <ion-item [disabled]="!notifications">
          <ion-select
            label="Anticipación"
            interface="action-sheet"
            cancelText="Cancelar"
            [(ngModel)]="reminderHours"
            (ionChange)="save()"
          >
            <ion-select-option [value]="1">1 hora antes</ion-select-option>
            <ion-select-option [value]="3">3 horas antes</ion-select-option>
            <ion-select-option [value]="24">1 día antes</ion-select-option>
            <ion-select-option [value]="48">2 días antes</ion-select-option>
            <ion-select-option [value]="72">3 días antes</ion-select-option>
          </ion-select>
        </ion-item>
        @if (!isNative) {
          <ion-item lines="none">
            <ion-note>Los recordatorios se muestran en la app instalada en Android/iOS, no en el navegador.</ion-note>
          </ion-item>
        }
      </ion-list>

      <ion-list class="card card--flush" lines="inset">
        <ion-list-header>Almacenamiento</ion-list-header>
        <ion-item lines="none">
          <ion-label class="ion-text-wrap">
            <p>
              Tus materias, tareas y eventos se guardan únicamente en este dispositivo. Si desinstalas la app, se
              perderán.
            </p>
          </ion-label>
        </ion-item>
      </ion-list>

      <div class="actions">
        <ion-button expand="block" fill="outline" color="danger" (click)="deleteAccount()"
          >Eliminar mi cuenta</ion-button
        >
      </div>
      <p class="version">GestU v0.5 · Entrega 2</p>
    </ion-content>
  `,
  styles: `
    ion-list {
      margin-bottom: 16px;
    }
    .version {
      text-align: center;
      color: var(--ion-color-medium);
      font-size: 12px;
    }
  `,
})
export class SettingsPage implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly data = inject(DataService);
  private readonly notificationsSvc = inject(NotificationService);
  private readonly nav = inject(NavController);
  private readonly ui = inject(UiService);

  readonly isNative = Capacitor.isNativePlatform();
  notifications = true;
  reminderHours = 24;

  ngOnInit(): void {
    const s = this.auth.user()?.settings;
    if (s) {
      this.notifications = s.notifications;
      this.reminderHours = s.reminderHours;
    }
  }

  async save(): Promise<void> {
    await this.auth.updateSettings({ notifications: this.notifications, reminderHours: this.reminderHours });
    if (this.notifications && this.isNative && !(await this.notificationsSvc.requestPermission())) {
      await this.ui.toast('Activa los permisos de notificación en los ajustes del teléfono.', 'medium');
    }
    await this.data.syncReminders();
  }

  async deleteAccount(): Promise<void> {
    const ok = await this.ui.confirm(
      'Eliminar cuenta',
      'Se borrarán tu cuenta y todas tus materias, tareas y eventos de este dispositivo. Esta acción no se puede deshacer.',
    );
    if (!ok) return;
    await this.data.deleteAllForCurrentUser();
    await this.auth.deleteAccount();
    await this.ui.toast('Cuenta eliminada', 'medium');
    await this.nav.navigateRoot('/auth/login');
  }
}
