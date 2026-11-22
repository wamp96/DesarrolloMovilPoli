import {
  daysUntil,
  initials,
  isValidEmail,
  normalizeEmail,
  parseISODate,
  relativeDue,
  sha256,
  shortDate,
  toISODate,
} from './utils';

describe('utils', () => {
  it('convierte fechas entre Date y YYYY-MM-DD sin desfase de zona horaria', () => {
    const date = parseISODate('2026-11-14');
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(10);
    expect(date.getDate()).toBe(14);
    expect(toISODate(date)).toBe('2026-11-14');
  });

  it('formatea fechas cortas en español', () => {
    expect(shortDate('2026-11-14')).toBe('14 nov');
  });

  it('calcula los días restantes y el texto relativo de vencimiento', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const iso = toISODate(tomorrow);
    expect(daysUntil(iso)).toBe(1);
    expect(relativeDue(iso)).toBe('Mañana');
    expect(relativeDue(toISODate(new Date()))).toBe('Hoy');
  });

  it('valida y normaliza correos', () => {
    expect(isValidEmail('estudiante@poligran.edu.co')).toBe(true);
    expect(isValidEmail('sin-arroba')).toBe(false);
    expect(normalizeEmail('  Ana@Poligran.EDU.co ')).toBe('ana@poligran.edu.co');
  });

  it('obtiene las iniciales del nombre', () => {
    expect(initials('Valentina Ríos Gómez')).toBe('VR');
  });

  it('genera el hash SHA-256 conocido', async () => {
    expect(await sha256('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });
});
