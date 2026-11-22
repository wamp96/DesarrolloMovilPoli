import type { Routes } from '@angular/router';

import { TabsPage } from './tabs.page';

/** Pestañas principales (/tabs) y sus pantallas de detalle. */
export const routes: Routes = [
  {
    path: '',
    component: TabsPage,
    children: [
      {
        path: 'tasks',
        loadComponent: () => import('../tasks/tasks.page').then((m) => m.TasksPage),
      },
      {
        path: 'tasks/:id',
        loadComponent: () => import('../tasks/task-detail.page').then((m) => m.TaskDetailPage),
      },
      {
        path: 'subjects',
        loadComponent: () => import('../subjects/subjects.page').then((m) => m.SubjectsPage),
      },
      {
        path: 'subjects/:id',
        loadComponent: () => import('../subjects/subject-detail.page').then((m) => m.SubjectDetailPage),
      },
      {
        path: 'calendar',
        loadComponent: () => import('../calendar/calendar.page').then((m) => m.CalendarPage),
      },
      {
        path: 'profile',
        loadComponent: () => import('../profile/profile.page').then((m) => m.ProfilePage),
      },
      {
        path: 'profile/settings',
        loadComponent: () => import('../profile/settings.page').then((m) => m.SettingsPage),
      },
      { path: '', redirectTo: 'tasks', pathMatch: 'full' },
    ],
  },
];
