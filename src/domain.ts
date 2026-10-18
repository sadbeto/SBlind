export type Product = { id: string; name: string; low: number; high: number; note: string };
export type Measure = { id: number; area: string; width: string; height: string; qty: string };
export type Preferences = { service: 'Instaladas' | 'Recogido en tienda' | 'Entrega/envío'; motorized: boolean; blackout: boolean; needsSamples: boolean };
export type Project = { type: string; area: string; town: string; goal: string; productId: string; slot: string; name: string; phone: string };
export type Lead = { folio: string; project: Project; estimate: Estimate };
export type Estimate = { sqft: number; windows: number; low: number; high: number; readiness: number };

export const BLUE = '#003375';
export const YELLOW = '#FFDE16';
export const products: Product[] = [
  { id: 'illusion', name: 'Illusion Blinds', low: 30, high: 48, note: 'Control de luz y privacidad' },
  { id: 'rollup', name: 'Roll Up Shades', low: 18, high: 32, note: 'Translúcido o blackout' },
  { id: 'ripplefold', name: 'Ripplefold', low: 36, high: 60, note: 'Cortina decorativa' },
  { id: 'wood', name: 'Wood Blinds', low: 28, high: 44, note: 'Apariencia de madera' },
  { id: 'roman', name: 'Roman Shades', low: 34, high: 56, note: 'Premium residencial' },
  { id: 'vertical', name: 'Vertical Blinds', low: 16, high: 28, note: 'Espacios amplios' },
  { id: 'zipscreen', name: 'Zipscreen', low: 42, high: 75, note: 'Exterior y terrazas' },
];
export const choices = {
  types: ['Residencial', 'Comercial', 'Institucional'],
  areas: ['Sala y comedor', 'Habitaciones', 'Propiedad completa', 'Área especial'],
  goals: ['Control solar', 'Privacidad', 'Diseño', 'Exterior'],
  slots: ['Miércoles · 10:30 AM', 'Miércoles · 2:00 PM', 'Jueves · 9:00 AM', 'Viernes · 1:30 PM'],
};
const recommendations: Record<string, string[]> = {
  'Control solar': ['rollup', 'illusion'],
  'Privacidad': ['rollup', 'roman'],
  'Diseño': ['ripplefold', 'wood'],
  'Exterior': ['zipscreen', 'vertical'],
};
export const recommendedProducts = (goal: string) => (recommendations[goal] ?? []).map(id => products.find(p => p.id === id)!).filter(Boolean);
export const emptyProject = (): Project => ({ type: '', area: '', town: '', goal: '', productId: '', slot: '', name: '', phone: '' });
export const emptyMeasure = (id: number): Measure => ({ id, area: '', width: '', height: '', qty: '1' });
export const defaultPreferences = (): Preferences => ({ service: 'Instaladas', motorized: false, blackout: false, needsSamples: false });
export const money = (value: number) => `$${Math.round(value).toLocaleString('en-US')}`;

// Same preliminary formula as the web demo. These rates are illustrative, not Specialist's approved prices.
export function calculate(project: Project, measures: Measure[], prefs: Preferences): Estimate {
  const product = products.find(p => p.id === project.productId) ?? products[1];
  let sqft = 0;
  let windows = 0;
  for (const row of measures) {
    const width = Number(row.width);
    const height = Number(row.height);
    const qty = Number(row.qty);
    if (Number.isFinite(width) && Number.isFinite(height) && Number.isInteger(qty) &&
        width > 0 && height > 0 && qty > 0 && width <= 1000 && height <= 1000 && qty <= 100) {
      sqft += width * height * qty / 144;
      windows += qty;
    }
  }
  const serviceAdd = prefs.service === 'Instaladas' ? Math.max(125, windows * 45) : prefs.service === 'Entrega/envío' ? 65 : 0;
  const motorAdd = prefs.motorized ? windows * 175 : 0;
  const multiplier = prefs.blackout ? 1.14 : 1;
  const filledRows = measures.filter(r => r.area.trim() && Number(r.width) > 0 && Number(r.height) > 0 && Number(r.qty) > 0).length;
  const fields = [project.type, project.area, project.town, project.goal, project.productId, project.slot, project.name, project.phone];
  return {
    sqft, windows,
    low: Math.round(sqft * product.low * multiplier + serviceAdd + motorAdd),
    high: Math.round(sqft * product.high * multiplier + serviceAdd + motorAdd),
    readiness: Math.min(100, Math.round((filledRows ? 40 : 0) + fields.filter(Boolean).length / 8 * 60)),
  };
}

export function validateProject(project: Project): string | null {
  for (const step of [1, 2, 3, 5]) {
    const issue = validateStep(step, project);
    if (issue) return issue;
  }
  return null;
}

export function validateStep(step: number, project: Project): string | null {
  if (step === 1 && !project.type) return 'Selecciona el tipo de proyecto.';
  if (step === 2 && (!project.area || !project.town.trim())) return 'Selecciona un área e indica el municipio.';
  if (step === 3 && (!project.goal || !project.productId)) return 'Elige una prioridad y un producto.';
  if (step === 5) {
    if (!project.slot || !project.name.trim() || !/^\+?[0-9()\-\s]{10,}$/.test(project.phone.trim()))
      return 'Completa horario, nombre y un teléfono válido.';
  }
  return null;
}
