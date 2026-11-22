import type { OnInit } from '@angular/core';
import { Component, inject } from '@angular/core';
import { IonContent, IonSpinner, NavController } from '@ionic/angular';

import { AuthService } from '../../core/auth.service';

/** Pantalla de carga: restaura la sesión y decide la ruta inicial. */
@Component({
  selector: 'app-splash',
  imports: [IonContent, IonSpinner],
  template: `
    <ion-content class="splash">
      <div class="splash__center">
        <div class="splash__logo">G</div>
        <h1>GestU</h1>
        <p>Organiza tus tareas universitarias</p>
        <ion-spinner name="crescent"></ion-spinner>
      </div>
    </ion-content>
  `,
  styles: `
    .splash {
      --background: linear-gradient(160deg, #1e3a8a, #2563eb);
    }
    .splash__center {
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #fff;
      gap: 6px;
    }
    .splash__logo {
      width: 84px;
      height: 84px;
      border-radius: 24px;
      background: #fff;
      color: #1e3a8a;
      font-size: 48px;
      font-weight: 800;
      display: grid;
      place-items: center;
      margin-bottom: 8px;
    }
    h1 {
      margin: 0;
      font-weight: 800;
    }
    p {
      margin: 0 0 24px;
      opacity: 0.85;
    }
    ion-spinner {
      color: #fff;
    }
  `,
})
export class SplashPage implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly nav = inject(NavController);

  async ngOnInit(): Promise<void> {
    // Pequeña espera para que se vea la pantalla de carga.
    await Promise.all([this.auth.init(), new Promise((r) => setTimeout(r, 800))]);
    await this.nav.navigateRoot(this.auth.isLoggedIn() ? '/tabs/tasks' : '/auth/login', {
      animated: false,
    });
  }
}
