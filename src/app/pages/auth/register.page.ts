import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonInput,
  IonInputPasswordToggle,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonTitle,
  IonToolbar,
  NavController,
} from '@ionic/angular';

import { AuthService } from '../../core/auth.service';
import { SECURITY_QUESTIONS } from '../../core/models';
import { UiService } from '../../core/ui.service';
import { isValidEmail } from '../../core/utils';

/** Registro de usuario (RF-01). */
@Component({
  selector: 'app-register',
  imports: [
    FormsModule,
    RouterLink,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonContent,
    IonInput,
    IonInputPasswordToggle,
    IonSelect,
    IonSelectOption,
    IonButton,
    IonSpinner,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/auth/login" text=""></ion-back-button>
        </ion-buttons>
        <ion-title>Crear cuenta</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <form class="form" (ngSubmit)="submit()">
        <ion-input
          label="Nombre completo *"
          labelPlacement="stacked"
          fill="outline"
          name="name"
          [(ngModel)]="name"
          autocomplete="name"
        ></ion-input>
        <ion-input
          label="Correo electrónico *"
          labelPlacement="stacked"
          fill="outline"
          type="email"
          name="email"
          [(ngModel)]="email"
          autocomplete="email"
        ></ion-input>
        <div class="form__row">
          <ion-input
            label="Carrera"
            labelPlacement="stacked"
            fill="outline"
            name="career"
            [(ngModel)]="career"
          ></ion-input>
          <ion-input
            label="Semestre"
            labelPlacement="stacked"
            fill="outline"
            name="semester"
            [(ngModel)]="semester"
          ></ion-input>
        </div>
        <ion-input
          label="Contraseña * (mín. 6 caracteres)"
          labelPlacement="stacked"
          fill="outline"
          type="password"
          name="password"
          [(ngModel)]="password"
          autocomplete="new-password"
        >
          <ion-input-password-toggle slot="end"></ion-input-password-toggle>
        </ion-input>
        <ion-input
          label="Confirmar contraseña *"
          labelPlacement="stacked"
          fill="outline"
          type="password"
          name="confirm"
          [(ngModel)]="confirm"
          autocomplete="new-password"
        ></ion-input>

        <p class="form__hint">
          La pregunta de seguridad te permitirá recuperar tu contraseña, ya que la app guarda tus datos solo en este
          dispositivo.
        </p>
        <ion-select
          label="Pregunta de seguridad *"
          labelPlacement="stacked"
          fill="outline"
          interface="action-sheet"
          cancelText="Cancelar"
          name="question"
          [(ngModel)]="question"
        >
          @for (q of questions; track q) {
            <ion-select-option [value]="q">{{ q }}</ion-select-option>
          }
        </ion-select>
        <ion-input
          label="Respuesta *"
          labelPlacement="stacked"
          fill="outline"
          name="answer"
          [(ngModel)]="answer"
        ></ion-input>

        <ion-button expand="block" type="submit" [disabled]="loading()">
          @if (loading()) {
            <ion-spinner name="crescent"></ion-spinner>
          } @else {
            Registrarme
          }
        </ion-button>
        <p class="auth__footer">¿Ya tienes cuenta? <a class="auth__link" routerLink="/auth/login">Inicia sesión</a></p>
      </form>
    </ion-content>
  `,
})
export class RegisterPage {
  private readonly auth = inject(AuthService);
  private readonly nav = inject(NavController);
  private readonly ui = inject(UiService);

  readonly questions = SECURITY_QUESTIONS;
  name = '';
  email = '';
  career = '';
  semester = '';
  password = '';
  confirm = '';
  question = SECURITY_QUESTIONS[0]!;
  answer = '';
  readonly loading = signal(false);

  async submit(): Promise<void> {
    const error = this.validate();
    if (error) {
      await this.ui.toast(error, 'danger');
      return;
    }
    this.loading.set(true);
    try {
      await this.auth.register({
        name: this.name,
        email: this.email,
        password: this.password,
        career: this.career,
        semester: this.semester,
        securityQuestion: this.question,
        securityAnswer: this.answer,
      });
      await this.ui.toast('¡Cuenta creada! Empieza registrando tus materias.');
      await this.nav.navigateRoot('/tabs/subjects');
    } catch (err) {
      await this.ui.error(err);
    } finally {
      this.loading.set(false);
    }
  }

  private validate(): string | null {
    if (!this.name.trim()) return 'Ingresa tu nombre.';
    if (!isValidEmail(this.email)) return 'Ingresa un correo válido.';
    if (this.password.length < 6) return 'La contraseña debe tener al menos 6 caracteres.';
    if (this.password !== this.confirm) return 'Las contraseñas no coinciden.';
    if (!this.answer.trim()) return 'Responde la pregunta de seguridad.';
    return null;
  }
}
