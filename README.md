# GestU

App móvil multiplataforma (Ionic + Angular + Capacitor) para que estudiantes universitarios organicen sus materias, tareas y fechas de entrega.
Proyecto del módulo Énfasis en Programación Móvil – Politécnico Grancolombiano.

## Arquitectura

App **standalone**: toda la información se guarda en el dispositivo con Ionic Storage (IndexedDB) y no hay servidor.
Cada registro guarda el `userId` de su dueño, así que cada usuario solo ve sus propios datos. Las contraseñas se guardan como hash SHA-256 con sal.

```
src/app/
  core/          servicios y modelos (auth, datos, almacenamiento, notificaciones, guards)
  components/    formularios en modal y la tarjeta de tarea reutilizable
  pages/
    splash/      pantalla de carga: restaura la sesión
    auth/        login, registro, recuperar contraseña
    tabs/        barra de pestañas y rutas internas
    tasks/       listado de tareas y detalle
    subjects/    listado de materias y detalle
    calendar/    calendario semanal con entregas y eventos
    profile/     perfil y ajustes de cuenta
```

## Requerimientos funcionales

| Código | Funcionalidad | Dónde |
|---|---|---|
| RF-01 | Registro e inicio de sesión | `pages/auth`, `core/auth.service.ts` |
| RF-02 | Recuperar contraseña (pregunta de seguridad) y cerrar sesión | `pages/auth/forgot-password.page.ts`, `pages/profile` |
| RF-03 | Materias: crear, editar, eliminar | `pages/subjects`, `components/subject-form.modal.ts` |
| RF-04 | Tareas: crear, editar, eliminar, completar | `pages/tasks`, `components/task-form.modal.ts` |
| RF-05 | Fecha de entrega y prioridad Alta/Media/Baja | `components/task-form.modal.ts` |
| RF-06 | Listado, búsqueda y filtros por materia, estado y prioridad | `pages/tasks/tasks.page.ts` |
| RF-07 | Calendario académico con entregas y eventos | `pages/calendar` |
| RF-08 | Recordatorios locales de tareas próximas a vencer | `core/notification.service.ts`, `pages/profile/settings.page.ts` |
| RF-09 | Ver y editar perfil (nombre, correo, foto) | `pages/profile`, `components/profile-form.modal.ts` |

## Ejecutar en el navegador

Requiere Node.js 20 o superior.

```bash
npm install
npm start          # abre http://localhost:4200
```

## Pruebas y calidad

```bash
npm run test:unit  # pruebas unitarias (Vitest)
npm run test:e2e   # pruebas end-to-end (Playwright)
npm run lint       # ESLint + Prettier
```

## Generar el APK (Android)

Requiere **Android Studio**, que incluye el JDK y el Android SDK.

```bash
npm install
npm run build
npx cap add android      # solo la primera vez
npx cap sync android
npx cap open android     # abre Android Studio
```

En Android Studio: **Build › Build App Bundle(s) / APK(s) › Build APK(s)**.
El APK queda en `android/app/build/outputs/apk/debug/app-debug.apk`.

Los recordatorios (RF-08) solo funcionan en el celular, no en el navegador.
