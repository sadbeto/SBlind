import { useRef, useState } from 'react';
import { Image, useWindowDimensions, Pressable, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, View, type ScrollViewInstance } from 'react-native';
import {
  BLUE, YELLOW, calculate, choices, defaultPreferences, emptyMeasure, emptyProject,
  money, products, recommendedProducts, validateProject, validateStep,
  type Measure, type Preferences, type Project,
} from './src/domain';

import { UiProvider, useUi } from './src/ui-preferences';

type Option = { value: string; detail?: string };

function Dropdown({ id, label, value, placeholder, options, open, onToggle, onSelect, hint }: {
  id: string; label: string; value: string; placeholder: string; options: Option[];
  open: boolean; onToggle: (id: string) => void; onSelect: (value: string) => void; hint?: string;
}) {
  const { t, dark } = useUi();
  const styles = dark ? darkStyles : lightStyles;
  return (
    <View style={styles.dropdownField}>
      <Text style={styles.label}>{t(label)}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel={t(label)} accessibilityState={{ expanded: open }}
        onPress={() => onToggle(id)} style={[styles.select, open && styles.selectOpen]}>
        <Text style={[styles.selectText, !value && styles.placeholder]}>{t(value || placeholder)}</Text>
        <Text style={styles.chevron}>{open ? '⌃' : '⌄'}</Text>
      </Pressable>
      {open && <View style={styles.menu}>
        {options.map((option, index) => (
          <Pressable key={option.value} accessibilityRole="button" accessibilityState={{ selected: value === option.value }}
            onPress={() => onSelect(option.value)} style={[styles.menuItem, index > 0 && styles.menuDivider, value === option.value && styles.menuSelected]}>
            <View style={styles.menuTextWrap}>
              <Text style={styles.menuTitle}>{t(option.value)}</Text>
              {!!option.detail && <Text style={styles.menuDetail}>{t(option.detail)}</Text>}
            </View>
            {value === option.value && <Text style={styles.check}>✓</Text>}
          </Pressable>
        ))}
      </View>}
      {!!hint && <Text style={styles.hint}>{t(hint)}</Text>}
    </View>
  );
}

function Field({ label, value, onChangeText, placeholder, keyboardType }: {
  label: string; value: string; onChangeText: (value: string) => void;
  placeholder?: string; keyboardType?: 'default' | 'numeric' | 'phone-pad';
}) {
  const { t, dark } = useUi();
  const styles = dark ? darkStyles : lightStyles;
  return (
    <View style={styles.inputField}>
      <Text style={styles.label}>{t(label)}</Text>
      <TextInput accessibilityLabel={t(label)} value={value} onChangeText={onChangeText}
        placeholder={placeholder ? t(placeholder) : undefined} placeholderTextColor={dark ? "#A8B8CC" : "#65758B"} keyboardType={keyboardType ?? 'default'}
        autoCapitalize={keyboardType === 'phone-pad' || keyboardType === 'numeric' ? 'none' : 'sentences'}
        style={styles.input} />
    </View>
  );
}

function Action({ label, onPress, secondary = false }: { label: string; onPress: () => void; secondary?: boolean }) {
  const { t, dark } = useUi();
  const styles = dark ? darkStyles : lightStyles;
  return <Pressable accessibilityRole="button" onPress={onPress} style={[styles.action, secondary && styles.actionSecondary]}>
    <Text style={[styles.actionText, secondary && styles.actionTextSecondary]}>{t(label)}</Text>
  </Pressable>;
}

function Section({ number, label, title, children }: { number: string; label: string; title: string; children: React.ReactNode }) {
  const { t, dark } = useUi();
  const styles = dark ? darkStyles : lightStyles;
  return <View style={styles.section}>
    <View style={styles.sectionHead}><Text style={styles.sectionNumber}>{number}</Text><Text style={styles.sectionLabel}>{t(label)}</Text></View>
    <Text style={styles.sectionTitle}>{t(title)}</Text>
    {children}
  </View>;
}

export default function App() {
  return <UiProvider><CustomerForm /></UiProvider>;
}

function CustomerForm() {
  const { t, dark, language, setLanguage, setTheme } = useUi();
  const styles = dark ? darkStyles : lightStyles;
  const scrollRef = useRef<ScrollViewInstance>(null);
  const { width } = useWindowDimensions();
  const desktop = width >= 960;
  const [step, setStep] = useState(1);
  const [project, setProject] = useState<Project>(emptyProject);
  const [measures, setMeasures] = useState<Measure[]>([emptyMeasure(1)]);
  const [nextId, setNextId] = useState(2);
  const [prefs, setPrefs] = useState<Preferences>(defaultPreferences);
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [complete, setComplete] = useState(false);
  const estimate = calculate(project, measures, prefs);
  const chosenProduct = products.find(p => p.id === project.productId);
  const suggested = recommendedProducts(project.goal);
  const productOptions: Option[] = [
    ...suggested.map(p => ({ value: p.name, detail: `${t('Sugerido')} · ${t(p.note)}` })),
    ...products.filter(p => !suggested.some(s => s.id === p.id)).map(p => ({ value: p.name, detail: p.note })),
  ];
  const toggle = (id: string) => setOpenKey(prev => prev === id ? null : id);
  const update = (field: keyof Project, value: string) => {
    setProject(prev => ({ ...prev, [field]: value, ...(field === 'goal' ? { productId: '' } : {}) }));
    setOpenKey(null); setError('');
  };
  const updateMeasure = (id: number, field: keyof Omit<Measure, 'id'>, value: string) =>
    setMeasures(prev => prev.map(row => row.id === id ? { ...row, [field]: value } : row));
  const reset = () => {
    setProject(emptyProject()); setMeasures([emptyMeasure(1)]); setNextId(2);
    setPrefs(defaultPreferences()); setOpenKey(null); setComplete(false);
    setStep(1); setError('');
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };
  const goToStep = (nextStep: number) => {
    setStep(nextStep); setOpenKey(null); setError('');
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };
  const next = () => {
    if (step === 4) { submit(); return; }
    const issue = validateStep(step, project);
    if (issue) { setError(issue); return; }
    goToStep(step + 1);
  };
  const submit = () => {
    const issue = validateProject(project);
    if (issue) { setError(issue); return; }
    setComplete(true); setError(''); setOpenKey(null);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };
  const dropdown = (id: string, label: string, value: string, placeholder: string, options: Option[], onSelect: (value: string) => void, hint?: string) =>
    <Dropdown id={id} label={label} value={value} placeholder={placeholder} options={options}
      open={openKey === id} onToggle={toggle} onSelect={onSelect} hint={hint} />;

  return <SafeAreaView style={styles.safe}>
    <StatusBar barStyle={dark ? "light-content" : "dark-content"} />
    <View style={styles.header}><View style={[styles.headerInner, desktop && styles.wide]}>
      <View style={styles.brandLockup}>
        <Image source={require('./assets/specialist-badge.png')} style={styles.badge} resizeMode="contain" accessibilityLabel="Specialist S" />
        <Image source={require('./assets/specialist-logo.png')} style={styles.logo} resizeMode="contain" accessibilityLabel="Specialist Blinds & Shades" />
      </View>
      <View style={styles.preferences}>
        <View accessibilityLabel={t('Idioma')} style={styles.preferenceGroup}>
          {(['es', 'en'] as const).map(code => <Pressable key={code} accessibilityRole="button" accessibilityLabel={code === 'es' ? 'Español' : 'English'} accessibilityState={{ selected: language === code }} onPress={() => setLanguage(code)} style={[styles.preferenceButton, language === code && styles.preferenceSelected]}><Text style={[styles.preferenceText, language === code && styles.preferenceSelectedText]}>{code.toUpperCase()}</Text></Pressable>)}
        </View>
        <View accessibilityLabel={t('Apariencia')} style={styles.preferenceGroup}>
          {(['light', 'dark'] as const).map(theme => <Pressable key={theme} accessibilityRole="button" accessibilityLabel={t(theme === 'light' ? 'Claro' : 'Oscuro')} accessibilityState={{ selected: dark === (theme === 'dark') }} onPress={() => setTheme(theme)} style={[styles.preferenceButton, dark === (theme === 'dark') && styles.preferenceSelected]}><Image source={theme === 'light' ? require('./assets/theme-sun.png') : require('./assets/theme-moon.png')} accessible={false} style={{ width: 21, height: 21, tintColor: dark && theme !== 'dark' ? '#EDF4FF' : BLUE }} /></Pressable>)}
        </View>
      </View>
    </View></View>
    <ScrollView ref={scrollRef} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.page}>
      <View style={[styles.layout, desktop && styles.layoutDesktop]}>
        {desktop && <View style={styles.sidebar}>
          <Text style={styles.overline}>{t("SPECIALIST BLINDS & SHADES")}</Text>
          <Text accessibilityRole="header" style={styles.sideTitle}>{t("Dale forma a tu espacio.")}</Text>
          <Text style={styles.intro}>{t("Cuéntanos qué necesitas en cuatro pasos. Las medidas son opcionales.")}</Text>
          {['Tu proyecto', 'Tu solución', 'Detalles opcionales', 'Contacto y revisión'].map((label, index) =>
            <View key={label} style={[styles.sideStep, step === index + 1 && !complete && styles.sideStepActive]}>
              <Text style={styles.sectionNumber}>{index + 1}</Text><Text style={styles.sideStepLabel}>{t(label)}</Text>
            </View>)}
          <View style={styles.summary}>
            <Text style={styles.overline}>{t("TU SELECCIÓN")}</Text>
            <Text style={styles.summaryLine}>{t(project.type || 'Tipo de proyecto pendiente')}</Text>
            <Text style={styles.summaryLine}>{t(project.area || 'Área pendiente')}{project.town ? ` · ${project.town}` : ''}</Text>
            <Text style={styles.summaryLine}>{t(chosenProduct?.name || 'Producto pendiente')}</Text>
            <Text style={styles.summaryLine}>{t(prefs.service)}</Text>
          </View>
          <Text style={styles.demoNotice}>{t("Vista de prueba. No se envían solicitudes ni se reservan visitas.")}</Text>
        </View>}
        <View style={[styles.canvas, desktop && styles.desktopCanvas]}>
        {complete ? <View style={styles.success}>
          <Text style={styles.overline}>{t("SIMULACIÓN COMPLETADA")}</Text>
          <Text accessibilityRole="header" style={styles.pageTitle}>{t("Así se vería el cierre de tu solicitud.")}</Text>
          <Text style={styles.intro}>{t("Esto es una prueba: no se guardó en un servidor, no se envió a Specialist ni se reservó una visita. El envío real estará disponible al conectar el servicio.")}</Text>
          <Text style={styles.summaryLine}>{project.name} · {project.town}</Text>
          <Text style={styles.summaryLine}>{chosenProduct?.name} · {t(prefs.service)}</Text>
          <Action label="Volver a revisar" onPress={() => { setComplete(false); goToStep(4); }} />
          <Action label="Crear otro proyecto" secondary onPress={reset} />
        </View> : <>
          <View style={styles.stepTop}>
            <Text style={styles.stepCounter}>{t('PASO')} {step} {t('DE')} 4</Text>
            <Text style={styles.stepName}>{t(['Proyecto', 'Solución', 'Detalles', 'Contacto'][step - 1])}</Text>
          </View>
          <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${step * 25}%` }]} /></View>
          {step === 1 && !desktop && <View style={styles.wizardIntro}>
            <Text style={styles.introTitle}>{t("Tu espacio, a tu manera.")}</Text>
            <Text style={styles.introCopy}>{t("Escoge tus preferencias. Prepara tu solicitud paso a paso.")}</Text>
          </View>}
          <Text style={styles.demoNotice}>{t("DEMO LOCAL · Usa datos ficticios. Nada se envía ni se guarda fuera de esta sesión.")}</Text>
          {step === 1 && <Section number="01" label="TU PROYECTO" title="Empecemos por el espacio.">
            {dropdown('type', 'Tipo de proyecto', project.type, 'Selecciona una opción', choices.types.map(value => ({ value })), value => update('type', value))}
            {dropdown('area', 'Área a transformar', project.area, 'Selecciona un espacio', choices.areas.map(value => ({ value })), value => update('area', value))}
            <Field label="Municipio" value={project.town} onChangeText={value => update('town', value)} placeholder="Ej. Ponce" />
          </Section>}
          {step === 2 && <Section number="02" label="TU SOLUCIÓN" title="¿Qué buscas lograr?">
            {dropdown('goal', 'Lo más importante para ti', project.goal, 'Selecciona tu prioridad', choices.goals.map(value => ({ value })), value => update('goal', value))}
            {dropdown('product', 'Tipo de cortina', chosenProduct?.name ?? '', 'Explora nuestros productos', productOptions,
              value => update('productId', products.find(p => p.name === value)?.id ?? ''), project.goal ? 'Las primeras opciones se sugieren según tu prioridad.' : 'Selecciona una prioridad para ver sugerencias.')}
          </Section>}
          {step === 3 && <Section number="03" label="DETALLES OPCIONALES" title="Si tienes medidas, mejor.">
            <Text style={styles.sectionCopy}>{t("Puedes dejarlas en blanco. El estimado solo aparecerá cuando haya medidas completas.")}</Text>
            {measures.map((row, index) => <View key={row.id} style={styles.measureCard}>
              <View style={styles.measureHead}><Text style={styles.measureTitle}>{t('Ventana')} {index + 1}</Text>{measures.length > 1 && <Pressable accessibilityRole="button" onPress={() => setMeasures(prev => prev.filter(m => m.id !== row.id))}><Text style={styles.remove}>{t("Quitar")}</Text></Pressable>}</View>
              <Field label="Área" value={row.area} onChangeText={v => updateMeasure(row.id, 'area', v)} placeholder="Ej. Sala" />
              <View style={styles.twoColumns}><View style={styles.column}><Field label="Ancho · pulg." value={row.width} onChangeText={v => updateMeasure(row.id, 'width', v)} keyboardType="numeric" /></View><View style={styles.column}><Field label="Alto · pulg." value={row.height} onChangeText={v => updateMeasure(row.id, 'height', v)} keyboardType="numeric" /></View></View>
              <Field label="Cantidad" value={row.qty} onChangeText={v => updateMeasure(row.id, 'qty', v)} keyboardType="numeric" />
            </View>)}
            <Action label="+ Añadir otra ventana" secondary onPress={() => { setMeasures(prev => [...prev, emptyMeasure(nextId)]); setNextId(prev => prev + 1); }} />
            {dropdown('service', 'Servicio preferido', prefs.service, 'Selecciona un servicio',
              ['Instaladas', 'Recogido en tienda', 'Entrega/envío'].map(value => ({ value })), value => setPrefs(prev => ({ ...prev, service: value as Preferences['service'] })))}
            <View style={styles.chips}>{([['motorized', 'Motorizar'], ['blackout', 'Blackout'], ['needsSamples', 'Ver muestras']] as const).map(([key, label]) => <Pressable key={key} accessibilityRole="button" accessibilityState={{ selected: prefs[key] }} onPress={() => setPrefs(prev => ({ ...prev, [key]: !prev[key] }))} style={[styles.chip, prefs[key] && styles.chipActive]}><Text style={[styles.chipText, prefs[key] && styles.chipTextActive]}>{prefs[key] ? '✓  ' : '+  '}{t(label)}</Text></Pressable>)}</View>
            <View style={styles.estimateCard}><Text style={styles.estimateLabel}>{t("ESTIMADO PRELIMINAR")}</Text><Text style={styles.estimateValue}>{estimate.windows ? `${money(estimate.low)} – ${money(estimate.high)}` : t('Pendiente de medidas')}</Text><Text style={styles.estimateNote}>{t("Precios ilustrativos. Specialist valida producto, medidas y precio final.")}</Text></View>
          </Section>}
          {step === 4 && <Section number="04" label="PRÓXIMO PASO" title="Deja un contacto de ejemplo.">
            <Text style={styles.sectionCopy}>{t("Horarios de muestra, no disponibilidad real. No uses información personal.")}</Text>
            {dropdown('slot', 'Ventana tentativa', project.slot, 'Selecciona un horario', choices.slots.map(value => ({ value })), value => update('slot', value))}
            <Field label="Nombre ficticio" value={project.name} onChangeText={v => update('name', v)} placeholder="Ej. Cliente Demo" />
            <Field label="Teléfono ficticio" value={project.phone} onChangeText={v => update('phone', v)} keyboardType="phone-pad" placeholder="Ej. 787-000-0000" />
          </Section>}
          {step === 4 && <View style={styles.summary}><Text style={styles.overline}>{t("TU PROYECTO EN BREVE")}</Text><Text style={styles.summaryLine}>{t(project.type || 'Tipo por seleccionar')} · {t(project.area || 'Área por seleccionar')}</Text><Text style={styles.summaryLine}>{project.town || t('Municipio por indicar')} · {t(chosenProduct?.name || 'Cortina por seleccionar')}</Text><Text style={styles.summaryLine}>{estimate.windows ? `${estimate.windows} ${t(estimate.windows === 1 ? 'cortina' : 'cortinas')} · ${money(estimate.low)}–${money(estimate.high)}` : t('Medidas opcionales pendientes')}</Text></View>}
        </>}
      </View>
      </View>
    </ScrollView>
    {!complete && <View style={styles.footer}>
      <View style={[styles.footerInner, desktop && styles.desktopFooter]}>
        {!!error && <Text accessibilityRole="alert" style={styles.error}>{t(error)}</Text>}
        <View style={styles.stepActions}>
          {step > 1 && <View style={styles.backAction}><Action label="← Atrás" secondary onPress={() => goToStep(step - 1)} /></View>}
          <View style={styles.nextAction}><Action label={step === 4 ? 'Someter · prueba →' : step === 3 && !estimate.windows ? 'Omitir medidas y seguir →' : 'Siguiente →'} onPress={next} /></View>
        </View>
      </View>
    </View>}
  </SafeAreaView>;
}

const makeStyles = (dark: boolean) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: dark ? '#0B1423' : '#F4F6F9' },
  header: { backgroundColor: dark ? '#142137' : '#FFFFFF', borderBottomWidth: 1, borderBottomColor: dark ? '#3D526E' : '#E6E9EF' },
  headerInner: { width: '100%', maxWidth: 650, alignSelf: 'center', paddingHorizontal: 20, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 },
  brandLockup: { backgroundColor: '#FFFFFF', borderRadius: 8, padding: 5, flexDirection: 'row', alignItems: 'center', gap: 9 },
  badge: { width: 40, height: 40 },
  logo: { width: 138, height: 35 },
  headerTag: { color: dark ? '#EDF4FF' : BLUE, fontSize: 10, fontWeight: '800', letterSpacing: 1.3 },
  preferences: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  preferenceGroup: { flexDirection: 'row', gap: 2, padding: 3, borderRadius: 10, backgroundColor: dark ? '#233650' : '#E7EDF5' },
  preferenceButton: { minWidth: 44, minHeight: 44, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center', borderRadius: 7 },
  preferenceSelected: { backgroundColor: YELLOW },
  preferenceText: { color: dark ? '#EDF4FF' : BLUE, fontSize: 12, fontWeight: '700' },
  preferenceSelectedText: { color: BLUE },
  page: { paddingBottom: 64 },
  layout: { width: '100%', maxWidth: 1120, alignSelf: 'center', paddingTop: 24 },
  layoutDesktop: { flexDirection: 'row', alignItems: 'flex-start', gap: 48, paddingHorizontal: 28, paddingTop: 40 },
  wide: { maxWidth: 1120, paddingHorizontal: 28 },
  sidebar: { width: 300 },
  sideTitle: { fontSize: 36, lineHeight: 42, color: dark ? '#EDF4FF' : BLUE, fontWeight: '800', marginTop: 20, marginBottom: 18 },
  sideStep: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 10, marginTop: 6 },
  sideStepActive: { backgroundColor: dark ? '#233650' : '#E4EBF5' },
  sideStepLabel: { color: dark ? '#EDF4FF' : BLUE, fontSize: 14, fontWeight: '700', flex: 1 },
  canvas: { width: '100%', maxWidth: 650, alignSelf: 'center', paddingHorizontal: 20 },
  desktopCanvas: { flex: 1, minWidth: 0, alignSelf: 'flex-start', backgroundColor: dark ? '#142137' : '#FFFFFF', borderRadius: 20, padding: 28, borderWidth: 1, borderColor: dark ? '#3D526E' : '#E1E6ED' },
  desktopFooter: { maxWidth: 1120, paddingLeft: 376, paddingRight: 56 },
  stepTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4, marginBottom: 11 },
  stepCounter: { color: dark ? '#EDF4FF' : BLUE, fontSize: 11, fontWeight: '900', letterSpacing: 1.4 },
  stepName: { color: dark ? '#BAC9DC' : '#64758D', fontSize: 13, fontWeight: '700' },
  progressTrack: { height: 5, backgroundColor: dark ? '#31445E' : '#DEE6EF', borderRadius: 4, marginBottom: 18 },
  progressFill: { height: 5, backgroundColor: YELLOW, borderRadius: 4 },
  footer: { backgroundColor: dark ? '#142137' : '#FFFFFF', borderTopWidth: 1, borderTopColor: dark ? '#3D526E' : '#D9E2EE', paddingBottom: 10 },
  footerInner: { width: '100%', maxWidth: 650, alignSelf: 'center', paddingHorizontal: 20 },
  stepActions: { flexDirection: 'row', gap: 10, alignItems: 'stretch', marginTop: 8 },
  backAction: { flex: 1 },
  nextAction: { flex: 2 },
  wizardIntro: { backgroundColor: BLUE, borderRadius: 13, paddingHorizontal: 19, paddingVertical: 15 },
  introTitle: { color: '#FFFFFF', fontSize: 21, fontWeight: '900' },
  introCopy: { color: '#DDE9F7', fontSize: 12, marginTop: 4 },
  demoNotice: { color: dark ? '#BAC9DC' : '#5B6980', fontSize: 11, lineHeight: 17, marginTop: 15, marginBottom: 6 },
  section: { paddingTop: 28, paddingBottom: 31, borderBottomWidth: 1, borderBottomColor: dark ? '#3D526E' : '#E1E6ED' },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionNumber: { color: BLUE, backgroundColor: YELLOW, fontWeight: '900', fontSize: 11, paddingHorizontal: 8, paddingVertical: 6, borderRadius: 5, overflow: 'hidden' },
  sectionLabel: { color: dark ? '#BAC9DC' : '#66778C', fontSize: 10, fontWeight: '900', letterSpacing: 1.6 },
  sectionTitle: { fontSize: 24, fontWeight: '800', color: dark ? '#EDF4FF' : BLUE, marginTop: 15, marginBottom: 12 },
  sectionCopy: { color: dark ? '#BAC9DC' : '#54647A', fontSize: 14, lineHeight: 21, marginBottom: 8 },
  dropdownField: { marginTop: 14 },
  label: { color: dark ? '#BAC9DC' : '#263E61', fontSize: 13, fontWeight: '800', marginBottom: 8 },
  select: { backgroundColor: dark ? '#142137' : '#FFFFFF', borderWidth: 1, borderColor: dark ? '#3D526E' : '#CAD5E3', borderRadius: 10, minHeight: 54, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  selectOpen: { borderColor: dark ? '#93BFFE' : BLUE, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },
  selectText: { color: dark ? '#EDF4FF' : BLUE, fontSize: 15, fontWeight: '600', flex: 1 },
  placeholder: { color: dark ? '#BAC9DC' : '#748299', fontWeight: '400' },
  chevron: { color: dark ? '#EDF4FF' : BLUE, fontSize: 23, lineHeight: 25, marginLeft: 10 },
  menu: { backgroundColor: dark ? '#142137' : '#FFFFFF', borderWidth: 1, borderTopWidth: 0, borderColor: dark ? '#93BFFE' : BLUE, borderBottomLeftRadius: 10, borderBottomRightRadius: 10, overflow: 'hidden', elevation: 3, shadowColor: '#123A67', shadowOpacity: 0.08, shadowRadius: 9 },
  menuItem: { paddingHorizontal: 15, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', minHeight: 48 },
  menuDivider: { borderTopWidth: 1, borderTopColor: dark ? '#3D526E' : '#EDF0F4' },
  menuSelected: { backgroundColor: dark ? '#233650' : '#F0F4FA' },
  menuTextWrap: { flex: 1 },
  menuTitle: { color: dark ? '#EDF4FF' : BLUE, fontWeight: '700', fontSize: 14 },
  menuDetail: { color: dark ? '#BAC9DC' : '#697C94', fontSize: 12, marginTop: 3 },
  check: { color: dark ? '#EDF4FF' : BLUE, fontSize: 17, fontWeight: '900' },
  hint: { color: dark ? '#BAC9DC' : '#758397', fontSize: 11, marginTop: 6 },
  inputField: { marginTop: 14 },
  input: { backgroundColor: dark ? '#142137' : '#FFFFFF', borderWidth: 1, borderColor: dark ? '#3D526E' : '#CAD5E3', borderRadius: 10, minHeight: 54, paddingHorizontal: 15, color: dark ? '#EDF4FF' : BLUE, fontSize: 15 },
  measureCard: { backgroundColor: dark ? '#142137' : '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: dark ? '#3D526E' : '#E0E6ED', padding: 17, marginTop: 15 },
  measureHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  measureTitle: { color: dark ? '#EDF4FF' : BLUE, fontWeight: '800', fontSize: 15 },
  remove: { color: dark ? '#FFB4AA' : '#9D3A35', fontSize: 13, fontWeight: '700' },
  twoColumns: { flexDirection: 'row', gap: 10 },
  column: { flex: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
  chip: { backgroundColor: dark ? '#142137' : '#FFFFFF', borderWidth: 1, borderColor: dark ? '#3D526E' : '#CAD5E3', borderRadius: 20, paddingVertical: 9, paddingHorizontal: 13 },
  chipActive: { backgroundColor: dark ? '#233650' : '#E9F0FA', borderColor: dark ? '#93BFFE' : BLUE },
  chipText: { color: dark ? '#BAC9DC' : '#3A5270', fontSize: 12, fontWeight: '700' },
  chipTextActive: { color: dark ? '#EDF4FF' : BLUE },
  estimateCard: { backgroundColor: dark ? '#29291F' : '#FFF8D5', borderLeftWidth: 4, borderLeftColor: YELLOW, borderRadius: 9, padding: 18, marginTop: 20 },
  estimateLabel: { color: dark ? '#EDF4FF' : BLUE, fontSize: 10, fontWeight: '900', letterSpacing: 1.4 },
  estimateValue: { color: dark ? '#EDF4FF' : BLUE, fontSize: 25, fontWeight: '900', marginTop: 7 },
  estimateNote: { color: dark ? '#BAC9DC' : '#5D6470', fontSize: 11, lineHeight: 17, marginTop: 9 },
  action: { backgroundColor: YELLOW, borderRadius: 10, minHeight: 51, paddingHorizontal: 16, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', marginTop: 15 },
  actionSecondary: { backgroundColor: dark ? '#263950' : '#E7EDF5' },
  actionText: { color: BLUE, fontWeight: '900', fontSize: 14, textAlign: 'center' },
  actionTextSecondary: { color: dark ? '#BAC9DC' : '#30496B' },
  summary: { padding: 21, backgroundColor: dark ? '#1D3049' : '#E8EEF6', borderRadius: 12, marginTop: 24 },
  overline: { color: dark ? '#EDF4FF' : BLUE, fontSize: 10, letterSpacing: 1.5, fontWeight: '900', marginTop: 4 },
  summaryLine: { color: dark ? '#BAC9DC' : '#36516F', fontSize: 13, lineHeight: 21, marginTop: 8 },
  error: { color: dark ? '#FFB4AA' : '#A22C25', fontSize: 13, fontWeight: '700', marginTop: 15 },
  bottomNote: { color: dark ? '#BAC9DC' : '#788495', fontSize: 11, textAlign: 'center', marginTop: 12 },
  pageTitle: { fontSize: 29, fontWeight: '900', color: dark ? '#EDF4FF' : BLUE, marginTop: 13, marginBottom: 11 },
  intro: { color: dark ? '#BAC9DC' : '#586A81', fontSize: 15, lineHeight: 23, marginBottom: 18 },
  success: { backgroundColor: dark ? '#142137' : '#FFFFFF', padding: 25, borderRadius: 16, marginTop: 8 },
});

const lightStyles = makeStyles(false);
const darkStyles = makeStyles(true);
