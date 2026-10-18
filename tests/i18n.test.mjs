import test from 'node:test';
import assert from 'node:assert/strict';
import { english, translate } from '../src/i18n.ts';
import { choices, products, emptyProject, validateStep } from '../src/domain.ts';

test('all business choice labels and product descriptions have English translations', () => {
  const labels = [...Object.values(choices).flat(), ...products.map(p => p.note), 'Instaladas', 'Recogido en tienda', 'Entrega/envío'];
  for (const label of labels) {
    assert.ok(english[label], `Missing English copy: ${label}`);
    assert.equal(translate(label, 'es'), label);
    assert.equal(translate(label, 'en'), english[label]);
  }
});

test('validation errors are translated at display time', () => {
  const blank = emptyProject();
  const errors = [validateStep(1, blank), validateStep(1, { ...blank, type: 'Residencial' }), validateStep(2, blank), validateStep(4, blank)];
  for (const error of errors) {
    assert.ok(error);
    assert.ok(english[error]);
    assert.notEqual(translate(error, 'en'), error);
  }
});

test('language switching leaves canonical choices and product identifiers unchanged', () => {
  const before = JSON.stringify({ choices, products });
  for (const label of choices.goals) { translate(label, 'en'); translate(label, 'es'); }
  assert.equal(JSON.stringify({ choices, products }), before);
  for (const product of products) assert.equal(translate(product.name, 'en'), product.name);
});
