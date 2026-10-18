import test from 'node:test';
import assert from 'node:assert/strict';
import { calculate, choices, defaultPreferences, emptyMeasure, emptyProject, recommendedProducts, validateProject, validateStep } from '../src/domain.ts';

test('guided product suggestions follow the original web flow', () => {
  assert.deepEqual(recommendedProducts('Exterior').map(p => p.id), ['zipscreen', 'vertical']);
  assert.equal(recommendedProducts('Control solar').length, 2);
});

test('no dimensions means no displayed price even if installation has a minimum', () => {
  const result = calculate(emptyProject(), [emptyMeasure(1)], defaultPreferences());
  assert.equal(result.windows, 0);
  assert.equal(result.sqft, 0);
});

test('measured estimate matches the web formula', () => {
  const project = { ...emptyProject(), productId: 'rollup' };
  const measures = [{ id: 1, area: 'Sala', width: '72', height: '72', qty: '2' }];
  const result = calculate(project, measures, defaultPreferences());
  assert.equal(result.windows, 2);
  assert.equal(result.sqft, 72);
  assert.equal(result.low, 1421);
  assert.equal(result.high, 2429);
});

test('incomplete measurements are ignored; optional detail can be skipped', () => {
  const project = emptyProject();
  assert.equal(calculate(project, [{ id: 1, area: 'Sala', width: '72', height: '', qty: '1' }], defaultPreferences()).windows, 0);
  assert.equal(validateStep(3, project), null);
});

test('four-screen flow validates required sections and skips optional detail', () => {
  assert.equal(validateProject(emptyProject()), 'Selecciona el tipo de proyecto.');
  const filled = { ...emptyProject(), type: 'Residencial', area: 'Sala y comedor', town: 'Ponce', goal: 'Diseño', productId: 'wood', slot: choices.slots[0], name: 'Cliente Demo', phone: '787-000-0000' };
  assert.equal(validateProject(filled), null);
  assert.equal(validateProject({ ...filled, productId: '' }), 'Elige una prioridad y un producto.');
});

test('step validation blocks missing details and invalid phone', () => {
  assert.ok(validateStep(1, emptyProject()));
  const project = { ...emptyProject(), slot: choices.slots[0], name: 'Demo', phone: '123' };
  assert.ok(validateStep(4, project));
  assert.equal(validateStep(4, { ...project, phone: '787-000-0000' }), null);
});

 test('each visible screen validates its own fields', () => {
  const project = { ...emptyProject(), type: 'Residencial' };
  assert.ok(validateStep(1, project));
  Object.assign(project, { area: 'Sala y comedor', town: 'Ponce' });
  assert.equal(validateStep(1, project), null);
  assert.ok(validateStep(2, project));
  assert.equal(validateStep(3, project), null);
  assert.ok(validateStep(4, { ...project, slot: choices.slots[0], name: 'Demo', phone: '----------' }));
});
