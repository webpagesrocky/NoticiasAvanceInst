# Avance Institucional — paquete para nuevo repositorio

Este paquete trae todo lo necesario para tener la misma página, con las
mismas 48 noticias, los mismos colores y el mismo diseño, en un repositorio
nuevo.

## Qué trae cada archivo

- **index.html** — la página final, lista para usar tal cual. Ábrela en el
  navegador y ya funciona (semáforo de colores, punto azul en las noticias
  nuevas, sección "Historial por mes" con filtro al hacer clic).
- **datos.json** — las 48 noticias en un formato editable: título, link,
  fuente, fecha, eje, color y resumen de cada una.
- **generar.mjs** — script de Node (sin dependencias externas) que lee
  `datos.json` y reconstruye `index.html`. Solo lo necesitas si vas a
  agregar o editar noticias más adelante.

## 1) Crear el repositorio nuevo

1. En GitHub, crea un repositorio nuevo (puede ser público o privado).
2. Sube estos 3 archivos (`index.html`, `datos.json`, `generar.mjs`) a la
   raíz del repositorio, con "Add file → Upload files" arrastrándolos
   directamente (no los metas en una carpeta ni los subas como .zip).

## 2) Publicar el sitio

Elige una opción:

**Opción A — GitHub Pages**
1. En el repo: Settings → Pages.
2. Source: "Deploy from a branch" → rama `main` → carpeta `/ (root)`.
3. Guarda. En un minuto tendrás una URL pública tipo
   `https://tu-usuario.github.io/tu-repo/`.

**Opción B — Netlify (conectado a GitHub, se actualiza solo)**
1. En Netlify: "Add new site" → "Import an existing project" → conecta tu
   cuenta de GitHub y elige el repositorio nuevo.
2. Build command: déjalo vacío. Publish directory: `.` (la raíz).
3. Deploy. Cada vez que subas un cambio a `main`, Netlify lo publica solo.

## 3) Cómo agregar noticias más adelante

1. Abre `datos.json`. Es una lista; cada noticia es un bloque así:

```json
{
  "titulo": "Título de la noticia",
  "url": "https://...",
  "fuente": "Nombre del medio",
  "fecha": "2026-08-17",
  "eje": "Camaras empresariales",
  "semaforo": "verde",
  "nueva": true,
  "resumen": "1-2 frases del contenido, tono ejecutivo."
}
```

2. Copia un bloque, pégalo, y llena los datos de la noticia nueva. Ponle
   `"nueva": true` para que le salga el puntito azul; quítaselo (o pon
   `false`) a las noticias viejas cuando ya no quieras que se vea como
   nueva.

3. Los valores válidos:
   - `"eje"`: uno de estos 7 textos exactos —
     `"Filantropia y responsabilidad social"`, `"Empresas y lideres establecidos"`,
     `"Inversion entrante / expansiones"`, `"Gobierno"`, `"Hacienda"`,
     `"Agropecuario"`, `"Camaras empresariales"`.
   - `"semaforo"`: `"verde"` (positivo), `"amarillo"` (seguimiento/neutral)
     o `"rojo"` (alerta/riesgo).
   - `"fecha"`: formato `AAAA-MM-DD`. De ahí sale tanto la fecha que se ve en
     la tarjeta como en qué pestaña de mes aparece.

4. Guarda `datos.json` y corre, con Node instalado (versión 18 o más
   nueva):

   ```bash
   node generar.mjs
   ```

   Esto reescribe `index.html` con los cambios. Sube el `index.html`
   actualizado (y el `datos.json`) al repositorio y listo.

## Notas

- No hay backend ni base de datos: todo vive en `datos.json` y se
  "hornea" a HTML estático con `generar.mjs`. Es la forma más simple de
  mantenerlo sin depender de APIs de pago ni de infraestructura extra.
- El filtro "Historial por mes" es JavaScript plano (sin librerías): junta
  todas las noticias, las agrupa por el mes de su `fecha`, y al hacer clic
  en una pestaña muestra solo ese grupo.
