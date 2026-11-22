import type { OnInit } from '@angular/core';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonAvatar,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonInput,
  IonTitle,
  IonToolbar,
  ModalController,
} from '@ionic/angular';

import { AuthService } from '../core/auth.service';
import { UiService } from '../core/ui.service';
import { initials, isValidEmail } from '../core/utils';

/** Editar datos del perfil: nombre, correo, carrera, semestre y foto (RF-09). */
@Component({
  selector: 'app-profile-form',
  imports: [FormsModule, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonInput, IonAvatar],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button (click)="close()">Cancelar</ion-button>
        </ion-buttons>
        <ion-title>Editar perfil</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <div class="form">
        <div class="photo-edit">
          <ion-avatar class="avatar avatar--xl">
            @if (photo()) {
              <img [src]="photo()" alt="Foto de perfil" />
            } @else {
              <span>{{ initials(name || 'U') }}</span>
            }
          </ion-avatar>
          <div class="photo-edit__actions">
            <ion-button size="small" fill="outline" (click)="fileInput.click()">Cambiar foto</ion-button>
            @if (photo()) {
              <ion-button size="small" fill="clear" color="danger" (click)="photo.set('')">Quitar</ion-button>
            }
          </div>
          <input #fileInput type="file" accept="image/*" hidden (change)="onFile($event)" />
        </div>

        <ion-input label="Nombre *" labelPlacement="stacked" fill="outline" [(ngModel)]="name"></ion-input>
        <ion-input
          label="Correo *"
          labelPlacement="stacked"
          fill="outline"
          type="email"
          [(ngModel)]="email"
        ></ion-input>
        <div class="form__row">
          <ion-input label="Carrera" labelPlacement="stacked" fill="outline" [(ngModel)]="career"></ion-input>
          <ion-input label="Semestre" labelPlacement="stacked" fill="outline" [(ngModel)]="semester"></ion-input>
        </div>
        <ion-button expand="block" (click)="save()">Guardar cambios</ion-button>
      </div>
    </ion-content>
  `,
})
export class ProfileFormModal implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly modalCtrl = inject(ModalController);
  private readonly ui = inject(UiService);

  readonly initials = initials;
  name = '';
  email = '';
  career = '';
  semester = '';
  readonly photo = signal('');

  ngOnInit(): void {
    const user = this.auth.user();
    if (!user) return;
    this.name = user.name;
    this.email = user.email;
    this.career = user.career ?? '';
    this.semester = user.semester ?? '';
    this.photo.set(user.photo ?? '');
  }

  /** Reduce la imagen a 256 px para no llenar el almacenamiento local. */
  onFile(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const size = 256;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d')!;
        const side = Math.min(img.width, img.height);
        ctx.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, size, size);
        this.photo.set(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  close(): void {
    void this.modalCtrl.dismiss(null, 'cancel');
  }

  async save(): Promise<void> {
    if (!this.name.trim() || !isValidEmail(this.email)) {
      await this.ui.toast('Ingresa un nombre y un correo válidos.', 'danger');
      return;
    }
    try {
      await this.auth.updateProfile({
        name: this.name,
        email: this.email,
        career: this.career,
        semester: this.semester,
        photo: this.photo(),
      });
      await this.ui.toast('Perfil actualizado');
      await this.modalCtrl.dismiss(true, 'saved');
    } catch (err) {
      await this.ui.error(err);
    }
  }
}
