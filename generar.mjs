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

// --- Los 7 ejes: id interno, clave tal cual aparece en datos.json, y titulo
// para mostrar (con acentos) ------------------------------------------------
const EJES = [
  { id: "camaras", claveDatos: "Camaras empresariales", titulo: "Cámaras empresariales" },
  { id: "gobierno", claveDatos: "Gobierno", titulo: "Gobierno" },
  { id: "agropecuario", claveDatos: "Agropecuario", titulo: "Agropecuario" },
  { id: "empresas", claveDatos: "Empresas y lideres establecidos", titulo: "Empresas y líderes establecidos" },
  { id: "inversion", claveDatos: "Inversion entrante / expansiones", titulo: "Inversión / expansiones" },
  { id: "hacienda", claveDatos: "Hacienda", titulo: "Hacienda" },
  { id: "filantropia", claveDatos: "Filantropia y responsabilidad social", titulo: "Filantropía y responsabilidad social" }
];

// --- Colores, etiquetas y descripciones del semaforo ------------------------
const SEMAFORO = {
  verde: { etiqueta: "positivo", desc: "avances y anuncios favorables" },
  amarillo: { etiqueta: "neutral", desc: "seguimiento sin definición clara" },
  rojo: { etiqueta: "Alerta", desc: "riesgos que requieren atención" }
};

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
  --ink:#1c2530;
  --paper:#ffffff;
  --fondo:#f1f1ef;
  --acento:#2f6db3;
  --acento-oscuro:#24568e;
  --rule:#dcdfe3; --muted:#6b7785;
  --verde:#1f8a4c; --amarillo:#c98a00; --rojo:#c0392b;
}
*{box-sizing:border-box;}
body{
  margin:0; background:var(--fondo); color:var(--ink);
  font-family:Arial,Helvetica,sans-serif; line-height:1.55;
  -webkit-font-smoothing:antialiased;
}
.page{max-width:1280px; margin:0 auto; padding:24px 24px 60px;}
a{color:var(--acento); text-decoration:none;}
a:hover{text-decoration:underline;}

.masthead{background:var(--acento); color:#fff; padding:30px 32px; margin-bottom:20px;}
.kicker{font-size:.72rem; letter-spacing:.24em; text-transform:uppercase; color:rgba(255,255,255,.9); margin:0 0 10px; font-weight:700;}
.titulo{font-family:Arial,Helvetica,sans-serif; font-weight:800; letter-spacing:.02em; font-size:clamp(2rem,4.5vw,3rem); line-height:1.02; margin:0; color:#fff; text-transform:uppercase;}
.subtitulo{color:rgba(255,255,255,.95); margin:12px 0 0; font-size:1rem; font-weight:500;}
.meta{display:flex; flex-wrap:wrap; gap:10px 18px; align-items:center; justify-content:space-between;
  border-top:1px solid rgba(255,255,255,.4);
  padding:14px 0 0; margin:18px 0 0; font-size:.85rem; color:rgba(255,255,255,.95);}
.meta strong{color:#fff; font-weight:700;}

.stats-row{display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:1px; background:var(--rule); border:1px solid var(--rule); margin-bottom:20px;}
.stat-card{background:var(--paper); padding:18px 20px;}
.stat-cabeza{display:flex; align-items:center; gap:8px; font-size:.72rem; font-weight:700; letter-spacing:.06em; text-transform:uppercase; color:var(--ink); margin-bottom:10px;}
.stat-icono{width:11px; height:11px; display:inline-block; border-radius:2px; flex:0 0 auto;}
.stat-icono.verde{background:var(--verde);} .stat-icono.amarillo{background:var(--amarillo);} .stat-icono.rojo{background:var(--rojo);}
.stat-num{font-size:2.1rem; font-weight:800; line-height:1; margin-bottom:6px;}
.stat-desc{font-size:.8rem; color:var(--muted);}

.cuerpo{display:flex; gap:32px; align-items:flex-start; border-top:1px solid var(--rule); padding-top:20px;}

.fuentes-lateral{width:160px; flex:0 0 auto; font-size:.78rem; line-height:1.7;}
.fuentes-lateral h3{font-family:Arial,Helvetica,sans-serif; font-size:.72rem; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:var(--ink); margin:0 0 10px;}
.fuentes-lateral ul{list-style:none; margin:0; padding:0;}
.fuentes-lateral li{margin-bottom:4px;}
.fuentes-lateral a{color:var(--ink);}
.fuentes-lateral a:hover{color:var(--acento);}

.contenido{flex:1; min-width:0;}

.filtro-fila{display:flex; flex-wrap:wrap; align-items:center; gap:12px; margin-bottom:10px;}
.filtro-titulo{font-size:.72rem; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:var(--muted); flex:0 0 auto;}
.filtro-pills{display:flex; flex-wrap:wrap; gap:8px;}
.pill{font:inherit; cursor:pointer; background:#fff; border:1px solid var(--rule); border-radius:999px;
  padding:6px 14px; font-size:.8rem; color:var(--ink);}
.pill.activo{background:var(--acento); border-color:var(--acento); color:#fff; font-weight:700;}

.contador{font-size:.85rem; color:var(--muted); margin:14px 0 16px;}
.contador strong{color:var(--ink);}

.grid-notas{display:grid; grid-template-columns:repeat(3,1fr); border-top:1px solid var(--rule); border-left:1px solid var(--rule);}
.tarjeta{background:#fff; border-right:1px solid var(--rule); border-bottom:1px solid var(--rule); padding:18px 20px;}
.tarjeta-top{display:flex; align-items:center; gap:8px; margin-bottom:4px;}
.tarjeta-top .punto{width:10px; height:10px; border-radius:50%; display:inline-block; flex:0 0 auto;}
.tarjeta-top .punto.verde{background:var(--verde);} .tarjeta-top .punto.amarillo{background:var(--amarillo);} .tarjeta-top .punto.rojo{background:var(--rojo);}
.tarjeta-top .fecha{font-size:.76rem; color:var(--muted); font-weight:600;}
.tarjeta-top .nueva-tag{margin-left:auto; font-size:.7rem; font-weight:700; text-transform:uppercase; letter-spacing:.04em; color:var(--acento);}
.tarjeta-cat{font-size:.68rem; font-weight:700; letter-spacing:.05em; text-transform:uppercase; color:var(--acento); margin-bottom:6px;}
.tarjeta h3{font-family:Arial,Helvetica,sans-serif; font-weight:700; font-size:1rem; letter-spacing:-.01em; margin:0 0 8px; line-height:1.32;}
.tarjeta h3 a{color:var(--ink);}
.tarjeta h3 a:hover{color:var(--acento);}
.tarjeta p{margin:0 0 12px; color:#39404a; font-size:.88rem;}
.tarjeta-footer{font-size:.78rem; display:flex; flex-wrap:wrap; gap:10px; align-items:center; justify-content:space-between;}
.chip{background:#fff; border:1px solid var(--acento); color:var(--acento); border-radius:4px; padding:2px 9px; font-size:.72rem;}
.tarjeta-footer > a{color:var(--ink); font-weight:700;}
.tarjeta-footer > a:hover{color:var(--acento);}
.sin-resultados{grid-column:1/-1; padding:30px 20px; color:var(--muted); font-style:italic; text-align:center;}

footer{margin-top:40px; border-top:1px solid var(--rule); padding-top:16px; text-align:center; color:var(--muted); font-size:.82rem;}

@media (max-width:960px){
  .grid-notas{grid-template-columns:repeat(2,1fr);}
}
@media (max-width:760px){
  .cuerpo{flex-direction:column;}
  .fuentes-lateral{width:100%;}
  .grid-notas{grid-template-columns:1fr;}
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
<body>`;
}

function filaEstadisticas(notas) {
  const conteo = { verde: 0, amarillo: 0, rojo: 0 };
  for (const n of notas) conteo[n.semaforo] = (conteo[n.semaforo] || 0) + 1;
  return `<div class="stats-row">
  ${["verde", "amarillo", "rojo"].map((color) => `<div class="stat-card">
    <div class="stat-cabeza"><span class="stat-icono ${color}"></span>${color} — ${SEMAFORO[color].etiqueta}</div>
    <div class="stat-num">${conteo[color]}</div>
    <div class="stat-desc">${SEMAFORO[color].desc}</div>
  </div>`).join("\n")}
</div>`;
}

function sidebarFuentes(fuentes) {
  if (!fuentes.length) return "";
  const items = fuentes
    .map(([nombre, origen]) => `<li><a href="${escHtml(origen)}" target="_blank" rel="noopener">${escHtml(nombre)}</a></li>`)
    .join("\n");
  return `<aside class="fuentes-lateral" aria-label="Fuentes de noticias habituales">
  <h3>Fuentes habituales</h3>
  <ul>
  ${items}
  </ul>
</aside>`;
}

function filtroCategoria() {
  const pills = [`<button type="button" class="pill activo" data-cat="todas">Todas</button>`]
    .concat(EJES.map((e) => `<button type="button" class="pill" data-cat="${e.id}">${escHtml(e.titulo)}</button>`))
    .join("\n");
  return `<div class="filtro-fila">
  <span class="filtro-titulo">Categoría</span>
  <div class="filtro-pills" data-grupo="categoria">${pills}</div>
</div>`;
}

function filtroMes(claves) {
  const pills = [`<button type="button" class="pill activo" data-mes="nuevas">Noticias nuevas</button>`]
    .concat(claves.map((clave) => {
      const [anio, mm] = clave.split("-");
      return `<button type="button" class="pill" data-mes="${clave}">${MESES_LARGO[Number(mm) - 1]} ${anio}</button>`;
    }))
    .join("\n");
  return `<div class="filtro-fila">
  <span class="filtro-titulo">Historial por mes</span>
  <div class="filtro-pills" data-grupo="mes">${pills}</div>
</div>`;
}

function tarjetaNota(nota) {
  const etiqueta = SEMAFORO[nota.semaforo]?.etiqueta || "";
  return `<article class="tarjeta" data-cat="${nota.ejeId}" data-mes="${nota.claveMes}" data-nueva="${nota.nueva ? 1 : 0}">
  <div class="tarjeta-top">
    <span class="punto ${nota.semaforo}" role="img" aria-label="Semaforo ${nota.semaforo}: ${escHtml(etiqueta)}"></span>
    <span class="fecha">${escHtml(fechaCorta(nota.fecha))}</span>
    ${nota.nueva ? `<span class="nueva-tag">Nueva</span>` : ""}
  </div>
  <div class="tarjeta-cat">${escHtml(nota.ejeTitulo)}</div>
  <h3><a href="${escHtml(nota.url)}" target="_blank" rel="noopener">${escHtml(nota.titulo)}</a></h3>
  <p>${escHtml(nota.resumen || "")}</p>
  <div class="tarjeta-footer">
    <span class="chip">${escHtml(nota.fuente || "Fuente")}</span>
    <a href="${escHtml(nota.url)}" target="_blank" rel="noopener">Abrir noticia →</a>
  </div>
</article>`;
}

function scriptFiltros() {
  return `<script>
(function(){
  var tarjetas = document.querySelectorAll(".tarjeta");
  var gruposCat = document.querySelectorAll('[data-grupo="categoria"] .pill');
  var gruposMes = document.querySelectorAll('[data-grupo="mes"] .pill');
  var contadorNum = document.getElementById("contador-num");
  var contadorLabel = document.getElementById("contador-label");
  var grid = document.getElementById("grid-notas");

  function aplicar(){
    var catBtn = document.querySelector('[data-grupo="categoria"] .pill.activo');
    var mesBtn = document.querySelector('[data-grupo="mes"] .pill.activo');
    var cat = catBtn.getAttribute("data-cat");
    var mes = mesBtn.getAttribute("data-mes");
    var visibles = 0;
    tarjetas.forEach(function(t){
      var okCat = (cat === "todas") || (t.getAttribute("data-cat") === cat);
      var okMes = (mes === "nuevas") ? (t.getAttribute("data-nueva") === "1") : (t.getAttribute("data-mes") === mes);
      var mostrar = okCat && okMes;
      t.style.display = mostrar ? "" : "none";
      if (mostrar) visibles++;
    });
    contadorNum.textContent = visibles;
    contadorLabel.textContent = (cat === "todas") ? mesBtn.textContent : (mesBtn.textContent + " · " + catBtn.textContent);
    var vacio = grid.querySelector(".sin-resultados");
    if (visibles === 0 && !vacio) {
      vacio = document.createElement("div");
      vacio.className = "sin-resultados";
      vacio.textContent = "No hay noticias para este filtro.";
      grid.appendChild(vacio);
    } else if (visibles > 0 && vacio) {
      vacio.remove();
    }
  }

  gruposCat.forEach(function(btn){
    btn.addEventListener("click", function(){
      gruposCat.forEach(function(b){ b.classList.toggle("activo", b === btn); });
      aplicar();
    });
  });
  gruposMes.forEach(function(btn){
    btn.addEventListener("click", function(){
      gruposMes.forEach(function(b){ b.classList.toggle("activo", b === btn); });
      aplicar();
    });
  });
  aplicar();
})();
</script>`;
}

function renderPagina(notas, metaDetalle, fuentes, claves) {
  const totalNotas = notas.length;
  return `${cabecera("Avance Institucional")}
<div class="page">
<header class="masthead">
  <p class="kicker">Boletin · Monitoreo de noticias</p>
  <h1 class="titulo">Avance Institucional</h1>
  <p class="subtitulo">Resumen de noticias relevantes para direccion — Mexicali y Baja California</p>
  <div class="meta">
    <span><strong>Resumen</strong> · ${escHtml(metaDetalle)}</span>
    <span>${totalNotas} ${totalNotas === 1 ? "nota" : "notas"}</span>
  </div>
</header>

${filaEstadisticas(notas)}

<div class="cuerpo">
${sidebarFuentes(fuentes)}
<main class="contenido">
  ${filtroCategoria()}
  ${filtroMes(claves)}
  <div class="contador"><strong id="contador-num">0</strong> notas · <span id="contador-label"></span></div>
  <div class="grid-notas" id="grid-notas">
  ${notas.map(tarjetaNota).join("\n")}
  </div>
</main>
</div>

<footer>
  <p>Avance Institucional — documento interno de monitoreo.</p>
</footer>
</div>
${scriptFiltros()}
</body></html>`;
}

// --- Punto de entrada --------------------------------------------------------
const notasCrudas = JSON.parse(await readFile(join(__dirname, "datos.json"), "utf-8"));

const idPorClave = Object.fromEntries(EJES.map((e) => [e.claveDatos, e.id]));
const tituloPorId = Object.fromEntries(EJES.map((e) => [e.id, e.titulo]));

const notas = notasCrudas.map((n) => {
  const ejeId = n.ejeId || idPorClave[n.eje] || "empresas";
  const d = new Date(n.fecha);
  const ts = isNaN(d) ? 0 : d.getTime();
  const claveMes = isNaN(d) ? "" : `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  return { ...n, ejeId, ejeTitulo: tituloPorId[ejeId], ts, claveMes };
}).sort((a, b) => b.ts - a.ts);

const claves = [...new Set(notas.map((n) => n.claveMes).filter(Boolean))].sort((a, b) => b.localeCompare(a));

const hoy = new Date();
const metaDetalle = `Actualizado ${hoy.getUTCDate()} ${MESES_LARGO[hoy.getUTCMonth()]} ${hoy.getUTCFullYear()}`;

// --- Fuentes habituales (para el listado lateral) ---------------------------
const fuentesMapa = new Map();
for (const nota of notas) {
  if (!nota.fuente || !nota.url || fuentesMapa.has(nota.fuente)) continue;
  try {
    fuentesMapa.set(nota.fuente, new URL(nota.url).origin);
  } catch {
    // URL invalida: se omite del listado lateral
  }
}
const fuentes = [...fuentesMapa.entries()].sort((a, b) => a[0].localeCompare(b[0], "es"));

const html = renderPagina(notas, metaDetalle, fuentes, claves);
await writeFile(join(__dirname, "index.html"), html, "utf-8");
console.log(`Listo: index.html generado con ${notas.length} notas.`);
