import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonInput,
  IonInputPasswordToggle,
  IonTitle,
  IonToolbar,
  NavController,
} from '@ionic/angular';

import { AuthService } from '../../core/auth.service';
import { UiService } from '../../core/ui.service';
import { isValidEmail } from '../../core/utils';

/**
 * Recuperar contraseña (RF-02). Como la app es standalone y no tiene servidor de correo,
 * la identidad se verifica con la pregunta de seguridad definida en el registro.
 */
@Component({
  selector: 'app-forgot-password',
  imports: [
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonContent,
    IonInput,
    IonInputPasswordToggle,
    IonButton,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/auth/login" text=""></ion-back-button>
        </ion-buttons>
        <ion-title>Recuperar contraseña</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="form">
        @if (!question()) {
          <p class="form__hint">Ingresa el correo con el que te registraste.</p>
          <ion-input
            label="Correo electrónico"
            labelPlacement="stacked"
            fill="outline"
            type="email"
            [(ngModel)]="email"
          ></ion-input>
          <ion-button expand="block" (click)="findAccount()">Continuar</ion-button>
        } @else {
          <p class="form__hint">Responde tu pregunta de seguridad y define una nueva contraseña.</p>
          <p class="form__question">{{ question() }}</p>
          <ion-input label="Respuesta" labelPlacement="stacked" fill="outline" [(ngModel)]="answer"></ion-input>
          <ion-input
            label="Nueva contraseña (mín. 6 caracteres)"
            labelPlacement="stacked"
            fill="outline"
            type="password"
            [(ngModel)]="password"
          >
            <ion-input-password-toggle slot="end"></ion-input-password-toggle>
          </ion-input>
          <ion-button expand="block" (click)="reset()">Restablecer contraseña</ion-button>
          <ion-button expand="block" fill="clear" (click)="question.set(null)">Usar otro correo</ion-button>
        }
      </div>
    </ion-content>
  `,
})
export class ForgotPasswordPage {
  private readonly auth = inject(AuthService);
  private readonly nav = inject(NavController);
  private readonly ui = inject(UiService);

  email = '';
  answer = '';
  password = '';
  readonly question = signal<string | null>(null);

  async findAccount(): Promise<void> {
    if (!isValidEmail(this.email)) {
      await this.ui.toast('Ingresa un correo válido.', 'danger');
      return;
    }
    try {
      this.question.set(await this.auth.getSecurityQuestion(this.email));
    } catch (err) {
      await this.ui.error(err);
    }
  }

  async reset(): Promise<void> {
    if (!this.answer.trim() || this.password.length < 6) {
      await this.ui.toast('Responde la pregunta y usa una contraseña de al menos 6 caracteres.', 'danger');
      return;
    }
    try {
      await this.auth.resetPassword(this.email, this.answer, this.password);
      await this.ui.toast('Contraseña actualizada. Ya puedes iniciar sesión.');
      await this.nav.navigateBack('/auth/login');
    } catch (err) {
      await this.ui.error(err);
    }
  }
}
