import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IonButton, IonContent, IonInput, IonInputPasswordToggle, IonSpinner, NavController } from '@ionic/angular';

import { AuthService } from '../../core/auth.service';
import { UiService } from '../../core/ui.service';
import { isValidEmail } from '../../core/utils';

/** Iniciar sesión (RF-01). */
@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink, IonContent, IonInput, IonInputPasswordToggle, IonButton, IonSpinner],
  template: `
    <ion-content class="auth">
      <div class="auth__hero">
        <div class="auth__logo">G</div>
        <h1>Bienvenido a GestU</h1>
        <p>Inicia sesión para ver tus tareas</p>
      </div>

      <form class="auth__card" (ngSubmit)="submit()" #f="ngForm">
        <ion-input
          label="Correo electrónico"
          labelPlacement="stacked"
          fill="outline"
          type="email"
          name="email"
          autocomplete="email"
          [(ngModel)]="email"
          required
        ></ion-input>
        <ion-input
          label="Contraseña"
          labelPlacement="stacked"
          fill="outline"
          type="password"
          name="password"
          autocomplete="current-password"
          [(ngModel)]="password"
          required
        >
          <ion-input-password-toggle slot="end"></ion-input-password-toggle>
        </ion-input>

        <a class="auth__link auth__link--right" routerLink="/auth/forgot-password">¿Olvidaste tu contraseña?</a>

        <ion-button expand="block" type="submit" [disabled]="loading()">
          @if (loading()) {
            <ion-spinner name="crescent"></ion-spinner>
          } @else {
            Iniciar sesión
          }
        </ion-button>

        <p class="auth__footer">¿No tienes cuenta? <a class="auth__link" routerLink="/auth/register">Regístrate</a></p>
      </form>
    </ion-content>
  `,
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly nav = inject(NavController);
  private readonly ui = inject(UiService);

  email = '';
  password = '';
  readonly loading = signal(false);

  async submit(): Promise<void> {
    if (!isValidEmail(this.email) || !this.password) {
      await this.ui.toast('Ingresa un correo válido y tu contraseña.', 'danger');
      return;
    }
    this.loading.set(true);
    try {
      await this.auth.login(this.email, this.password);
      this.password = '';
      await this.nav.navigateRoot('/tabs/tasks');
    } catch (err) {
      await this.ui.error(err);
    } finally {
      this.loading.set(false);
    }
  }
}
