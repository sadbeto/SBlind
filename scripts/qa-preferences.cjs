const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { translate } = require('../src/i18n.ts');
(async () => {
  const browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });
  fs.mkdirSync('qa', { recursive: true });
  const results = [];
  for (const width of [1440, 320]) for (const language of ['es', 'en']) for (const theme of ['light', 'dark']) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, colorScheme: 'light' });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('http://127.0.0.1:5180/');
    const t = value => translate(value, language);
    const b = value => page.getByRole('button', { name: t(value), exact: true });
    const field = value => page.getByRole('textbox', { name: t(value), exact: true });
    const choose = async (label, value) => { await b(label).click(); await b(value).click(); };
    await page.getByRole('button', { name: language === 'en' ? 'English' : 'Español', exact: true }).click();
    await b(theme === 'dark' ? 'Oscuro' : 'Claro').click();
    const check = async step => {
      await page.getByText(`${t('PASO')} ${step} ${t('DE')} 4`, { exact: true }).waitFor();
      assert.equal(await page.evaluate(() => document.documentElement.lang), language);
      assert.equal(await page.evaluate(() => document.documentElement.style.colorScheme), theme);
      const overflow = await page.evaluate(() => [...document.querySelectorAll('body *')].filter(el => { const r = el.getBoundingClientRect(); return r.width > 0 && (r.right > innerWidth + 1 || r.left < -1); }).length);
      assert.equal(overflow, 0, `overflow ${width}/${language}/${theme}/step${step}`);
      if (language === 'en') {
        const text = await page.locator('body').innerText();
        for (const term of ['Selecciona', 'Pendiente', 'Siguiente', 'Precios ilustrativos', 'Tu proyecto', 'Horario', 'Municipio', 'Nombre ficticio']) assert.ok(!text.includes(term), `untranslated ${term}`);
      }
      await page.screenshot({ path: `qa/${language}-${theme}-${width}-step${step}.png` });
    };
    await check(1);
    await b('Siguiente →').click();
    assert.equal(await page.getByRole('alert').innerText(), t('Selecciona el tipo de proyecto.'));
    await choose('Tipo de proyecto', 'Residencial');
    await choose('Área a transformar', 'Sala y comedor');
    await field('Municipio').fill('Ponce');
    // Change language and theme mid-form, then restore: input and selection must survive.
    await page.getByRole('button', { name: language === 'en' ? 'Español' : 'English', exact: true }).click();
    await page.getByRole('button', { name: language === 'en' ? 'English' : 'Español', exact: true }).click();
    await b(theme === 'dark' ? 'Claro' : 'Oscuro').click();
    await b(theme === 'dark' ? 'Oscuro' : 'Claro').click();
    assert.equal(await field('Municipio').inputValue(), 'Ponce');
    assert.ok((await b('Tipo de proyecto').innerText()).includes(t('Residencial')));
    await b('Siguiente →').click(); await check(2);
    await choose('Lo más importante para ti', 'Control solar');
    await b('Tipo de cortina').click();
    await page.getByRole('button', { name: /Roll Up Shades/ }).click();
    await b('Siguiente →').click(); await check(3);
    await field('Área').fill('Sala demo');
    await field('Ancho · pulg.').fill('72');
    await field('Alto · pulg.').fill('72');
    await field('Cantidad').fill('2');
    const bg = await field('Área').evaluate(el => getComputedStyle(el).backgroundColor);
    assert.equal(bg, theme === 'dark' ? 'rgb(20, 33, 55)' : 'rgb(255, 255, 255)');
    await choose('Servicio preferido', 'Recogido en tienda');
    await page.getByRole('button', { name: `+ ${t('Motorizar')}`, exact: true }).click();
    await check(3);
    await b('Siguiente →').click(); await check(4);
    await choose('Ventana tentativa', 'Miércoles · 10:30 AM');
    await field('Nombre ficticio').fill('Cliente Demo');
    await field('Teléfono ficticio').fill('787-000-0000');
    await b('Someter · prueba →').click();
    await page.getByText(t('SIMULACIÓN COMPLETADA'), { exact: true }).waitFor();
    await page.screenshot({ path: `qa/${language}-${theme}-${width}-complete.png` });
    await b('Volver a revisar').click();
    assert.equal(await field('Nombre ficticio').inputValue(), 'Cliente Demo');
    await page.reload();
    await page.getByText(`${t('PASO')} 1 ${t('DE')} 4`, { exact: true }).waitFor();
    await check(1);
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('sblind.ui.v1')));
    assert.deepEqual(saved, { language, theme });
    assert.equal(await field('Municipio').inputValue(), ''); // Never persist customer data.
    assert.deepEqual(errors, []);
    results.push({ width, language, theme, status: 'PASS' });
    await context.close();
  }
  for (const storage of ['blocked', 'corrupt']) {
    const context = await browser.newContext({ colorScheme: 'dark' });
    await context.addInitScript(storage => {
      if (storage === 'blocked') Object.defineProperty(window, 'localStorage', { get() { throw new Error('Storage disabled'); } });
      else localStorage.setItem('sblind.ui.v1', '{broken');
    }, storage);
    const page = await context.newPage();
    await page.goto('http://127.0.0.1:5180/');
    await page.getByRole('button', { name: 'Oscuro', exact: true }).waitFor();
    assert.equal(await page.evaluate(() => document.documentElement.style.colorScheme), 'dark');
    await page.getByRole('button', { name: 'English', exact: true }).click();
    await page.getByRole('button', { name: 'Light', exact: true }).click();
    await page.getByRole('button', { name: 'Next →', exact: true }).click();
    assert.equal(await page.getByRole('alert').innerText(), 'Select a project type.');
    results.push({ storage, systemDarkDefault: true, status: 'PASS' });
    await context.close();
  }
  console.log(JSON.stringify(results, null, 2));
  fs.writeFileSync('qa/preferences-results.json', JSON.stringify(results, null, 2));
  await browser.close();
})().catch(error => { console.error(error); process.exit(1); });
