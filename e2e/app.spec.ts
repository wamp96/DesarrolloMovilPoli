import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

async function fill(page: Page, label: string, value: string): Promise<void> {
  await page.locator(`ion-input[label^="${label}"] input`).last().fill(value);
}

test('sin sesión, la app redirige a Iniciar sesión', async ({ page }) => {
  await page.goto('/tabs/tasks');
  await expect(page).toHaveURL(/\/auth\/login$/);
  await expect(page.locator('ion-content')).toContainText('Bienvenido a GestU');
});

test('registro, crear materia y crear tarea', async ({ page }) => {
  await page.goto('/auth/register');
  await fill(page, 'Nombre completo', 'Estudiante Prueba');
  await fill(page, 'Correo electrónico', 'prueba@poligran.edu.co');
  await fill(page, 'Contraseña *', 'secreto123');
  await fill(page, 'Confirmar', 'secreto123');
  await fill(page, 'Respuesta', 'respuesta');
  await page.locator('ion-button', { hasText: 'Registrarme' }).click();
  await expect(page).toHaveURL(/\/tabs\/subjects$/);

  await page.locator('app-subjects ion-fab-button').click();
  await fill(page, 'Nombre', 'Cálculo Integral');
  await fill(page, 'Docente', 'Dr. Andrés Mejía');
  await fill(page, 'Horario', 'Lun y Mié 08:00');
  await page.locator('ion-modal ion-button', { hasText: 'Guardar materia' }).click();
  await expect(page.locator('app-subjects .subject')).toHaveCount(1);

  await page.locator('ion-tab-button[tab="tasks"]').click();
  await page.locator('app-tasks ion-fab-button').click();
  await fill(page, 'Título', 'Taller de integrales');
  await page.locator('ion-modal ion-segment-button', { hasText: 'Alta' }).click();
  await page.locator('ion-modal ion-button', { hasText: 'Guardar tarea' }).click();
  await expect(page.locator('app-tasks app-task-item')).toHaveCount(1);
  await expect(page.locator('app-tasks app-task-item')).toContainText('Taller de integrales');
});
