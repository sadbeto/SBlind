import { useRef, useState } from 'react';
import { Alert, Image, Pressable, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, View, type ScrollViewInstance } from 'react-native';
import {
  BLUE, YELLOW, calculate, choices, defaultPreferences, emptyMeasure, emptyProject,
  money, products, recommendedProducts, validateProject, validateStep,
  type Lead, type Measure, type Preferences, type Project,
} from './src/domain';

type Screen = 'builder' | 'inbox';
type Option = { value: string; detail?: string };

function Dropdown({ id, label, value, placeholder, options, open, onToggle, onSelect, hint }: {
  id: string; label: string; value: string; placeholder: string; options: Option[];
  open: boolean; onToggle: (id: string) => void; onSelect: (value: string) => void; hint?: string;
}) {
  return (
    <View style={styles.dropdownField}>
      <Text style={styles.label}>{label}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ expanded: open }}
        onPress={() => onToggle(id)} style={[styles.select, open && styles.selectOpen]}>
        <Text style={[styles.selectText, !value && styles.placeholder]}>{value || placeholder}</Text>
        <Text style={styles.chevron}>{open ? '⌃' : '⌄'}</Text>
      </Pressable>
      {open && <View style={styles.menu}>
        {options.map((option, index) => (
          <Pressable key={option.value} accessibilityRole="button" accessibilityState={{ selected: value === option.value }}
            onPress={() => onSelect(option.value)} style={[styles.menuItem, index > 0 && styles.menuDivider, value === option.value && styles.menuSelected]}>
            <View style={styles.menuTextWrap}>
              <Text style={styles.menuTitle}>{option.value}</Text>
              {!!option.detail && <Text style={styles.menuDetail}>{option.detail}</Text>}
            </View>
            {value === option.value && <Text style={styles.check}>✓</Text>}
          </Pressable>
        ))}
      </View>}
      {!!hint && <Text style={styles.hint}>{hint}</Text>}
    </View>
  );
}

function Field({ label, value, onChangeText, placeholder, keyboardType }: {
  label: string; value: string; onChangeText: (value: string) => void;
  placeholder?: string; keyboardType?: 'default' | 'numeric' | 'phone-pad';
}) {
  return (
    <View style={styles.inputField}>
      <Text style={styles.label}>{label}</Text>
      <TextInput accessibilityLabel={label} value={value} onChangeText={onChangeText}
        placeholder={placeholder} placeholderTextColor="#78869A" keyboardType={keyboardType ?? 'default'}
        autoCapitalize={keyboardType === 'phone-pad' || keyboardType === 'numeric' ? 'none' : 'sentences'}
        style={styles.input} />
    </View>
  );
}

function Action({ label, onPress, secondary = false }: { label: string; onPress: () => void; secondary?: boolean }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={[styles.action, secondary && styles.actionSecondary]}>
    <Text style={[styles.actionText, secondary && styles.actionTextSecondary]}>{label}</Text>
  </Pressable>;
}

function Section({ number, label, title, children }: { number: string; label: string; title: string; children: React.ReactNode }) {
  return <View style={styles.section}>
    <View style={styles.sectionHead}><Text style={styles.sectionNumber}>{number}</Text><Text style={styles.sectionLabel}>{label}</Text></View>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>;
}

export default function App() {
  const scrollRef = useRef<ScrollViewInstance>(null);
  const [screen, setScreen] = useState<Screen>('builder');
  const [step, setStep] = useState(1);
  const [project, setProject] = useState<Project>(emptyProject);
  const [measures, setMeasures] = useState<Measure[]>([emptyMeasure(1)]);
  const [nextId, setNextId] = useState(2);
  const [prefs, setPrefs] = useState<Preferences>(defaultPreferences);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [lastFolio, setLastFolio] = useState('');
  const [complete, setComplete] = useState(false);
  const estimate = calculate(project, measures, prefs);
  const chosenProduct = products.find(p => p.id === project.productId);
  const suggested = recommendedProducts(project.goal);
  const productOptions: Option[] = [
    ...suggested.map(p => ({ value: p.name, detail: `Sugerido · ${p.note}` })),
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
    setPrefs(defaultPreferences()); setOpenKey(null); setComplete(false); setLastFolio('');
    setStep(1); setError(''); setScreen('builder');
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
    const folio = `SB-DEMO-${String(leads.length + 1).padStart(3, '0')}`;
    setLeads(prev => [{ folio, project: { ...project }, estimate: { ...estimate } }, ...prev]);
    setLastFolio(folio); setComplete(true); setError(''); setOpenKey(null);
  };
  const clearLeads = () => Alert.alert('Borrar solicitudes', 'Solo existen en esta sesión.', [
    { text: 'Cancelar', style: 'cancel' }, { text: 'Borrar', style: 'destructive', onPress: () => setLeads([]) },
  ]);
  const dropdown = (id: string, label: string, value: string, placeholder: string, options: Option[], onSelect: (value: string) => void, hint?: string) =>
    <Dropdown id={id} label={label} value={value} placeholder={placeholder} options={options}
      open={openKey === id} onToggle={toggle} onSelect={onSelect} hint={hint} />;

  return <SafeAreaView style={styles.safe}>
    <StatusBar barStyle="dark-content" />
    <View style={styles.header}><View style={styles.headerInner}>
      <View style={styles.brandLockup}>
        <Image source={require('./assets/specialist-badge.png')} style={styles.badge} resizeMode="contain" accessibilityLabel="Specialist S" />
        <Image source={require('./assets/specialist-logo.png')} style={styles.logo} resizeMode="contain" accessibilityLabel="Specialist Blinds & Shades" />
      </View>
      <Text style={styles.headerTag}>DEMO</Text>
    </View></View>
    <ScrollView ref={scrollRef} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.page}>
      <View style={styles.canvas}>
        <View style={styles.nav}>
          <Pressable accessibilityRole="tab" accessibilityState={{ selected: screen === 'builder' }} onPress={() => setScreen('builder')} style={[styles.navTab, screen === 'builder' && styles.navActive]}><Text style={[styles.navText, screen === 'builder' && styles.navTextActive]}>Mi proyecto</Text></Pressable>
          <Pressable accessibilityRole="tab" accessibilityState={{ selected: screen === 'inbox' }} onPress={() => setScreen('inbox')} style={[styles.navTab, screen === 'inbox' && styles.navActive]}><Text style={[styles.navText, screen === 'inbox' && styles.navTextActive]}>Panel demo  {leads.length ? `(${leads.length})` : ''}</Text></Pressable>
        </View>
        {screen === 'inbox' ? <>
          <Text style={styles.overline}>VISTA DEMO / SIN BACKEND</Text>
          <Text style={styles.pageTitle}>Proyectos preparados.</Text>
          <Text style={styles.intro}>Aquí se verían las solicitudes. Por ahora solo existen en esta sesión y no llegan al negocio.</Text>
          {leads.length === 0 ? <View style={styles.empty}><Text style={styles.emptyText}>Aún no hay proyectos. Completa el formulario para ver cómo se organizarían aquí.</Text></View> : leads.map(lead => <View style={styles.leadCard} key={lead.folio}>
            <Text style={styles.leadFolio}>{lead.folio}</Text><Text style={styles.leadName}>{lead.project.name}</Text>
            <Text style={styles.leadDetail}>{lead.project.area} · {lead.project.town}</Text>
            <Text style={styles.leadDetail}>{products.find(p => p.id === lead.project.productId)?.name}</Text>
            <Text style={styles.leadDetail}>{lead.estimate.windows ? `${lead.estimate.windows} ${lead.estimate.windows === 1 ? 'cortina' : 'cortinas'} · ${money(lead.estimate.low)}–${money(lead.estimate.high)}` : 'Precio pendiente de medidas'}</Text>
            <Text style={styles.leadDetail}>Horario ilustrativo: {lead.project.slot}</Text>
          </View>)}
          {leads.length > 0 && <Action label="Borrar solicitudes del demo" secondary onPress={clearLeads} />}
        </> : complete ? <View style={styles.success}>
          <Text style={styles.overline}>PROYECTO GUARDADO EN EL DEMO</Text>
          <Text style={styles.pageTitle}>{lastFolio}</Text>
          <Text style={styles.intro}>Ya aparece en el panel de esta app. No se envió a Specialist ni se reservó una visita real.</Text>
          <Action label="Ver panel demo" onPress={() => setScreen('inbox')} />
          <Action label="Crear otro proyecto" secondary onPress={reset} />
        </View> : <>
          <View style={styles.stepTop}>
            <Text style={styles.stepCounter}>PASO {step} DE 4</Text>
            <Text style={styles.stepName}>{['Proyecto', 'Solución', 'Detalles', 'Visita'][step - 1]}</Text>
          </View>
          <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${step * 25}%` }]} /></View>
          {step === 1 && <View style={styles.wizardIntro}>
            <Text style={styles.introTitle}>Tu espacio, a tu manera.</Text>
            <Text style={styles.introCopy}>Escoge tus preferencias. Nosotros organizamos el resto.</Text>
          </View>}
          <Text style={styles.demoNotice}>DEMO LOCAL · Usa datos ficticios. Nada se envía ni se guarda fuera de esta sesión.</Text>
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
            <Text style={styles.sectionCopy}>Puedes dejarlas en blanco. El estimado solo aparecerá cuando haya medidas completas.</Text>
            {measures.map((row, index) => <View key={row.id} style={styles.measureCard}>
              <View style={styles.measureHead}><Text style={styles.measureTitle}>Ventana {index + 1}</Text>{measures.length > 1 && <Pressable accessibilityRole="button" onPress={() => setMeasures(prev => prev.filter(m => m.id !== row.id))}><Text style={styles.remove}>Quitar</Text></Pressable>}</View>
              <Field label="Área" value={row.area} onChangeText={v => updateMeasure(row.id, 'area', v)} placeholder="Ej. Sala" />
              <View style={styles.twoColumns}><View style={styles.column}><Field label="Ancho · pulg." value={row.width} onChangeText={v => updateMeasure(row.id, 'width', v)} keyboardType="numeric" /></View><View style={styles.column}><Field label="Alto · pulg." value={row.height} onChangeText={v => updateMeasure(row.id, 'height', v)} keyboardType="numeric" /></View></View>
              <Field label="Cantidad" value={row.qty} onChangeText={v => updateMeasure(row.id, 'qty', v)} keyboardType="numeric" />
            </View>)}
            <Action label="+ Añadir otra ventana" secondary onPress={() => { setMeasures(prev => [...prev, emptyMeasure(nextId)]); setNextId(prev => prev + 1); }} />
            {dropdown('service', 'Servicio preferido', prefs.service, 'Selecciona un servicio',
              ['Instaladas', 'Recogido en tienda', 'Entrega/envío'].map(value => ({ value })), value => setPrefs(prev => ({ ...prev, service: value as Preferences['service'] })))}
            <View style={styles.chips}>{([['motorized', 'Motorizar'], ['blackout', 'Blackout'], ['needsSamples', 'Ver muestras']] as const).map(([key, label]) => <Pressable key={key} accessibilityRole="button" accessibilityState={{ selected: prefs[key] }} onPress={() => setPrefs(prev => ({ ...prev, [key]: !prev[key] }))} style={[styles.chip, prefs[key] && styles.chipActive]}><Text style={[styles.chipText, prefs[key] && styles.chipTextActive]}>{prefs[key] ? '✓  ' : '+  '}{label}</Text></Pressable>)}</View>
            <View style={styles.estimateCard}><Text style={styles.estimateLabel}>ESTIMADO PRELIMINAR</Text><Text style={styles.estimateValue}>{estimate.windows ? `${money(estimate.low)} – ${money(estimate.high)}` : 'Pendiente de medidas'}</Text><Text style={styles.estimateNote}>Precios ilustrativos. Specialist valida producto, medidas y precio final.</Text></View>
          </Section>}
          {step === 4 && <Section number="04" label="PRÓXIMO PASO" title="Deja un contacto de ejemplo.">
            <Text style={styles.sectionCopy}>Horarios de muestra, no disponibilidad real. No uses información personal.</Text>
            {dropdown('slot', 'Ventana tentativa', project.slot, 'Selecciona un horario', choices.slots.map(value => ({ value })), value => update('slot', value))}
            <Field label="Nombre ficticio" value={project.name} onChangeText={v => update('name', v)} placeholder="Ej. Cliente Demo" />
            <Field label="Teléfono ficticio" value={project.phone} onChangeText={v => update('phone', v)} keyboardType="phone-pad" placeholder="Ej. 787-000-0000" />
          </Section>}
          {step === 4 && <View style={styles.summary}><Text style={styles.overline}>TU PROYECTO EN BREVE</Text><Text style={styles.summaryLine}>{project.type || 'Tipo por seleccionar'} · {project.area || 'Área por seleccionar'}</Text><Text style={styles.summaryLine}>{project.town || 'Municipio por indicar'} · {chosenProduct?.name || 'Cortina por seleccionar'}</Text><Text style={styles.summaryLine}>{estimate.windows ? `${estimate.windows} ${estimate.windows === 1 ? 'cortina' : 'cortinas'} · ${money(estimate.low)}–${money(estimate.high)}` : 'Medidas opcionales pendientes'}</Text></View>}
        </>}
      </View>
    </ScrollView>
    {screen === 'builder' && !complete && <View style={styles.footer}>
      <View style={styles.footerInner}>
        {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
        <View style={styles.stepActions}>
          {step > 1 && <View style={styles.backAction}><Action label="← Atrás" secondary onPress={() => goToStep(step - 1)} /></View>}
          <View style={styles.nextAction}><Action label={step === 4 ? 'Guardar proyecto en el demo →' : step === 3 && !estimate.windows ? 'Omitir medidas y seguir →' : 'Siguiente →'} onPress={next} /></View>
        </View>
      </View>
    </View>}
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F4F6F9' },
  header: { backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E6E9EF' },
  headerInner: { width: '100%', maxWidth: 650, alignSelf: 'center', paddingHorizontal: 20, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brandLockup: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  badge: { width: 40, height: 40 },
  logo: { width: 138, height: 35 },
  headerTag: { color: BLUE, fontSize: 10, fontWeight: '800', letterSpacing: 1.3 },
  page: { paddingBottom: 64 },
  canvas: { width: '100%', maxWidth: 650, alignSelf: 'center', paddingHorizontal: 20 },
  nav: { flexDirection: 'row', gap: 22, marginTop: 20, marginBottom: 20 },
  navTab: { paddingVertical: 9, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  navActive: { borderBottomColor: YELLOW },
  navText: { color: '#6D7B8C', fontWeight: '700', fontSize: 13 },
  navTextActive: { color: BLUE },
  stepTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4, marginBottom: 11 },
  stepCounter: { color: BLUE, fontSize: 11, fontWeight: '900', letterSpacing: 1.4 },
  stepName: { color: '#64758D', fontSize: 13, fontWeight: '700' },
  progressTrack: { height: 5, backgroundColor: '#DEE6EF', borderRadius: 4, marginBottom: 18 },
  progressFill: { height: 5, backgroundColor: YELLOW, borderRadius: 4 },
  footer: { backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#D9E2EE', paddingBottom: 10 },
  footerInner: { width: '100%', maxWidth: 650, alignSelf: 'center', paddingHorizontal: 20 },
  stepActions: { flexDirection: 'row', gap: 10, alignItems: 'stretch', marginTop: 8 },
  backAction: { flex: 1 },
  nextAction: { flex: 2 },
  wizardIntro: { backgroundColor: BLUE, borderRadius: 13, paddingHorizontal: 19, paddingVertical: 15 },
  introTitle: { color: '#FFFFFF', fontSize: 21, fontWeight: '900' },
  introCopy: { color: '#DDE9F7', fontSize: 12, marginTop: 4 },
  demoNotice: { color: '#5B6980', fontSize: 11, lineHeight: 17, marginTop: 15, marginBottom: 6 },
  section: { paddingTop: 28, paddingBottom: 31, borderBottomWidth: 1, borderBottomColor: '#E1E6ED' },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionNumber: { color: BLUE, backgroundColor: YELLOW, fontWeight: '900', fontSize: 11, paddingHorizontal: 8, paddingVertical: 6, borderRadius: 5, overflow: 'hidden' },
  sectionLabel: { color: '#66778C', fontSize: 10, fontWeight: '900', letterSpacing: 1.6 },
  sectionTitle: { fontSize: 24, fontWeight: '800', color: BLUE, marginTop: 15, marginBottom: 12 },
  sectionCopy: { color: '#54647A', fontSize: 14, lineHeight: 21, marginBottom: 8 },
  dropdownField: { marginTop: 14 },
  label: { color: '#263E61', fontSize: 13, fontWeight: '800', marginBottom: 8 },
  select: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#CAD5E3', borderRadius: 10, minHeight: 54, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  selectOpen: { borderColor: BLUE, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },
  selectText: { color: BLUE, fontSize: 15, fontWeight: '600', flex: 1 },
  placeholder: { color: '#748299', fontWeight: '400' },
  chevron: { color: BLUE, fontSize: 23, lineHeight: 25, marginLeft: 10 },
  menu: { backgroundColor: '#FFFFFF', borderWidth: 1, borderTopWidth: 0, borderColor: BLUE, borderBottomLeftRadius: 10, borderBottomRightRadius: 10, overflow: 'hidden', elevation: 3, shadowColor: '#123A67', shadowOpacity: 0.08, shadowRadius: 9 },
  menuItem: { paddingHorizontal: 15, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', minHeight: 48 },
  menuDivider: { borderTopWidth: 1, borderTopColor: '#EDF0F4' },
  menuSelected: { backgroundColor: '#F0F4FA' },
  menuTextWrap: { flex: 1 },
  menuTitle: { color: BLUE, fontWeight: '700', fontSize: 14 },
  menuDetail: { color: '#697C94', fontSize: 12, marginTop: 3 },
  check: { color: BLUE, fontSize: 17, fontWeight: '900' },
  hint: { color: '#758397', fontSize: 11, marginTop: 6 },
  inputField: { marginTop: 14 },
  input: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#CAD5E3', borderRadius: 10, minHeight: 54, paddingHorizontal: 15, color: BLUE, fontSize: 15 },
  measureCard: { backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E0E6ED', padding: 17, marginTop: 15 },
  measureHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  measureTitle: { color: BLUE, fontWeight: '800', fontSize: 15 },
  remove: { color: '#9D3A35', fontSize: 13, fontWeight: '700' },
  twoColumns: { flexDirection: 'row', gap: 10 },
  column: { flex: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
  chip: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#CAD5E3', borderRadius: 20, paddingVertical: 9, paddingHorizontal: 13 },
  chipActive: { backgroundColor: '#E9F0FA', borderColor: BLUE },
  chipText: { color: '#3A5270', fontSize: 12, fontWeight: '700' },
  chipTextActive: { color: BLUE },
  estimateCard: { backgroundColor: '#FFF8D5', borderLeftWidth: 4, borderLeftColor: YELLOW, borderRadius: 9, padding: 18, marginTop: 20 },
  estimateLabel: { color: BLUE, fontSize: 10, fontWeight: '900', letterSpacing: 1.4 },
  estimateValue: { color: BLUE, fontSize: 25, fontWeight: '900', marginTop: 7 },
  estimateNote: { color: '#5D6470', fontSize: 11, lineHeight: 17, marginTop: 9 },
  action: { backgroundColor: YELLOW, borderRadius: 10, minHeight: 51, paddingHorizontal: 16, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', marginTop: 15 },
  actionSecondary: { backgroundColor: '#E7EDF5' },
  actionText: { color: BLUE, fontWeight: '900', fontSize: 14, textAlign: 'center' },
  actionTextSecondary: { color: '#30496B' },
  summary: { padding: 21, backgroundColor: '#E8EEF6', borderRadius: 12, marginTop: 24 },
  overline: { color: BLUE, fontSize: 10, letterSpacing: 1.5, fontWeight: '900', marginTop: 4 },
  summaryLine: { color: '#36516F', fontSize: 13, lineHeight: 21, marginTop: 8 },
  error: { color: '#A22C25', fontSize: 13, fontWeight: '700', marginTop: 15 },
  bottomNote: { color: '#788495', fontSize: 11, textAlign: 'center', marginTop: 12 },
  pageTitle: { fontSize: 29, fontWeight: '900', color: BLUE, marginTop: 13, marginBottom: 11 },
  intro: { color: '#586A81', fontSize: 15, lineHeight: 23, marginBottom: 18 },
  empty: { backgroundColor: '#FFFFFF', padding: 22, borderRadius: 12, borderWidth: 1, borderColor: '#E0E6ED' },
  emptyText: { color: '#506179', lineHeight: 22 },
  leadCard: { backgroundColor: '#FFFFFF', padding: 19, borderRadius: 13, borderWidth: 1, borderColor: '#E0E6ED', marginBottom: 12 },
  leadFolio: { color: '#72849A', fontSize: 11, fontWeight: '800' },
  leadName: { color: BLUE, fontWeight: '900', fontSize: 18, marginTop: 6, marginBottom: 6 },
  leadDetail: { color: '#455C78', fontSize: 13, lineHeight: 22 },
  success: { backgroundColor: '#FFFFFF', padding: 25, borderRadius: 16, marginTop: 8 },
});
