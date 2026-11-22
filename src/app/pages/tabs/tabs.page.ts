import { Component } from '@angular/core';
import { IonIcon, IonLabel, IonTabBar, IonTabButton, IonTabs } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  add,
  alarmOutline,
  bookOutline,
  calendarOutline,
  checkmarkCircle,
  checkmarkCircleOutline,
  chevronBack,
  chevronForward,
  clipboardOutline,
  createOutline,
  ellipseOutline,
  keyOutline,
  locationOutline,
  logOutOutline,
  notificationsOutline,
  optionsOutline,
  personCircleOutline,
  personOutline,
  schoolOutline,
  settingsOutline,
  timeOutline,
  trashOutline,
} from 'ionicons/icons';

/** Barra de pestañas inferior: Tareas, Materias, Calendario y Perfil. */
@Component({
  selector: 'app-tabs',
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel],
  template: `
    <ion-tabs>
      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="tasks" href="/tabs/tasks">
          <ion-icon aria-hidden="true" name="clipboard-outline"></ion-icon>
          <ion-label>Tareas</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="subjects" href="/tabs/subjects">
          <ion-icon aria-hidden="true" name="book-outline"></ion-icon>
          <ion-label>Materias</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="calendar" href="/tabs/calendar">
          <ion-icon aria-hidden="true" name="calendar-outline"></ion-icon>
          <ion-label>Calendario</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="profile" href="/tabs/profile">
          <ion-icon aria-hidden="true" name="person-outline"></ion-icon>
          <ion-label>Perfil</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  `,
})
export class TabsPage {
  constructor() {
    // Íconos usados en toda la app.
    addIcons({
      add,
      alarmOutline,
      bookOutline,
      calendarOutline,
      checkmarkCircle,
      checkmarkCircleOutline,
      chevronBack,
      chevronForward,
      clipboardOutline,
      createOutline,
      ellipseOutline,
      keyOutline,
      locationOutline,
      logOutOutline,
      notificationsOutline,
      optionsOutline,
      personCircleOutline,
      personOutline,
      schoolOutline,
      settingsOutline,
      timeOutline,
      trashOutline,
    });
  }
}
