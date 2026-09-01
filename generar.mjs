// ===========================================================================
// generar.mjs
// Genera index.html a partir de datos.json. Script autocontenido (sin
// dependencias externas, solo Node). Para agregar/editar noticias, edita
// datos.json y vuelve a correr: node generar.mjs
// ===========================================================================

import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// --- Los 7 ejes, en el orden en que se muestran ----------------------------
const EJES = [
  { id: "filantropia", titulo: "Filantropia y responsabilidad social" },
  { id: "empresas", titulo: "Empresas y lideres establecidos" },
  { id: "inversion", titulo: "Inversion entrante / expansiones" },
  { id: "gobierno", titulo: "Gobierno" },
  { id: "hacienda", titulo: "Hacienda" },
  { id: "agropecuario", titulo: "Agropecuario" },
  { id: "camaras", titulo: "Camaras empresariales" }
];

// --- Colores y etiquetas del semaforo ---------------------------------------
const SEMAFORO = {
  verde: { etiqueta: "positivo" },
  amarillo: { etiqueta: "neutral" },
  rojo: { etiqueta: "Alerta" }
};
const ORDEN_SEMAFORO = { verde: 0, amarillo: 1, rojo: 2 };

// --- Icono "NEW" (estrella roja) para noticias nuevas -----------------------
const ICONO_NUEVO_SVG = `<svg class="icono-nuevo" viewBox="-4 -4 108 108" role="img" aria-label="Noticia nueva"><title>Nueva</title>
<polygon points="103.00,50.00 101.99,52.72 99.23,55.17 95.43,57.20 91.57,58.84 88.58,60.34 87.09,62.05 87.29,64.31 88.83,67.29 90.99,70.88 92.87,74.75 93.66,78.36 92.88,81.15 90.46,82.76 86.79,83.12 82.53,82.53 78.44,81.58 75.13,81.04 72.92,81.55 71.75,83.49 71.25,86.81 70.88,90.99 70.13,95.22 68.66,98.60 66.38,100.41 63.47,100.29 60.29,98.42 57.20,95.43 54.44,92.27 52.09,89.88 50.00,89.00 47.91,89.88 45.56,92.27 42.80,95.43 39.71,98.42 36.53,100.29 33.62,100.41 31.34,98.60 29.87,95.22 29.12,90.99 28.75,86.81 28.25,83.49 27.08,81.55 24.87,81.04 21.56,81.58 17.47,82.53 13.21,83.12 9.54,82.76 7.12,81.15 6.34,78.36 7.13,74.75 9.01,70.88 11.17,67.29 12.71,64.31 12.91,62.05 11.42,60.34 8.43,58.84 4.57,57.20 0.77,55.17 -1.99,52.72 -3.00,50.00 -1.99,47.28 0.77,44.83 4.57,42.80 8.43,41.16 11.42,39.66 12.91,37.95 12.71,35.69 11.17,32.71 9.01,29.12 7.13,25.25 6.34,21.64 7.12,18.85 9.54,17.24 13.21,16.88 17.47,17.47 21.56,18.42 24.87,18.96 27.08,18.45 28.25,16.51 28.75,13.19 29.12,9.01 29.87,4.78 31.34,1.40 33.62,-0.41 36.53,-0.29 39.71,1.58 42.80,4.57 45.56,7.73 47.91,10.12 50.00,11.00 52.09,10.12 54.44,7.73 57.20,4.57 60.29,1.58 63.47,-0.29 66.38,-0.41 68.66,1.40 70.13,4.78 70.88,9.01 71.25,13.19 71.75,16.51 72.92,18.45 75.13,18.96 78.44,18.42 82.53,17.47 86.79,16.88 90.46,17.24 92.88,18.85 93.66,21.64 92.87,25.25 90.99,29.12 88.83,32.71 87.29,35.69 87.09,37.95 88.58,39.66 91.57,41.16 95.43,42.80 99.23,44.83 101.99,47.28" fill="#f4213c"/>
<text x="50" y="61" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="34" letter-spacing="-2" fill="#ffffff">NEW</text>
</svg>`;

const MESES_CORTO = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const MESES_LARGO = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
];

function escHtml(s = "") {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function fechaCorta(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d)) return "";
  return `${d.getUTCDate()} ${MESES_CORTO[d.getUTCMonth()]}`;
}

// --- CSS autocontenido -------------------------------------------------------
const ESTILOS = `
:root{
  --ink:#22303d;
  --paper:#ffffff;
  --paper-2:#eef3f8;
  --azul:#7da5cc;
  --azul-claro:#a7cfe0;
  --accent:#3a6ea5;
  --accent-2:#2c5278;
  --rule:#dfe6ee; --muted:#6b7785;
  --verde:#1f8a4c; --amarillo:#d99500; --rojo:#c0392b;
}
*{box-sizing:border-box;}
body{
  margin:0; background:var(--paper); color:var(--ink);
  font-family:Arial,Helvetica,sans-serif; line-height:1.55;
  -webkit-font-smoothing:antialiased;
}
.wrap{max-width:880px; margin:0 auto; padding:28px 20px 60px;}
a{color:var(--accent); text-decoration:none;}
a:hover{text-decoration:underline;}

.masthead{background:#3d7ab5;
  color:#fff; border-radius:14px; padding:30px 28px; margin-bottom:24px;
  box-shadow:0 8px 22px rgba(34,48,61,.14);}
.kicker{font-size:.72rem; letter-spacing:.24em; text-transform:uppercase; color:rgba(255,255,255,.88); margin:0 0 8px; font-weight:600;}
.titulo{font-family:Arial,Helvetica,sans-serif; font-weight:800; letter-spacing:.02em; font-size:clamp(2.1rem,5.5vw,3.2rem); line-height:1.02; margin:0; color:#fff; text-transform:uppercase;}
.subtitulo{color:rgba(255,255,255,.94); margin:10px 0 0; font-size:1.02rem; font-weight:500;}
.meta{display:flex; flex-wrap:wrap; gap:10px 18px; align-items:center; justify-content:space-between;
  border-top:1px solid rgba(255,255,255,.4);
  padding:12px 0 0; margin:16px 0 0; font-size:.85rem; color:rgba(255,255,255,.92);}
.meta strong{color:#fff; font-weight:700;}

.leyenda{display:flex; flex-wrap:wrap; gap:16px; margin:18px 0 8px; font-size:.82rem; color:var(--muted);}
.leyenda span{display:inline-flex; align-items:center; gap:7px;}
.punto{width:13px; height:13px; border-radius:50%; display:inline-block; flex:0 0 auto;}
.punto.verde{background:var(--verde);} .punto.amarillo{background:var(--amarillo);} .punto.rojo{background:var(--rojo);}

.eje{margin-top:34px;}
.eje h2{font-family:Arial,Helvetica,sans-serif; font-size:1.25rem; font-weight:800; letter-spacing:.04em; margin:0 0 4px;
  padding-bottom:8px; border-bottom:2px solid var(--azul); display:flex; gap:12px; align-items:baseline; color:var(--accent-2); text-transform:uppercase;}
.eje h2 .num{color:var(--accent); font-size:1rem; font-weight:700;}
.vacio{color:var(--muted); font-style:italic; padding:10px 0; font-size:.9rem;}

.nota{display:grid; grid-template-columns:auto 1fr; gap:14px; padding:16px 0; border-bottom:1px solid var(--rule);}
.col-izq{display:flex; flex-direction:column; align-items:center; gap:6px; padding-top:4px;}
.col-izq .punto{width:16px; height:16px;}
.col-izq .fecha{font-size:.72rem; color:var(--verde); font-weight:600; text-align:center; white-space:nowrap;}
.nota h3{font-family:Arial,Helvetica,sans-serif; font-weight:600; font-size:1.08rem; letter-spacing:-.01em; margin:0 0 5px; line-height:1.3;}
.nota p{margin:0 0 8px; color:#39322a;}
.fuente-linea{font-size:.8rem; color:var(--muted); display:flex; flex-wrap:wrap; gap:10px; align-items:center;}
.chip{background:var(--paper-2); border:1px solid var(--rule); border-radius:999px; padding:2px 10px; font-size:.74rem; color:var(--ink);}
.icono-nuevo{width:28px; height:28px; display:inline-block; margin-top:4px; flex:0 0 auto;}

.nuevas{margin-top:34px;}
.nuevas h2{font-family:Arial,Helvetica,sans-serif; font-size:1.3rem; font-weight:700; margin:0 0 14px;}

.por-mes{margin-top:44px; border-top:3px double var(--accent); padding-top:18px;}
.por-mes h2{font-family:Arial,Helvetica,sans-serif; font-size:1.3rem; font-weight:700; margin:0 0 14px;}
.meses-tabs{display:flex; flex-wrap:wrap; gap:8px; margin-bottom:16px;}
.mes-tab{font:inherit; cursor:pointer; background:var(--paper-2); border:1px solid var(--rule); border-radius:999px;
  padding:6px 14px; font-size:.82rem; color:var(--ink); text-transform:capitalize;}
.mes-tab.activo{background:var(--accent); border-color:var(--accent); color:#fff; font-weight:700;}
.mes-panel{display:none;}
.mes-panel.activo{display:block;}
.mes-panel .nota{grid-template-columns:auto 1fr;}
.mes-nota-eje{font-size:.72rem; font-weight:700; letter-spacing:.05em; text-transform:uppercase; color:var(--accent); margin:18px 0 -6px;}
.mes-panel .nota:first-of-type{margin-top:0;}
.mes-vacio{color:var(--muted); font-style:italic; padding:10px 0; font-size:.9rem;}

footer{margin-top:46px; border-top:3px double var(--accent); padding-top:16px; text-align:center; color:var(--muted); font-size:.82rem;}

@media (max-width:560px){
  .nota{grid-template-columns:1fr;}
  .col-izq{flex-direction:row; justify-content:flex-start;}
}
`;

function cabecera(tituloPagina) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="noindex">
<title>${escHtml(tituloPagina)}</title>
<style>${ESTILOS}</style>
</head>
<body><div class="wrap">`;
}

function leyendaSemaforo() {
  return `<div class="leyenda" aria-label="Leyenda del semaforo">
  <span><i class="punto verde"></i> Verde — ${SEMAFORO.verde.etiqueta}</span>
  <span><i class="punto amarillo"></i> Amarillo — ${SEMAFORO.amarillo.etiqueta}</span>
  <span><i class="punto rojo"></i> Rojo — ${SEMAFORO.rojo.etiqueta}</span>
</div>`;
}

function tarjetaNota(nota) {
  const color = nota.semaforo || "amarillo";
  const etiqueta = SEMAFORO[color]?.etiqueta || "";
  return `<article class="nota">
  <div class="col-izq">
    <span class="punto ${color}" role="img" aria-label="Semaforo ${color}: ${escHtml(etiqueta)}"></span>
    <span class="fecha">${escHtml(fechaCorta(nota.fecha))}</span>
    ${nota.nueva ? ICONO_NUEVO_SVG : ""}
  </div>
  <div class="col-der">
    <h3><a href="${escHtml(nota.url)}" target="_blank" rel="noopener">${escHtml(nota.titulo)}</a></h3>
    <p>${escHtml(nota.resumen || "")}</p>
    <div class="fuente-linea">
      <span class="chip">${escHtml(nota.fuente || "Fuente")}</span>
      <a href="${escHtml(nota.url)}" target="_blank" rel="noopener">Abrir noticia →</a>
    </div>
  </div>
</article>`;
}

function ordenarPorSemaforo(notas) {
  return [...notas].sort((a, b) => {
    const oa = ORDEN_SEMAFORO[a.semaforo] ?? 1;
    const ob = ORDEN_SEMAFORO[b.semaforo] ?? 1;
    if (oa !== ob) return oa - ob;
    return new Date(b.fecha) - new Date(a.fecha);
  });
}

function seccionesEjes(porEje) {
  return EJES.map((eje, i) => {
    const notas = ordenarPorSemaforo(porEje[eje.id] || []);
    const cuerpo = notas.length
      ? notas.map(tarjetaNota).join("\n")
      : `<p class="vacio">Sin notas.</p>`;
    return `<section class="eje">
  <h2><span class="num">${i + 1}</span> ${escHtml(eje.titulo)}</h2>
  ${cuerpo}
</section>`;
  }).join("\n");
}

function seccionNuevas(porEje) {
  const nuevas = [];
  for (const eje of EJES) {
    for (const nota of porEje[eje.id] || []) {
      if (!nota.nueva) continue;
      const d = new Date(nota.fecha);
      nuevas.push({ ...nota, ejeTitulo: eje.titulo, ts: isNaN(d) ? 0 : d.getTime() });
    }
  }
  nuevas.sort((a, b) => b.ts - a.ts);

  const cuerpo = nuevas.length
    ? nuevas.map((n) => `<div class="mes-nota-eje">${escHtml(n.ejeTitulo)}</div>\n${tarjetaNota(n)}`).join("\n")
    : `<p class="vacio">No hay noticias nuevas por el momento.</p>`;

  return `<section class="nuevas">
  <h2>Noticias Nuevas</h2>
  ${cuerpo}
</section>`;
}

function seccionMeses(porEje) {
  const todas = [];
  for (const eje of EJES) {
    for (const nota of porEje[eje.id] || []) {
      const d = new Date(nota.fecha);
      if (isNaN(d)) continue;
      todas.push({
        ...nota,
        ejeTitulo: eje.titulo,
        claveMes: `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`,
        ts: d.getTime()
      });
    }
  }
  if (!todas.length) return "";

  const mapa = new Map();
  for (const nota of todas) {
    if (!mapa.has(nota.claveMes)) mapa.set(nota.claveMes, []);
    mapa.get(nota.claveMes).push(nota);
  }
  const claves = [...mapa.keys()].sort((a, b) => b.localeCompare(a));

  const tabs = claves.map((clave, i) => {
    const [anio, mm] = clave.split("-");
    const nombre = `${MESES_LARGO[Number(mm) - 1]} ${anio}`;
    return `<button type="button" class="mes-tab${i === 0 ? " activo" : ""}" data-mes="${clave}">${escHtml(nombre)}</button>`;
  }).join("\n");

  const paneles = claves.map((clave, i) => {
    const notas = [...mapa.get(clave)].sort((a, b) => b.ts - a.ts);
    const cuerpo = notas.map((n) => `<div class="mes-nota-eje">${escHtml(n.ejeTitulo)}</div>\n${tarjetaNota(n)}`).join("\n");
    return `<div class="mes-panel${i === 0 ? " activo" : ""}" data-mes="${clave}">\n${cuerpo}\n</div>`;
  }).join("\n");

  return `<section class="por-mes">
  <h2>Historial por mes</h2>
  <div class="meses-tabs">
  ${tabs}
  </div>
  ${paneles}
</section>
<script>
(function(){
  var tabs = document.querySelectorAll(".mes-tab");
  var paneles = document.querySelectorAll(".mes-panel");
  tabs.forEach(function(tab){
    tab.addEventListener("click", function(){
      var mes = tab.getAttribute("data-mes");
      tabs.forEach(function(t){ t.classList.toggle("activo", t === tab); });
      paneles.forEach(function(p){ p.classList.toggle("activo", p.getAttribute("data-mes") === mes); });
    });
  });
})();
</script>`;
}

function renderPagina(porEje, metaDetalle) {
  const totalNotas = EJES.reduce((s, e) => s + (porEje[e.id]?.length || 0), 0);
  return `${cabecera("Avance Institucional")}
<header class="masthead">
  <p class="kicker">Boletin · Monitoreo de noticias</p>
  <h1 class="titulo">Avance Institucional</h1>
  <p class="subtitulo">Resumen de noticias relevantes para direccion — Mexicali y Baja California</p>
  <div class="meta">
    <span><strong>Resumen</strong> · ${escHtml(metaDetalle)}</span>
    <span>${totalNotas} ${totalNotas === 1 ? "nota" : "notas"}</span>
  </div>
</header>

${leyendaSemaforo()}

${seccionNuevas(porEje)}

${seccionMeses(porEje)}

${seccionesEjes(porEje)}

<footer>
  <p>Avance Institucional — documento interno de monitoreo.</p>
</footer>
</div></body></html>`;
}

// --- Punto de entrada --------------------------------------------------------
const notas = JSON.parse(await readFile(join(__dirname, "datos.json"), "utf-8"));

// datos.json es una lista plana; la agrupamos por eje usando el campo "eje"
// (el titulo tal cual aparece en EJES) o "ejeId" si ya viene como id.
const idPorTitulo = Object.fromEntries(EJES.map((e) => [e.titulo, e.id]));
const porEje = Object.fromEntries(EJES.map((e) => [e.id, []]));
for (const nota of notas) {
  const id = nota.ejeId || idPorTitulo[nota.eje] || "empresas";
  porEje[id].push(nota);
}

const hoy = new Date();
const metaDetalle = `Actualizado ${hoy.getUTCDate()} ${MESES_LARGO[hoy.getUTCMonth()]} ${hoy.getUTCFullYear()}`;

const html = renderPagina(porEje, metaDetalle);
await writeFile(join(__dirname, "index.html"), html, "utf-8");
console.log(`Listo: index.html generado con ${notas.length} notas.`);
