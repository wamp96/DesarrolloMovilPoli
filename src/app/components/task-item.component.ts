import { Component, input, output } from '@angular/core';
import { IonCheckbox, IonIcon } from '@ionic/angular';

import type { Task } from '../core/models';
import { daysUntil, priorityColor, priorityLabel, relativeDue, shortDate } from '../core/utils';

/** Tarjeta de tarea reutilizada en Tareas, Detalle de Materia y Calendario. */
@Component({
  selector: 'app-task-item',
  imports: [IonCheckbox, IonIcon],
  template: `
    <div
      class="task"
      role="button"
      tabindex="0"
      [class.task--done]="task().completed"
      [style.--accent]="color()"
      (click)="open.emit()"
      (keydown.enter)="open.emit()"
    >
      <ion-checkbox
        [checked]="task().completed"
        (click)="$event.stopPropagation()"
        (ionChange)="completedChange.emit($event.detail.checked)"
        [attr.aria-label]="'Marcar ' + task().title + ' como completada'"
      ></ion-checkbox>
      <div class="task__body">
        <div class="task__top">
          <span class="task__title">{{ task().title }}</span>
          <span class="pill pill--{{ priorityColor(task().priority) }}">{{ priorityLabel(task().priority) }}</span>
        </div>
        @if (subtitle()) {
          <span class="task__subject">{{ subtitle() }}</span>
        }
        @if (task().description) {
          <span class="task__desc">{{ task().description }}</span>
        }
        <span class="task__due" [class.task__due--urgent]="!task().completed && daysUntil(task().dueDate) <= 1">
          <ion-icon name="time-outline"></ion-icon>
          {{ shortDate(task().dueDate) }}{{ task().dueTime ? ' ' + task().dueTime : '' }} ·
          {{ task().completed ? 'Completada' : relativeDue(task().dueDate) }}
        </span>
      </div>
    </div>
  `,
})
export class TaskItemComponent {
  readonly task = input.required<Task>();
  readonly color = input('#2563eb');
  /** Texto opcional bajo el título (p. ej. el nombre de la materia). */
  readonly subtitle = input<string>();
  readonly completedChange = output<boolean>();
  readonly open = output<void>();

  readonly priorityColor = priorityColor;
  readonly priorityLabel = priorityLabel;
  readonly shortDate = shortDate;
  readonly relativeDue = relativeDue;
  readonly daysUntil = daysUntil;
}
