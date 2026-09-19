// Banco de pruebas exhaustivo de la Escuadra (lógica), en node con un DOM de mentira,
// reloj virtual y sensores simulados. Uso: node pruebas.js
'use strict';
const fs = require('fs');
const RUTA = __dirname + '/';
const html = fs.readFileSync(RUTA + 'index.html', 'utf8');
const js = html.slice(html.indexOf('<script>') + 8, html.lastIndexOf('</script>'));

let ok = 0, mal = 0; const fallos = []; const cola = [];
function prueba(nombre, f) { cola.push([nombre, f]); }
function seccion(t) { cola.push([t, null]); }
async function ejecutar() {
  for (const [nombre, f] of cola) {
    if (!f) { console.log(nombre); continue; }
    try { const r = await f(); if (r === false) throw new Error('resultado falso'); ok++; console.log('  ✓ ' + nombre); }
    catch (e) { mal++; fallos.push(nombre + ': ' + e.message); console.log('  ✗ ' + nombre + ' → ' + e.message); }
  }
  console.log(`
RESULTADO: ${ok} correctas, ${mal} fallidas`);
  if (mal) { console.log('Fallos:'); for (const f of fallos) console.log(' - ' + f); process.exitCode = 1; }
}
const igual = (a, b, msg) => { if (a !== b) throw new Error((msg || '') + ' esperado ' + JSON.stringify(b) + ', obtenido ' + JSON.stringify(a)); };
const cerca = (a, b, tol, msg) => { if (Math.abs(a - b) > tol) throw new Error((msg || '') + ' esperado ≈' + b + ' (±' + tol + '), obtenido ' + a); };
const cierto = (c, msg) => { if (!c) throw new Error(msg || 'condición falsa'); };

/* ───────── DOM y entorno de mentira ───────── */
async function crearEntorno(ajustesGuardados) {
  const env = { now: 0, timers: [], rafs: [], log: [], guardado: null, oyentes: {}, oyentesDoc: {}, els: {} };
  const ids = html.match(/id="([^"]+)"/g).map(s => s.slice(4, -1));
  function nuevoEl(tag, id) {
    const e = {
      tag, id: id || '', attrs: {}, children: [], _text: '', checked: false, value: '0', disabled: false, hidden: false,
      handlers: {}, classList: { toggle() {}, add() {}, remove() {} }, style: {},
      videoWidth: 640, videoHeight: 480, readyState: 0, srcObject: null, width: 0, height: 0,
      setAttribute(k, v) { this.attrs[k] = String(v); if (k === 'name') this.name = String(v); if (k === 'value') this.value = String(v); },
      setAttributeNS(ns, k, v) { this.attrs[k] = String(v); },
      getAttribute(k) { return this.attrs[k] == null ? null : this.attrs[k]; },
      addEventListener(t, f) { (this.handlers[t] = this.handlers[t] || []).push(f); },
      dispatch(t, ev) { for (const f of this.handlers[t] || []) f(ev || {}); },
      click() { this.dispatch('click'); },
      appendChild(c) { this.children.push(c); return c; },
      querySelectorAll(sel) { return buscar(this, sel); },
      querySelector(sel) { return buscar(this, sel)[0] || null; },
      showModal() { this.abierto = true; }, close() { this.abierto = false; this.dispatch('close'); },
      play() { this.readyState = 4; return Promise.resolve(); },
      getContext() { return { clearRect() {}, strokeRect() {}, fillText() {}, set lineWidth(v) {}, set font(v) {}, set strokeStyle(v) {}, set fillStyle(v) {} }; },
    };
    Object.defineProperty(e, 'textContent', {
      get() { return this._text; },
      set(v) { if (v !== this._text && ['frase', 'cifra', 'guia', 'sentido', 'camaraEstado', 'tutoTexto', 'aprendidoTexto'].includes(this.id)) env.log.push([env.now, this.id, v]); this._text = v; this.children = []; },
    });
    return e;
  }
  function buscar(raiz, sel) {
    // Soporta [name=x], [name=x]:checked, script[src="..."]
    const m = sel.match(/^\[name=(\w+)\](:checked)?$/);
    if (m) return Object.values(env.els).filter(e => e.name === m[1] && (!m[2] || e.checked));
    return [];
  }
  for (const id of ids) env.els[id] = nuevoEl('div', id);
  // Radios de los ajustes
  const radios = { plaza: ['90', '60', '45', 'linea'], tolerancia: ['1', '2', '3'], cochePreset: ['pequeno', 'mediano', 'grande'] };
  for (const name in radios) for (const v of radios[name]) { const e = nuevoEl('input', 'radio_' + name + '_' + v); e.name = name; e.value = v; env.els[e.id] = e; }
  env.el = id => env.els[id];
  env.radio = (name, v) => { for (const e of Object.values(env.els)) if (e.name === name) e.checked = e.value === v; };

  global.window = {
    addEventListener(t, f) { (env.oyentes[t] = env.oyentes[t] || []).push(f); },
    isSecureContext: true,
    get speechSynthesis() { return global.speechSynthesis; },
    AudioContext: function () {
      this.state = 'running'; this.currentTime = env.now / 1000; this.destination = {};
      this.createOscillator = () => { const o = { frequency: {}, connect(g) { return g; }, start() { env.log.push([env.now, 'tono', Math.round(o.frequency.value)]); }, stop() {} }; return o; };
      this.createGain = () => ({ gain: { setValueAtTime() {}, linearRampToValueAtTime() {} }, connect(d) { return d; } });
      this.resume = () => {};
    },
  };
  global.document = {
    getElementById: id => env.els[id] || null,
    addEventListener(t, f) { (env.oyentesDoc[t] = env.oyentesDoc[t] || []).push(f); },
    createElementNS: (ns, tag) => nuevoEl(tag), createElement: tag => nuevoEl(tag),
    querySelector: () => null, visibilityState: 'visible', body: { style: {} },
    head: { appendChild() {} },
  };
  global.getComputedStyle = () => ({ fontFamily: 'x' });
  Object.defineProperty(global, 'navigator', { value: { userAgent: 'node', platform: 'x', maxTouchPoints: 0, vibrate() { env.log.push([env.now, 'vibra', 1]); } }, configurable: true, writable: true });
  global.localStorage = { getItem: () => JSON.stringify(ajustesGuardados || {}), setItem(k, v) { env.guardado = JSON.parse(v); } };
  global.speechSynthesis = { cancel() {}, speak(u) { env.log.push([env.now, 'voz', u.text]); } };
  global.SpeechSynthesisUtterance = function (t) { this.text = t; };
  global.location = { protocol: 'https:' };
  global.performance = { now: () => env.now };
  global.requestAnimationFrame = f => { env.rafs.push(f); return env.rafs.length; };
  global.cancelAnimationFrame = () => {};
  global.setTimeout = (f, ms) => { env.timers.push({ t: env.now + (ms || 0), f }); return env.timers.length; };
  global.DeviceMotionEvent = undefined; global.DeviceOrientationEvent = undefined;

  new Function(js)();

  // Reloj virtual: avanza en pasos de 16 ms (un frame), disparando temporizadores y sensores.
  env.sensor = null;   // función(t) => { alfa, beta, gamma, acc:[x,y,z], aig:[x,y,z] } o null
  env.avanzar = async (ms) => {
    const fin = env.now + ms;
    while (env.now < fin) {
      await Promise.resolve(); await Promise.resolve(); await Promise.resolve();
      env.now += 16;
      // temporizadores vencidos
      const listos = env.timers.filter(x => x.t <= env.now); env.timers = env.timers.filter(x => x.t > env.now);
      for (const x of listos) x.f();
      // sensores
      if (env.sensor) {
        const s = env.sensor(env.now / 1000);
        if (s) {
          for (const f of env.oyentes.deviceorientation || []) f({ alpha: s.alfa, beta: s.beta, gamma: s.gamma, timeStamp: env.now });
          for (const f of env.oyentes.devicemotion || []) f({ rotationRate: env.sinGiro ? null : { alpha: 0, beta: 0, gamma: 0 }, accelerationIncludingGravity: { x: s.aig[0], y: s.aig[1], z: s.aig[2] }, acceleration: s.acc ? { x: s.acc[0], y: s.acc[1], z: s.acc[2] } : null, timeStamp: env.now });
        }
      }
      // frame
      const fr = env.rafs.splice(0); for (const f of fr) f(env.now);
    }
  };
  env.textos = id => env.log.filter(l => l[1] === id).map(l => l[2]);
  env.voces = () => env.log.filter(l => l[1] === 'voz').map(l => l[2]);
  env.ultimo = id => { const t = env.textos(id); return t[t.length - 1]; };
  await env.avanzar(16);
  return env;
}

/* Sensor simulado: móvil de pie (beta 90) en un coche que gira "grados(t)" a la izquierda (+) */
function sensorCoche(grados, opciones = {}) {
  const ios = !!opciones.ios;
  return t => {
    const yaw = grados(t);                               // giro a la izquierda en grados
    const alfa = ((yaw % 360) + 360) % 360;              // alfa crece antihorario
    const beta = opciones.beta == null ? 90 : opciones.beta(t);
    // Gravedad en ejes del móvil: de pie, la gravedad va por -y => aIG = +g en y (espec.); iOS al revés
    const r = beta * Math.PI / 180;
    const aigSpec = [0, 9.81 * Math.sin(r), 9.81 * Math.cos(r)];
    const acc = opciones.acc ? opciones.acc(t) : [0, 0, 0];   // aceleración lineal en ejes del móvil (espec.)
    const s = ios ? -1 : 1;
    return { alfa, beta, gamma: 0, aig: [(aigSpec[0] + acc[0]) * s, (aigSpec[1] + acc[1]) * s, (aigSpec[2] + acc[2]) * s], acc: [acc[0] * s, acc[1] * s, acc[2] * s] };
  };
}

/* ───────── 1. Estático ───────── */
console.log('\n1. Comprobaciones estáticas');
prueba('JS válido', async () => { new Function(js); });
prueba('ids del HTML únicos', async () => {
  const ids = html.match(/ id="([^"]+)"/g).map(s => s.slice(5, -1));
  const dup = ids.filter((x, i) => ids.indexOf(x) !== i); igual(dup.length, 0, 'duplicados ' + dup.join(','));
});
prueba('todos los $(id) del JS existen en el HTML', async () => {
  const usados = [...js.matchAll(/\$\('([\w-]+)'\)/g)].map(m => m[1]);
  const ids = new Set(html.match(/ id="([^"]+)"/g).map(s => s.slice(5, -1)));
  const faltan = [...new Set(usados)].filter(u => !ids.has(u)); igual(faltan.length, 0, 'faltan ' + faltan.join(','));
});
prueba('sin recursos externos (funciona sin cobertura)', async () => {
  const ext = (html.match(/https?:\/\/[^"' )]+/g) || []).filter(u => !u.includes('w3.org'));
  igual(ext.length, 0, ext.join(','));
});
prueba('service worker: archivos precacheados existen', async () => {
  const sw = fs.readFileSync(RUTA + 'sw.js', 'utf8');
  const lista = [...sw.matchAll(/'\.\/([^']+)'/g)].map(m => m[1]).filter(p => p !== '');
  for (const p of lista) cierto(fs.existsSync(RUTA + p), 'falta ' + p);
});
prueba('manifest válido y coherente', async () => {
  const m = JSON.parse(fs.readFileSync(RUTA + 'manifest.webmanifest', 'utf8'));
  cierto(m.display === 'standalone'); cierto(m.icons.length === 2); for (const i of m.icons) cierto(fs.existsSync(RUTA + i.src), i.src);
  cierto(html.includes('theme-color" content="' + m.theme_color + '"'), 'theme-color distinto');
});
prueba('modelo de detección completo', async () => {
  const m = JSON.parse(fs.readFileSync(RUTA + 'modelo/model.json', 'utf8'));
  let esperado = 0; for (const w of m.weightsManifest) for (const t of w.weights) esperado += t.shape.reduce((a, b) => a * b, 1) * (t.quantization ? ({ uint8: 1, uint16: 2 })[t.quantization.dtype] : 4);
  let real = 0; for (const p of m.weightsManifest.flatMap(w => w.paths)) real += fs.statSync(RUTA + 'modelo/' + p).size;
  igual(real, esperado);
});
prueba('versión coherente en cabecera y ajustes', async () => {
  const v = html.match(/id="version">v(\d+)</)[1]; cierto(html.includes('Escuadra versión ' + v + '.'), 'versión distinta en Ajustes');
});
prueba('404.html redirige a la app', async () => { cierto(fs.readFileSync(RUTA + '404.html', 'utf8').includes('url=/escuadra/')); });

/* ───────── 2. Orientación y sensores ───────── */
console.log('\n2. Sensores simulados (móvil de pie en el soporte)');
prueba('un solo toque: enciende sensores y toma la referencia; giro de 90° a la derecha → Recto', async () => {
  const e = await crearEntorno({ voz: true });
  e.sensor = sensorCoche(t => t < 4 ? 0 : -Math.min(90, (t - 4) * 20));   // quieto 4 s, luego gira a la derecha a 20°/s
  e.el('principal').click(); await e.avanzar(4000);
  cierto(e.voces().includes('Vale, gira'), 'no tomó la referencia sola: ' + e.voces().join('|'));
  await e.avanzar(6000);
  cierto(e.voces().includes('Endereza'), 'sin aviso de endereza');
  cierto(e.voces().includes('Recto'), 'sin Recto');
  cierto(e.textos('cifra').includes('Recto'));
  cierto(e.textos('frase').some(t => t.includes('Recto en la plaza') || t.includes('torcido')));
});
prueba('mismo giro en iPhone (aceleración con signo contrario): Recto igual', async () => {
  const e = await crearEntorno({});
  e.sensor = sensorCoche(t => t < 4 ? 0 : -Math.min(90, (t - 4) * 20), { ios: true });
  e.el('principal').click(); await e.avanzar(10000);
  cierto(e.textos('cifra').includes('Recto'));
});
prueba('giro a la izquierda: lado detectado y Recto; "Girado" dice izquierda', async () => {
  const e = await crearEntorno({});
  e.sensor = sensorCoche(t => t < 4 ? 0 : Math.min(90, (t - 4) * 20));
  e.el('principal').click(); await e.avanzar(10000);
  cierto(e.textos('cifra').includes('Recto'));
  cierto(e.el('girado').textContent.includes('izquierda'), e.el('girado').textContent);
});
prueba('inclinar el móvil (beta 90→60→120) NO cuenta como giro', async () => {
  const e = await crearEntorno({});
  e.sensor = sensorCoche(() => 0, { beta: t => t < 4 ? 90 : 90 + 30 * Math.sin((t - 4) * 2) });
  e.el('principal').click(); await e.avanzar(9000);
  const g = parseFloat(e.el('girado').textContent); cierto(g <= 1, 'girado ' + e.el('girado').textContent);
  cierto(!e.textos('cifra').includes('Recto'));
});
prueba('inclinar el móvil dispara el aviso de "se ha movido del soporte"', async () => {
  const e = await crearEntorno({});
  e.sensor = sensorCoche(() => 0, { beta: t => t < 4 ? 90 : 60 });
  e.el('principal').click(); await e.avanzar(8000);
  cierto(e.textos('guia').some(t => t.startsWith('Parece que el móvil')), e.textos('guia').join('|'));
});
prueba('"Estoy recto" con el coche moviéndose: lo rechaza y pide parar', async () => {
  const e = await crearEntorno({});
  e.sensor = sensorCoche(t => t * 15);   // girando desde el principio
  e.el('principal').click(); await e.avanzar(5000);
  cierto(e.textos('guia').some(t => t.startsWith('Te estabas moviendo')), e.textos('guia').join('|'));
});
prueba('giro que cruza los 360° de la brújula (referencia en 350°) se sigue sin saltos', async () => {
  const e = await crearEntorno({});
  e.sensor = sensorCoche(t => t < 4 ? 350 : 350 + Math.min(90, (t - 4) * 20));
  e.el('principal').click(); await e.avanzar(10000);
  cierto(e.textos('cifra').includes('Recto'));
  const cifras = e.textos('cifra').filter(c => /^\d+°$/.test(c)).map(parseFloat);
  for (let i = 1; i < cifras.length; i++) cierto(Math.abs(cifras[i] - cifras[i - 1]) < 8, 'salto ' + cifras[i - 1] + '→' + cifras[i]);
});
prueba('se pasa 6° y vuelve: "Te has pasado" y luego "Recto"', async () => {
  const e = await crearEntorno({ voz: true });
  e.sensor = sensorCoche(t => t < 4 ? 0 : t < 9 ? -Math.min(96, (t - 4) * 20) : -Math.max(90, 96 - (t - 9) * 4));
  e.el('principal').click(); await e.avanzar(13000);
  const v = e.voces(); cierto(v.includes('Te has pasado'), v.join('|')); cierto(v.lastIndexOf('Recto') > v.indexOf('Te has pasado'));
});
prueba('sentido: arrancar hacia delante → "adelante"; hacia atrás → "marcha atrás" (Android e iOS)', async () => {
  for (const ios of [false, true]) for (const signo of [1, -1]) {
    const e = await crearEntorno({});
    // de pie: adelante = -z del móvil. Aceleración de 0,8 m/s² durante 1,5 s a partir de t=5
    e.sensor = sensorCoche(() => 0, { ios, acc: t => t > 5 && t < 6.5 ? [0, 0, -0.8 * signo] : [0, 0, 0] });
    e.el('principal').click(); await e.avanzar(9000);
    const s = e.el('sentido').textContent;
    igual(s.startsWith(signo > 0 ? 'adelante' : 'marcha atrás'), true, `ios=${ios} signo=${signo} → "${s}"`);
  }
});
prueba('sentido en curva: girando a la izquierda con aceleración hacia la izquierda → adelante', async () => {
  const e = await crearEntorno({});
  // izquierda del coche (de pie) = -x del móvil; centrípeta 0,4 m/s² mientras gira
  e.sensor = sensorCoche(t => t < 4 ? 0 : Math.min(60, (t - 4) * 15), { acc: t => t > 4 && t < 8 ? [-0.4, 0, 0] : [0, 0, 0] });
  e.el('principal').click(); await e.avanzar(9000);
  cierto(e.el('sentido').textContent.startsWith('adelante'), e.el('sentido').textContent);
});
prueba('sentido en curva: girando a la izquierda con aceleración hacia la derecha → marcha atrás', async () => {
  const e = await crearEntorno({});
  e.sensor = sensorCoche(t => t < 4 ? 0 : Math.min(60, (t - 4) * 15), { acc: t => t > 4 && t < 8 ? [0.4, 0, 0] : [0, 0, 0] });
  e.el('principal').click(); await e.avanzar(9000);
  cierto(e.el('sentido').textContent.startsWith('marcha atrás'), e.el('sentido').textContent);
});
prueba('sin sensores: pasa a "Probar con simulación" con mensaje claro', async () => {
  const e = await crearEntorno({});
  e.el('principal').click(); await e.avanzar(2000);
  igual(e.el('principal').textContent, 'Probar con simulación');
  cierto(e.textos('guia').some(t => t.includes('No llegan datos')));
});

/* ───────── 3. Modos en simulación (deslizador) ───────── */
console.log('\n3. Modos en simulación');
async function maniobraSim(ajustes, perfil, ms) {
  const e = await crearEntorno(Object.assign({ sim: true, voz: true }, ajustes));
  e.el('principal').click(); await e.avanzar(100);
  const t0 = e.now;
  const paso = () => { const t = e.now - t0; let i = perfil.findIndex(p => p[0] > t); if (i < 1) i = perfil.length - 1; const [ta, va] = perfil[i - 1], [tb, vb] = perfil[i]; e.el('simGiro').value = String(va + (vb - va) * Math.min(1, (t - ta) / (tb - ta))); };
  for (let k = 0; k < ms / 16; k++) { paso(); await e.avanzar(16); }
  return e;
}
for (const obj of [90, 60, 45]) for (const signo of [-1, 1]) prueba(`batería/espiga ${obj}° girando a la ${signo < 0 ? 'derecha' : 'izquierda'}: endereza y recto`, async () => {
  const e = await maniobraSim({ objetivo: obj }, [[0, 0], [1000, 0], [5000, signo * obj * 0.95], [6000, signo * obj]], 9000);
  const v = e.voces(); cierto(v.includes('Endereza'), v.join('|')); cierto(v.includes('Recto'));
});
prueba('batería marcha atrás (ajuste): mismo aviso, plaza dibujada detrás', async () => {
  const e = await maniobraSim({ objetivo: 90, atras: true }, [[0, 0], [1000, 0], [5000, 90]], 8000);
  cierto(e.voces().includes('Recto'));
});
for (const signo of [1, -1]) prueba(`en línea, hueco a la ${signo > 0 ? 'derecha' : 'izquierda'}: 45°, otro lado, contragiro, recto`, async () => {
  const e = await maniobraSim({ linea: true }, [[0, 0], [1000, 0], [4000, signo * 45], [4600, signo * 48], [5500, signo * 48], [8500, signo * 2], [9000, -signo * 2], [9800, 0]].map(p => p), 12000);
  const v = e.voces();
  cierto(v.includes('Volante al otro lado'), v.join('|'));
  cierto(e.textos('guia').some(t => t.startsWith('Volante al otro lado y sigue')), 'no entró en la etapa 2');
  cierto(v.lastIndexOf('Recto') > v.indexOf('Volante al otro lado'));
});
prueba('salir de la plaza: mismos avisos y frase "Paralelo al pasillo"', async () => {
  const e = await maniobraSim({ objetivo: 90, salir: true }, [[0, 0], [1000, 0], [5000, 90]], 8000);
  cierto(e.voces().includes('Recto')); cierto(e.textos('frase').includes('Paralelo al pasillo'), e.textos('frase').join('|'));
  cierto(e.textos('guia').some(t => t.startsWith('Sal despacio')));
});
prueba('tolerancia ±1 exige más que ±3', async () => {
  const e1 = await maniobraSim({ tolerancia: 1 }, [[0, 0], [1000, 0], [5000, -88], [9000, -88]], 9000);
  const e3 = await maniobraSim({ tolerancia: 3 }, [[0, 0], [1000, 0], [5000, -88], [9000, -88]], 9000);
  cierto(!e1.textos('cifra').includes('Recto'), '±1 dio Recto a 88°'); cierto(e3.textos('cifra').includes('Recto'), '±3 no dio Recto a 88°');
});
prueba('invertir sentido de giro no afecta a la simulación (solo a sensores)', async () => {
  const e = await maniobraSim({ invertir: true }, [[0, 0], [1000, 0], [5000, -90]], 8000);
  cierto(e.voces().includes('Recto'));
});
prueba('sin voz: no habla; sin pitidos: no suena', async () => {
  const e = await maniobraSim({ voz: false, sonido: false }, [[0, 0], [1000, 0], [5000, -90]], 8000);
  igual(e.voces().length, 0); igual(e.log.filter(l => l[1] === 'tono').length, 0);
});
prueba('cantar los grados: dice "Faltan 30"', async () => {
  const e = await maniobraSim({ cantar: true }, [[0, 0], [1000, 0], [8000, -90]], 10000);
  cierto(e.voces().some(v => v.startsWith('Faltan')), e.voces().join('|'));
});
prueba('aprendizaje: pasarse 4° adelanta el aviso 2°; olvidar lo deja a 0', async () => {
  const e = await maniobraSim({ aprender: true }, [[0, 0], [1000, 0], [5000, -85], [5700, -94], [6500, -94], [7500, -90], [15000, -90]], 15000);
  cerca(e.guardado.aprendido, 2, 0.6, 'aprendido');
  e.el('olvidar').click(); igual(e.guardado.aprendido, 0);
});
prueba('demo "Ver maniobra de ejemplo" llega a Recto en todos los modos', async () => {
  for (const aj of [{ objetivo: 90 }, { objetivo: 60 }, { objetivo: 90, atras: true }, { linea: true }, { objetivo: 90, salir: true }]) {
    const e = await crearEntorno(Object.assign({ sim: true, voz: true }, aj));
    e.el('principal').click(); await e.avanzar(100); e.el('simDemo').click(); await e.avanzar(13000);
    cierto(e.voces().includes('Recto'), JSON.stringify(aj) + ' → ' + e.voces().join('|'));
  }
});

/* ───────── 4. Ajustes ───────── */
console.log('\n4. Ajustes');
prueba('guardar y cargar: tipo de plaza, tolerancia, tamaño, interruptores', async () => {
  const e = await crearEntorno({});
  e.el('abrirAjustes').click();
  e.radio('plaza', 'linea'); e.radio('tolerancia', '3'); e.radio('cochePreset', 'grande');
  e.el('optVoz').checked = false; e.el('optAtras').checked = true; e.el('optCantar').checked = true;
  e.el('ajustes').close(); await e.avanzar(50);
  const g = e.guardado; igual(g.linea, true); igual(g.tolerancia, 3); igual(g.tamano, 'grande'); igual(g.coche.largo, 4.8); igual(g.voz, false); igual(g.atras, true); igual(g.cantar, true);
  // Cargar de nuevo con lo guardado
  const e2 = await crearEntorno(g); e2.el('abrirAjustes').click();
  cierto(e2.el('radio_plaza_linea').checked); cierto(e2.el('radio_cochePreset_grande').checked); igual(e2.el('optAtras').checked, true);
});
prueba('ajustes guardados de una versión antigua (sin campos nuevos) no rompen', async () => {
  const e = await crearEntorno({ objetivo: 60, sonido: true });
  e.el('principal').click(); await e.avanzar(500); cierto(true);
});
prueba('selector Entrar/Salir cambia y se guarda; en línea se oculta', async () => {
  const e = await crearEntorno({});
  e.el('chipSalir').click(); await e.avanzar(50); igual(e.guardado.salir, true); igual(e.el('chipSalir').attrs['aria-pressed'], 'true');
  e.el('chipEntrar').click(); await e.avanzar(50); igual(e.guardado.salir, false);
  const e2 = await crearEntorno({ linea: true }); await e2.avanzar(50); igual(e2.el('app').attrs['data-linea'], '1');
});
prueba('cambiar de plaza en plena maniobra reinicia a "lista"', async () => {
  const e = await maniobraSim({ objetivo: 90 }, [[0, 0], [1000, 0], [3000, -40]], 3000);
  e.el('abrirAjustes').click(); e.radio('plaza', 'linea'); e.el('ajustes').close(); await e.avanzar(50);
  igual(e.el('principal').textContent, 'Estoy recto'); cierto(e.textos('frase').slice(-1)[0].startsWith('Pulsa el botón'));
});

/* ───────── 5. Geometría ───────── */
console.log('\n5. Geometría del dibujo');
const geoSrc = html.slice(html.indexOf('  const U = 50;'), html.indexOf('  // Parte fija: carril'));
function geo(cfg) {
  const st = {}; const porDefecto = { coche: cfg.coche };
  const saliendo = () => cfg.salir && !cfg.linea;
  const entraAtras = () => cfg.linea ? true : cfg.atras;
  return new Function('cfg', 'st', 'porDefecto', 'entraAtras', 'saliendo', geoSrc + '; return { geometria, postura, dimCoche };')(cfg, st, porDefecto, entraAtras, saliendo);
}
const TAM = { pequeno: { largo: 3.0, ancho: 1.66, giro: 8.0 }, mediano: { largo: 4.2, ancho: 1.8, giro: 10.8 }, grande: { largo: 4.8, ancho: 1.9, giro: 11.8 } };
const rot = (v, a) => { const c = Math.cos(a * Math.PI / 180), s = Math.sin(a * Math.PI / 180); return [v[0] * c - v[1] * s, v[0] * s + v[1] * c]; };
prueba('sin choques con los vecinos en 18 combinaciones (3 tamaños × 6 maniobras)', async () => {
  const dentro = (p, cx, cy, hw, hh, ang) => { const r = -ang * Math.PI / 180, dx = p[0] - cx, dy = p[1] - cy; const x = dx * Math.cos(r) - dy * Math.sin(r), y = dx * Math.sin(r) + dy * Math.cos(r); return Math.abs(x) < hw && Math.abs(y) < hh; };
  let total = 0;
  for (const coche of Object.values(TAM)) for (const modo of ['f90', 'a90', 'f60', 'f45', 'a60', 'linea']) {
    const cfg = { coche, linea: modo === 'linea', atras: modo[0] === 'a', objetivo: +(modo.match(/\d+/) || [90])[0] };
    const m = geo(cfg), D = m.dimCoche(), g = m.geometria();
    const vecinos = cfg.linea ? [[-g.sep, 0, 46, 104, -90], [g.sep, 0, 46, 104, -90]]
      : [-240, -120, 120, 240].map(x => { const hb = cfg.atras ? 90 - cfg.objetivo : cfg.objetivo - 90; const c = rot([x, 0], hb); return [c[0], c[1], 46, 104, hb]; });
    for (let i = 0; i <= 200; i++) {
      let avance, etapa = 1, entrada = 0;
      if (cfg.linea) { const t = i / 2; if (t <= 35) avance = t / 35 * 45; else if (t <= 50) { avance = 45; entrada = (t - 35) / 15; } else if (t <= 88) { etapa = 2; avance = 45 * (1 - (t - 50) / 38); } else { etapa = 2; avance = 0; entrada = (t - 88) / 12; } }
      else { avance = Math.min(i, 180) / 180 * cfg.objetivo; entrada = i > 180 ? (i - 180) / 20 : 0; }
      const q = m.postura(g, avance, etapa, entrada), at = rot([0, 1], q.h), c = [q.p[0] - D.EJE * at[0], q.p[1] - D.EJE * at[1]];
      for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { const v = rot([a * D.ANCHO / 2, b * D.LARGO / 2], q.h); const p = [c[0] + v[0], c[1] + v[1]]; for (const vec of vecinos) if (dentro(p, ...vec)) total++; }
    }
  }
  igual(total, 0, 'choques');
});
prueba('la trayectoria es continua (sin saltos) en todas las etapas', async () => {
  for (const coche of Object.values(TAM)) for (const modo of ['f90', 'a90', 'f45', 'linea']) {
    const cfg = { coche, linea: modo === 'linea', atras: modo[0] === 'a', objetivo: +(modo.match(/\d+/) || [90])[0] };
    const m = geo(cfg), g = m.geometria(); let prev = null;
    for (let i = 0; i <= 400; i++) {
      let avance, etapa = 1, entrada = 0;
      if (cfg.linea) { const t = i / 4; if (t <= 35) avance = t / 35 * 45; else if (t <= 50) { avance = 45; entrada = (t - 35) / 15; } else if (t <= 88) { etapa = 2; avance = 45 * (1 - (t - 50) / 38); } else { etapa = 2; avance = 0; entrada = (t - 88) / 12; } }
      else { avance = Math.min(i, 360) / 360 * cfg.objetivo; entrada = i > 360 ? (i - 360) / 40 : 0; }
      const q = m.postura(g, avance, etapa, entrada);
      if (prev) cierto(Math.hypot(q.p[0] - prev[0], q.p[1] - prev[1]) < 12, `${modo} salto en i=${i}`);
      prev = q.p;
    }
  }
});
prueba('el sitio final está centrado en la plaza y el rumbo es el de la plaza', async () => {
  for (const modo of ['f90', 'a90', 'f60']) {
    const cfg = { coche: TAM.mediano, linea: false, atras: modo[0] === 'a', objetivo: +modo.slice(1) };
    const m = geo(cfg), g = m.geometria(), D = m.dimCoche();
    const q = m.postura(g, cfg.objetivo, 1, 1), at = rot([0, 1], q.h), c = [q.p[0] - D.EJE * at[0], q.p[1] - D.EJE * at[1]];
    cerca(c[0], 0, 0.5, modo + ' x'); cerca(c[1], 0, 0.5, modo + ' y');
  }
});
prueba('el punto de partida está en el pasillo, sin pisar las plazas', async () => {
  for (const coche of Object.values(TAM)) for (const modo of ['f90', 'a90', 'f60', 'f45']) {
    const cfg = { coche, linea: false, atras: modo[0] === 'a', objetivo: +modo.slice(1) };
    const m = geo(cfg), g = m.geometria(), D = m.dimCoche();
    const q = m.postura(g, 0, 1, 0), at = rot([0, 1], q.h), c = [q.p[0] - D.EJE * at[0], q.p[1] - D.EJE * at[1]];
    cierto(c[1] - D.ANCHO / 2 > 130, `${modo} ${JSON.stringify(coche)}: y=${c[1].toFixed(0)}`);
    cerca(((q.h % 360) + 360) % 360, 270, 0.01, 'rumbo de partida');
  }
});
prueba('radio de giro: pequeño < mediano < grande y valores razonables', async () => {
  const r = Object.values(TAM).map(coche => geo({ coche, objetivo: 90 }).dimCoche().R / 50);
  cierto(r[0] < r[1] && r[1] < r[2], r.join(',')); cierto(r[0] > 2 && r[2] < 5, r.join(','));
});

/* ───────── 6. Tutorial ───────── */
console.log('\n6. Tutorial animado');
prueba('el tutorial recorre todos los pasos y termina solo, en cada modo', async () => {
  for (const aj of [{ objetivo: 90 }, { objetivo: 90, atras: true }, { objetivo: 60 }, { linea: true }, { objetivo: 90, salir: true }]) {
    const e = await crearEntorno(Object.assign({ sim: true }, aj));
    e.el('abrirComo').click(); await e.avanzar(100);
    igual(e.el('app').attrs['data-tuto'], '1', 'no arrancó ' + JSON.stringify(aj));
    const textos = new Set();
    for (let k = 0; k < 24; k++) { await e.avanzar(1000); if (e.el('tutoTexto').textContent) textos.add(e.el('tutoTexto').textContent); }
    cierto(textos.size >= 5, JSON.stringify(aj) + ' pasos vistos: ' + textos.size);
    cierto([...textos].some(t => t.includes('Para aquí')), 'sin paso de referencia');
    igual(e.el('app').attrs['data-tuto'], '0', 'no terminó');
  }
});
prueba('tocar el dibujo cierra el tutorial', async () => {
  const e = await crearEntorno({ sim: true }); e.el('abrirComo').click(); await e.avanzar(500);
  e.el('escenaSvg').click(); await e.avanzar(50); igual(e.el('app').attrs['data-tuto'], '0');
});

/* ───────── 7. Cámara (lógica de avisos con detecciones simuladas) ───────── */
console.log('\n7. Cámara: clasificación de detecciones');
prueba('un coche grande a la derecha → "Coche muy cerca a la derecha"; pequeño delante → sin aviso', async () => {
  const e = await crearEntorno({ voz: true });
  const src = js.slice(js.indexOf('  function pintarCajas(cajas) {'), js.indexOf('  /* ───────────── Eventos')) ;
  // Se ejecuta pintarCajas con el contexto mínimo que necesita
  const ctx = { VEHICULOS: new Set(['car', 'truck', 'bus', 'motorcycle']), cam: { clave: '', ultimoAviso: -1e9, ultimoZumbido: -1e9 }, elVideo: { videoWidth: 640, videoHeight: 480 }, elLienzo: e.el('lienzo'), camaraEstado: e.el('camaraEstado'), poner: (el, prop, v) => { if (prop === 'text') el.textContent = v; else el.setAttribute(prop, v); }, decir: t => e.log.push([e.now, 'voz', t]), vibrar: () => {}, tono: () => {}, performance: global.performance, document: global.document, getComputedStyle: global.getComputedStyle };
  const f = new Function(...Object.keys(ctx), src + '; return pintarCajas;')(...Object.values(ctx));
  f([{ class: 'car', bbox: [450, 100, 180, 300] }]);
  igual(e.el('camaraEstado').textContent, 'Coche muy cerca a la derecha'); cierto(e.voces().includes('Coche muy cerca a la derecha'));
  f([{ class: 'car', bbox: [300, 200, 60, 40] }, { class: 'person', bbox: [0, 0, 640, 480] }]);
  igual(e.el('camaraEstado').textContent, '');
  f([{ class: 'truck', bbox: [40, 100, 250, 200] }]);
  igual(e.el('camaraEstado').textContent, 'Coche cerca a la izquierda');
});


/* ───────── 8. Casos de la vida real (sensores simulados) ───────── */
seccion('\n8. Casos de la vida real');
// Ayuda: rampa suave de giro con velocidad w (°/s) a partir de t0, hasta el ángulo objetivo
const rampa = (t0, w, fin, signo = -1) => t => t < t0 ? 0 : signo * Math.min(fin, (t - t0) * w);
const ruido = (amp) => () => (Math.random() * 2 - 1) * amp;

async function caso(ajustes, sensor, ms, opciones = {}) {
  const e = await crearEntorno(Object.assign({ voz: true }, ajustes));
  e.sensor = sensor;
  e.el('principal').click();
  await e.avanzar(ms);
  return e;
}

prueba('Supermercado, batería a la derecha de frente, despacio (12°/s), parando 3 s a mitad para mirar', async () => {
  const e = await caso({}, sensorCoche(t => t < 4 ? 0 : t < 8 ? -Math.min(48, (t - 4) * 12) : t < 11 ? -48 : -Math.min(90, 48 + (t - 11) * 12)), 17000);
  cierto(e.voces().includes('Endereza')); cierto(e.voces().includes('Recto'));
  cierto(!e.voces().includes('Te has pasado'));
});
prueba('Batería a la izquierda marcha atrás (ajuste): el morro gira a la derecha y llega a Recto', async () => {
  const e = await caso({ atras: true }, sensorCoche(rampa(4, 15, 90, -1)), 13000);
  cierto(e.voces().includes('Recto'));
  cierto(e.el('girado').textContent.includes('derecha'));
});
prueba('Garaje en rampa: móvil inclinado 20° en el soporte (beta 70) → igual de exacto', async () => {
  const e = await caso({}, sensorCoche(rampa(4, 20, 90), { beta: () => 70 }), 12000);
  cierto(e.voces().includes('Recto'));
  const g = e.textos('cifra').filter(c => /^\d+°$/.test(c)).map(parseFloat); cierto(g.includes(45) || g.includes(44) || g.includes(46), 'cifras raras: ' + g.slice(0, 10));
});
prueba('Soporte tumbado (móvil horizontal, beta 0) → funciona igual', async () => {
  const e = await caso({}, sensorCoche(rampa(4, 20, 90), { beta: () => 0 }), 12000);
  cierto(e.voces().includes('Recto'));
});
prueba('Móvil no alineado con el coche (15° torcido en el soporte): da igual, se miden cambios', async () => {
  const e = await caso({}, sensorCoche(t => 15 + rampa(4, 20, 90)(t)), 12000);
  cierto(e.voces().includes('Recto'));
});
prueba('Mirando al norte, al este o al sur al empezar: mismo resultado', async () => {
  for (const rumbo of [0, 90, 180, 265]) {
    const e = await caso({}, sensorCoche(t => rumbo + rampa(4, 20, 90)(t)), 12000);
    cierto(e.voces().includes('Recto'), 'rumbo ' + rumbo);
  }
});
prueba('Bache a mitad de maniobra (sacudida de 4 m/s² durante 0,1 s): no se pierde el giro', async () => {
  const e = await caso({}, sensorCoche(rampa(4, 20, 90), { acc: t => t > 6 && t < 6.1 ? [0, 4, 0] : [0, 0, 0] }), 12000);
  cierto(e.voces().includes('Recto'));
});
prueba('Motor vibrando al pulsar "Estoy recto" (0,15 m/s² de ruido): la referencia se acepta', async () => {
  const e = await caso({}, sensorCoche(rampa(4, 20, 90), { acc: () => [ruido(0.15)(), ruido(0.15)(), ruido(0.15)()] }), 12000);
  cierto(e.voces().includes('Vale, gira'), e.textos('guia').join('|'));
  cierto(e.voces().includes('Recto'));
});
prueba('Giroscopio con ruido de ±0,3°: sin parpadeo entre "Recto" y "Te has pasado"', async () => {
  const e = await caso({}, sensorCoche(t => rampa(4, 20, 90)(t) + ruido(0.3)()), 14000);
  cierto(e.voces().includes('Recto'));
  igual(e.voces().filter(v => v === 'Te has pasado').length, 0, 'parpadeos');
});
prueba('Sin giroscopio (solo brújula, ±1,5° de ruido, margen ±3): llega a Recto', async () => {
  const e = await crearEntorno({ voz: true, tolerancia: 3 });
  const s = sensorCoche(t => rampa(4, 20, 90)(t) + ruido(1.5)());
  e.sensor = s; e.sinGiro = true;   // sin rotationRate: aparato sin giroscopio
  e.el('principal').click(); await e.avanzar(13100);
  igual(e.el('sensor').textContent, 'brújula');
  cierto(e.voces().includes('Recto'), e.voces().join('|'));
});
prueba('Conductor que se pasa 10° y corrige', async () => {
  const e = await caso({}, sensorCoche(t => t < 4 ? 0 : t < 9 ? -Math.min(100, (t - 4) * 20) : -Math.max(90, 100 - (t - 9) * 5)), 14000);
  const v = e.voces(); cierto(v.includes('Te has pasado')); cierto(v.lastIndexOf('Recto') > v.lastIndexOf('Te has pasado'));
});
prueba('Conductor que se arrepiente: gira 25° y vuelve a 0 → no dice Recto; puede volver a marcar', async () => {
  const e = await caso({}, sensorCoche(t => t < 4 ? 0 : t < 6 ? -(t - 4) * 12.5 : t < 8 ? -25 + (t - 6) * 12.5 : 0), 10000);
  cierto(!e.voces().includes('Recto'));
  e.el('principal').click(); await e.avanzar(3000);
  igual(e.voces().filter(v => v === 'Vale, gira').length, 2);
});
prueba('Dos maniobras seguidas: tras Recto, nueva referencia y otra maniobra', async () => {
  const e = await caso({}, sensorCoche(rampa(4, 20, 90)), 10000);
  cierto(e.voces().includes('Recto'));
  e.sensor = sensorCoche(t => -90 + (t < 12 ? 0 : Math.min(90, (t - 12) * 20)));   // ahora gira a la izquierda desde -90
  e.el('principal').click(); await e.avanzar(10000);
  igual(e.voces().filter(v => v === 'Recto').length >= 2, true, e.voces().join('|'));
});
prueba('Espiga 45° girando rápido (30°/s): el aviso de endereza llega con más margen que despacio (8°/s)', async () => {
  const faltaAviso = async (w) => {
    const e = await caso({ objetivo: 45 }, sensorCoche(rampa(4, w, 45)), 12000);
    const i = e.log.findIndex(l => l[1] === 'voz' && l[2] === 'Endereza'); cierto(i >= 0, 'sin aviso a ' + w);
    const t = e.log[i][0]; const cifra = e.log.slice(0, i).reverse().find(l => l[1] === 'cifra' && /^\d+°$/.test(l[2]));
    return parseFloat(cifra[2]);
  };
  const rapido = await faltaAviso(30), lento = await faltaAviso(8);
  cierto(rapido > lento, `rápido ${rapido}° vs lento ${lento}°`);
});
prueba('En línea real: 45° a 10°/s, recto 2 s, contragiro a 10°/s pasándose 3°, y recto', async () => {
  const e = await caso({ linea: true }, sensorCoche(t => t < 4 ? 0 : t < 8.5 ? Math.min(45, (t - 4) * 10) : t < 10.5 ? 45 : t < 15.3 ? Math.max(-3, 45 - (t - 10.5) * 10) : Math.min(0, -3 + (t - 15.3) * 3)), 19000);
  const v = e.voces();
  cierto(v.includes('Volante al otro lado'), v.join('|'));
  cierto(e.textos('guia').some(t => t.startsWith('Volante al otro lado y sigue')));
  cierto(v.slice(v.indexOf('Volante al otro lado')).includes('Recto'));
});
prueba('Salir de la plaza marcha atrás (entré de frente): referencia dentro, giro de 90° → "Paralelo al pasillo"', async () => {
  const e = await caso({ salir: true }, sensorCoche(rampa(4, 15, 90, 1)), 13000);
  cierto(e.voces().includes('Recto'));
  cierto(e.textos('frase').includes('Paralelo al pasillo'));
});
prueba('Doble toque en "Estoy recto" por nervios: no rompe y toma la referencia', async () => {
  const e = await crearEntorno({ voz: true });
  e.sensor = sensorCoche(rampa(5, 20, 90));
  e.el('principal').click(); e.el('principal').click(); await e.avanzar(200); e.el('principal').click();
  await e.avanzar(12000);
  cierto(e.voces().includes('Recto'), e.voces().join('|'));
});
prueba('El móvil se apaga y se enciende a mitad (pestaña oculta 2 s): sigue sin saltos', async () => {
  const e = await caso({}, sensorCoche(rampa(4, 20, 90)), 6000);
  global.document.visibilityState = 'hidden'; for (const f of e.oyentesDoc.visibilitychange || []) f();
  const antes = e.sensor; e.sensor = null; await e.avanzar(2000);
  global.document.visibilityState = 'visible'; for (const f of e.oyentesDoc.visibilitychange || []) f();
  e.sensor = antes; await e.avanzar(6000);
  cierto(e.voces().includes('Recto'));
});
prueba('Deriva lenta del sensor (1°/min) en una maniobra de 40 s: error por debajo de 1°', async () => {
  const e = await caso({ tolerancia: 1 }, sensorCoche(t => rampa(4, 3, 90)(t) + t / 60), 45000);
  cierto(e.voces().includes('Recto'), e.voces().join('|'));
});
prueba('Arranca marcha atrás con el motor vibrando: sentido "marcha atrás"', async () => {
  const e = await caso({}, sensorCoche(() => 0, { acc: t => [ruido(0.12)(), ruido(0.12)(), (t > 5 && t < 6.5 ? 0.9 : 0) + ruido(0.12)()] }), 9000);
  cierto(e.el('sentido').textContent.startsWith('marcha atrás'), e.el('sentido').textContent);
});
prueba('Arranca de frente en iPhone y luego gira: sentido "adelante" y Recto', async () => {
  const e = await caso({}, sensorCoche(rampa(7, 20, 90), { ios: true, acc: t => t > 5 && t < 6.5 ? [0, 0, -0.9] : [0, 0, 0] }), 14000);
  cierto(e.el('sentido').textContent.startsWith('adelante'), e.el('sentido').textContent);
  cierto(e.voces().includes('Recto'));
});
prueba('Cambiar a "Salir" en plena maniobra reinicia y no deja restos', async () => {
  const e = await caso({}, sensorCoche(rampa(4, 20, 90)), 6000);
  e.el('chipSalir').click(); await e.avanzar(100);
  igual(e.el('principal').textContent, 'Estoy recto');
  e.sensor = sensorCoche(() => -40);   // el coche se ha parado torcido; nueva referencia desde ahí
  e.el('principal').click(); await e.avanzar(3000);
  cierto(e.voces().filter(v => v === 'Vale, gira').length >= 2);
});
prueba('Tolerancia holgada (±3) con un conductor impreciso que se queda a 87°: lo da por recto', async () => {
  const e = await caso({ tolerancia: 3 }, sensorCoche(rampa(4, 20, 87)), 12000);
  cierto(e.voces().includes('Recto'));
});
prueba('Tolerancia exigente (±1) con el mismo conductor: no lo da por recto', async () => {
  const e = await caso({ tolerancia: 1 }, sensorCoche(rampa(4, 20, 87)), 12000);
  cierto(!e.voces().includes('Recto'));
});

/* ───────── Resumen ───────── */
ejecutar();
