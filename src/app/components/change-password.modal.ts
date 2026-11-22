import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonInput,
  IonInputPasswordToggle,
  IonTitle,
  IonToolbar,
  ModalController,
} from '@ionic/angular';

import { AuthService } from '../core/auth.service';
import { UiService } from '../core/ui.service';

/** Cambiar la contraseña de la cuenta actual. */
@Component({
  selector: 'app-change-password',
  imports: [
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonInput,
    IonInputPasswordToggle,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button (click)="close()">Cancelar</ion-button>
        </ion-buttons>
        <ion-title>Cambiar contraseña</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <div class="form">
        <ion-input
          label="Contraseña actual"
          labelPlacement="stacked"
          fill="outline"
          type="password"
          [(ngModel)]="current"
        >
          <ion-input-password-toggle slot="end"></ion-input-password-toggle>
        </ion-input>
        <ion-input
          label="Nueva contraseña (mín. 6 caracteres)"
          labelPlacement="stacked"
          fill="outline"
          type="password"
          [(ngModel)]="next"
        >
          <ion-input-password-toggle slot="end"></ion-input-password-toggle>
        </ion-input>
        <ion-input
          label="Confirmar nueva contraseña"
          labelPlacement="stacked"
          fill="outline"
          type="password"
          [(ngModel)]="confirm"
        ></ion-input>
        <ion-button expand="block" (click)="save()">Actualizar contraseña</ion-button>
      </div>
    </ion-content>
  `,
})
export class ChangePasswordModal {
  private readonly auth = inject(AuthService);
  private readonly modalCtrl = inject(ModalController);
  private readonly ui = inject(UiService);

  current = '';
  next = '';
  confirm = '';

  close(): void {
    void this.modalCtrl.dismiss(null, 'cancel');
  }

  async save(): Promise<void> {
    if (this.next.length < 6) {
      await this.ui.toast('La nueva contraseña debe tener al menos 6 caracteres.', 'danger');
      return;
    }
    if (this.next !== this.confirm) {
      await this.ui.toast('Las contraseñas no coinciden.', 'danger');
      return;
    }
    try {
      await this.auth.changePassword(this.current, this.next);
      await this.ui.toast('Contraseña actualizada');
      await this.modalCtrl.dismiss(true, 'saved');
    } catch (err) {
      await this.ui.error(err);
    }
  }
}
