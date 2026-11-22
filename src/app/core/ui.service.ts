import { Injectable, inject } from '@angular/core';
import { AlertController, ToastController } from '@ionic/angular';

/** Mensajes y confirmaciones reutilizables en toda la app. */
@Injectable({ providedIn: 'root' })
export class UiService {
  private readonly toastCtrl = inject(ToastController);
  private readonly alertCtrl = inject(AlertController);

  async toast(message: string, color: 'success' | 'danger' | 'medium' = 'success'): Promise<void> {
    const toast = await this.toastCtrl.create({ message, color, duration: 2200, position: 'top' });
    await toast.present();
  }

  async error(err: unknown): Promise<void> {
    const message = err instanceof Error ? err.message : 'Ocurrió un error inesperado.';
    await this.toast(message, 'danger');
  }

  /** Muestra una alerta de confirmación y resuelve true si el usuario acepta. */
  async confirm(header: string, message: string, confirmText = 'Eliminar', destructive = true): Promise<boolean> {
    const alert = await this.alertCtrl.create({
      header,
      message,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: confirmText, role: destructive ? 'destructive' : 'confirm' },
      ],
    });
    await alert.present();
    const { role } = await alert.onDidDismiss();
    return role === 'destructive' || role === 'confirm';
  }
}
