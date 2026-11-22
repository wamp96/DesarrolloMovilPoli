/**
 * Modelos de datos de GestU.
 * Toda la información se guarda localmente en el dispositivo (arquitectura standalone)
 * y cada registro lleva el `userId` de su dueño para aislar los datos entre usuarios.
 */

export type Priority = 'alta' | 'media' | 'baja';

export interface UserSettings {
  /** Activa los recordatorios locales de tareas próximas a vencer (RF-08). */
  notifications: boolean;
  /** Horas de anticipación con que se envía el recordatorio. */
  reminderHours: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  /** Hash SHA-256 de la contraseña con sal; nunca se guarda en texto plano (RNF-05). */
  passwordHash: string;
  salt: string;
  /** Pregunta de seguridad usada para recuperar la contraseña sin servidor (RF-02). */
  securityQuestion: string;
  securityAnswerHash: string;
  career?: string;
  semester?: string;
  /** Foto de perfil en base64 (data URL). */
  photo?: string;
  settings: UserSettings;
  createdAt: string;
}

/** Datos del usuario que se pueden exponer a la interfaz (sin hashes). */
export type PublicUser = Omit<User, 'passwordHash' | 'salt' | 'securityAnswerHash'>;

export interface Subject {
  id: string;
  userId: string;
  name: string;
  teacher: string;
  /** Horario en texto libre, p. ej. "Lun y Mié 08:00 - 10:00". */
  schedule: string;
  room?: string;
  color: string;
  createdAt: string;
}

export interface Task {
  id: string;
  userId: string;
  subjectId: string;
  title: string;
  description?: string;
  /** Fecha límite en formato YYYY-MM-DD. */
  dueDate: string;
  /** Hora límite opcional en formato HH:mm. */
  dueTime?: string;
  priority: Priority;
  completed: boolean;
  completedAt?: string;
  createdAt: string;
}

export interface CalendarEvent {
  id: string;
  userId: string;
  title: string;
  /** Fecha en formato YYYY-MM-DD. */
  date: string;
  /** Hora en formato HH:mm. */
  time: string;
  location?: string;
  subjectId?: string;
  notes?: string;
  createdAt: string;
}

export const PRIORITIES: { value: Priority; label: string; color: string }[] = [
  { value: 'alta', label: 'Alta', color: 'danger' },
  { value: 'media', label: 'Media', color: 'warning' },
  { value: 'baja', label: 'Baja', color: 'success' },
];

export const SUBJECT_COLORS = ['#2563eb', '#7c3aed', '#0891b2', '#db2777', '#ea580c', '#16a34a', '#ca8a04', '#475569'];

export const SECURITY_QUESTIONS = [
  '¿Cuál es el nombre de tu primera mascota?',
  '¿En qué ciudad naciste?',
  '¿Cuál es el nombre de tu colegio?',
  '¿Cuál es tu comida favorita?',
];
