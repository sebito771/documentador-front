/* ============================================================
   EasyDocs — index.js
   Conecta el HTML con la API del backend.
   ============================================================ */

const API_BASE = 'https://documentador-api.vercel.app/api'; // Cambia esto a tu URL real

/* ============================================================
   1. UTILIDADES GENERALES
   ============================================================ */

/**
 * Muestra u oculta un elemento usando la clase "hidden".
 */
function setVisible(el, visible) {
  el.classList.toggle('hidden', !visible);
}

/**
 * Muestra un mensaje de feedback al usuario.
 * @param {HTMLElement} el  - Contenedor del mensaje
 * @param {string} texto    - Texto a mostrar
 * @param {'error'|'success'|'info'} tipo
 */
function mostrarMensaje(el, texto, tipo = 'info') {
  el.textContent = texto;
  el.className = `message message--${tipo}`;
  setVisible(el, true);
}

/**
 * Descarga un Blob como archivo en el navegador.
 * Los endpoints de descarga NO devuelven JSON,
 * devuelven un archivo binario (blob).
 * @param {Blob} blob
 * @param {string} nombreArchivo
 */
function descargarBlob(blob, nombreArchivo) {
  const url = URL.createObjectURL(blob);   // crea una URL temporal en memoria
  const a = document.createElement('a');   // crea un <a> invisible
  a.href = url;
  a.download = nombreArchivo;
  a.click();                               // simula el clic para descargar
  URL.revokeObjectURL(url);                // libera la memoria
}

/**
 * Activa/desactiva el estado de carga de un botón.
 * @param {HTMLElement} btn      - El botón
 * @param {HTMLElement} textoEl  - El <span> con el texto del botón
 * @param {HTMLElement} spinner  - El <span> del spinner
 * @param {boolean} cargando
 */
function setCargando(btn, textoEl, spinner, cargando) {
  btn.disabled = cargando;
  setVisible(textoEl, !cargando);
  setVisible(spinner, cargando);
}


/* ============================================================
   2. TABS — Cambiar entre paneles
   ============================================================ */

const tabs   = document.querySelectorAll('.tab');
const panels = document.querySelectorAll('.panel');

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    // Quitar activo de todos
    tabs.forEach(t => t.classList.remove('tab--active'));
    panels.forEach(p => p.classList.remove('panel--active'));

    // Activar el clickeado
    tab.classList.add('tab--active');
    const idPanel = `panel-${tab.dataset.tab}`;
    document.getElementById(idPanel).classList.add('panel--active');
  });
});


/* ============================================================
   3. FLUJO 1 — Código suelto → /api/download/<file_type>
   ============================================================ */

const inputCodigo     = document.getElementById('input-codigo');
const selectFormato   = document.getElementById('select-formato');
const inputExtraCodigo = document.getElementById('input-extra-codigo');
const btnDescargar    = document.getElementById('btn-descargar');
const btnDescargarTxt = document.getElementById('btn-descargar-text');
const spinnerCodigo   = document.getElementById('spinner-codigo');
const msgCodigo       = document.getElementById('msg-codigo');

btnDescargar.addEventListener('click', async () => {
  const codigo  = inputCodigo.value.trim();
  const formato = selectFormato.value;
  const extra   = inputExtraCodigo.value.trim();

  // Validación básica en el cliente
  if (!codigo) {
    mostrarMensaje(msgCodigo, 'Pega tu código antes de generar.', 'error');
    return;
  }

  if (codigo.length < 10) {
    mostrarMensaje(msgCodigo, 'El código es demasiado corto.', 'error');
    return;
  }

  // Activar estado de carga
  setCargando(btnDescargar, btnDescargarTxt, spinnerCodigo, true);
  setVisible(msgCodigo, false);

  try {
    /*
     * Este endpoint acepta:
     *   - JSON con { "codigo": "...el código fuente..." }
     *   - O un archivo directo como multipart
     * Aquí usamos JSON porque el usuario pegó texto.
     *
     * IMPORTANTE: La respuesta NO es JSON, es un archivo binario.
     * Por eso usamos response.blob() en lugar de response.json().
     */
    const payload = { codigo };
    if (extra) payload.extra_requirements = extra;

    const response = await fetch(`${API_BASE}/download/${formato}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      // Si hay error, el backend sí responde JSON con el mensaje
      const error = await response.json();
      throw new Error(error.error || 'Error desconocido del servidor');
    }

    // La respuesta es un blob (archivo binario)
    const blob     = await response.blob();
    const ext      = formato === 'pdf' ? 'pdf' : formato === 'docx' ? 'docx' : 'md';
    const fecha    = new Date().toISOString().slice(0, 10);
    const nombre   = `documentacion_${fecha}.${ext}`;

    descargarBlob(blob, nombre);
    mostrarMensaje(msgCodigo, `¡Documentación generada! Descargando ${nombre}...`, 'success');

  } catch (err) {
    mostrarMensaje(msgCodigo, `Error: ${err.message}`, 'error');
  } finally {
    // Siempre desactivar la carga, haya error o no
    setCargando(btnDescargar, btnDescargarTxt, spinnerCodigo, false);
  }
});


/* ============================================================
   4. FLUJO 2 — ZIP: subida y drop zone
   ============================================================ */

const inputZip      = document.getElementById('input-zip');
const dropZone      = document.getElementById('drop-zone');
const nombreArchivo = document.getElementById('nombre-archivo');
const btnPreview    = document.getElementById('btn-preview');
const opcionesZip   = document.getElementById('opciones-zip');

let archivoZip = null; // guardamos el File aquí

/** Cuando el usuario selecciona un archivo con el input */
inputZip.addEventListener('change', () => {
  if (inputZip.files.length > 0) {
    manejarArchivoSeleccionado(inputZip.files[0]);
  }
});

/** Drag & Drop: cuando el archivo entra en la zona */
dropZone.addEventListener('dragover', (e) => {
  e.preventDefault(); // necesario para permitir el drop
  dropZone.classList.add('drop-zone--over');
});

dropZone.addEventListener('dragleave', () => {
  dropZone.classList.remove('drop-zone--over');
});

/** Drag & Drop: cuando el archivo se suelta */
dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('drop-zone--over');
  const file = e.dataTransfer.files[0];
  if (file) manejarArchivoSeleccionado(file);
});

/** Valida y registra el archivo seleccionado */
function manejarArchivoSeleccionado(file) {
  if (!file.name.endsWith('.zip')) {
    mostrarMensaje(msgZip, 'Solo se permiten archivos .zip', 'error');
    return;
  }

  archivoZip = file;
  nombreArchivo.textContent = `📦 ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
  setVisible(nombreArchivo, true);
  btnPreview.disabled = false;  // habilitar el botón de preview
  setVisible(listaArchivos, false);
  setVisible(opcionesZip, false);
}


/* ============================================================
   5. FLUJO 2 — Preview del ZIP → POST /api/preview-zip
   ============================================================ */

const btnPreviewTxt  = document.getElementById('btn-preview-text');
const spinnerPreview = document.getElementById('spinner-preview');
const listaArchivos  = document.getElementById('lista-archivos');
const msgZip         = document.getElementById('msg-zip');

btnPreview.addEventListener('click', async () => {
  if (!archivoZip) return;

  setCargando(btnPreview, btnPreviewTxt, spinnerPreview, true);
  setVisible(msgZip, false);

  /*
   * Este endpoint espera un multipart/form-data con el campo "file".
   * Usamos FormData para construir ese tipo de request.
   * NO ponemos Content-Type manualmente: el navegador lo agrega solo
   * con el boundary correcto cuando usas FormData.
   */
  const formData = new FormData();
  formData.append('file', archivoZip);

  try {
    const response = await fetch(`${API_BASE}/preview-zip`, {
      method: 'POST',
      body: formData
      // No pongas headers: { 'Content-Type': ... } con FormData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al previsualizar');
    }

    // Este endpoint sí devuelve JSON con la lista de archivos
    const data = await response.json();
    renderizarListaArchivos(data);
    setVisible(opcionesZip, true);  // mostrar opciones de generación

  } catch (err) {
    mostrarMensaje(msgZip, `Error: ${err.message}`, 'error');
  } finally {
    setCargando(btnPreview, btnPreviewTxt, spinnerPreview, false);
  }
});

/**
 * Mapeo de lenguajes a colores para los badges.
 * Añadir más si el backend soporta otras extensiones.
 */
const LANG_COLORS = {
  js:   '#f7df1e',
  ts:   '#3178c6',
  py:   '#3572a5',
  java: '#b07219',
  go:   '#00add8',
  php:  '#4f5d95',
  css:  '#563d7c',
  html: '#e34c26',
  json: '#292929',
  xml:  '#0060ac',
  yml:  '#cb171e',
  yaml: '#cb171e',
};

/**
 * Renderiza la lista de archivos del ZIP como tarjetas visuales.
 * La respuesta del backend es un array de objetos:
 * [{ file: string, language: string, valid: boolean, size: string }]
 */
function renderizarListaArchivos(data) {
  listaArchivos.innerHTML = '';

  // El backend devuelve directamente un array
  const archivos = Array.isArray(data) ? data : (data.archivos || data.files || []);

  if (archivos.length === 0) {
    listaArchivos.innerHTML = '<p style="color:var(--text-dim);font-size:.78rem">El ZIP está vacío o no contiene archivos reconocibles.</p>';
    setVisible(listaArchivos, true);
    return;
  }

  // Contadores para el resumen
  let validCount = 0;
  let invalidCount = 0;

  // Contenedor principal de la lista
  const lista = document.createElement('div');
  lista.className = 'file-preview-list';
  lista.style.cssText = 'display:flex;flex-direction:column;gap:6px;';

  archivos.forEach(archivo => {
    const nombre   = archivo.file     || archivo.nombre || archivo.name || '(desconocido)';
    const lang     = (archivo.language || '').toLowerCase();
    const esValido = archivo.valid !== undefined ? archivo.valid : true;
    const size     = archivo.size     || '';

    if (esValido) validCount++; else invalidCount++;

    // Extraer solo el nombre del archivo (sin la ruta completa)
    const partes     = nombre.split('/');
    const soloNombre = partes[partes.length - 1];
    const rutaDir    = partes.length > 1 ? partes.slice(0, -1).join('/') + '/' : '';

    // Color del badge según el lenguaje
    const badgeColor = LANG_COLORS[lang] || '#888';
    const textColor  = ['js', 'yml', 'yaml'].includes(lang) ? '#222' : '#fff';

    const item = document.createElement('div');
    item.style.cssText = `
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 7px 10px;
      border-radius: 6px;
      background: ${esValido ? 'var(--surface, #1a1a2e)' : 'rgba(255,80,80,0.05)'};
      border: 1px solid ${esValido ? 'var(--border, #2a2a3e)' : 'rgba(255,80,80,0.2)'};
      font-size: 0.78rem;
      font-family: 'IBM Plex Mono', monospace;
      opacity: ${esValido ? '1' : '0.6'};
    `;

    item.innerHTML = `
      <!-- Icono de estado -->
      <span title="${esValido ? 'Será procesado' : 'No será procesado (extensión no soportada)'}"
            style="font-size:1rem;flex-shrink:0;">
        ${esValido ? '✅' : '⛔'}
      </span>

      <!-- Ruta del archivo -->
      <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"
            title="${nombre}">
        <span style="color:var(--text-dim, #666);">${rutaDir}</span>
        <span style="color:var(--text, #eee);font-weight:500;">${soloNombre}</span>
      </span>

      <!-- Badge de lenguaje -->
      ${lang ? `
        <span style="
          background:${badgeColor};
          color:${textColor};
          padding:2px 7px;
          border-radius:4px;
          font-size:0.68rem;
          font-weight:600;
          flex-shrink:0;
          letter-spacing:.5px;
          text-transform:uppercase;
        ">${lang}</span>
      ` : ''}

      <!-- Tamaño -->
      ${size ? `
        <span style="color:var(--text-dim, #888);flex-shrink:0;min-width:52px;text-align:right;">
          ${size}
        </span>
      ` : ''}
    `;

    lista.appendChild(item);
  });

  // Resumen estadístico encima de la lista
  const resumen = document.createElement('div');
  resumen.style.cssText = `
    display: flex;
    gap: 14px;
    margin-bottom: 8px;
    font-size: 0.75rem;
    font-family: 'IBM Plex Mono', monospace;
    color: var(--text-dim, #888);
  `;
  resumen.innerHTML = `
    <span>📦 <strong style="color:var(--text)">${archivos.length}</strong> archivos totales</span>
    <span>✅ <strong style="color:#4ade80">${validCount}</strong> procesables</span>
    ${invalidCount > 0
      ? `<span>⛔ <strong style="color:#f87171">${invalidCount}</strong> ignorados</span>`
      : ''}
  `;

  listaArchivos.appendChild(resumen);
  listaArchivos.appendChild(lista);
  setVisible(listaArchivos, true);
}


/* ============================================================
   6. FLUJO 2 — Procesar ZIP → POST /api/upload-zip
   ============================================================ */

const btnProcesarZip  = document.getElementById('btn-procesar-zip');
const btnProcesarTxt  = document.getElementById('btn-procesar-text');
const spinnerZip      = document.getElementById('spinner-zip');
const selectDocType   = document.getElementById('select-doc-type');
const inputExtra      = document.getElementById('input-extra');

btnProcesarZip.addEventListener('click', async () => {
  if (!archivoZip) return;

  setCargando(btnProcesarZip, btnProcesarTxt, spinnerZip, true);
  setVisible(msgZip, false);

  const formData = new FormData();
  formData.append('file', archivoZip);
  formData.append('doc_type', selectDocType.value);
  formData.append('extra_requirements', inputExtra.value.trim());

  try {
    const response = await fetch(`${API_BASE}/upload-zip`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al procesar el ZIP');
    }

    const blob = await response.blob();
    const docType = selectDocType.value;
    const ext = docType === 'pdf' ? 'pdf' : docType === 'word' ? 'docx' : 'md';
    const fecha = new Date().toISOString().slice(0, 10);
    const nombre = `documentacion_${fecha}.${ext}`;

    descargarBlob(blob, nombre);
    mostrarMensaje(msgZip, `¡Documentación generada! Descargando ${nombre}...`, 'success');

  } catch (err) {
    mostrarMensaje(msgZip, `Error: ${err.message}`, 'error');
  } finally {
    setCargando(btnProcesarZip, btnProcesarTxt, spinnerZip, false);
  }
});

/* ============================================================
   8. FLUJO 3 — Archivo suelto → /api/download/<file_type>
   ============================================================ */

const inputArchivo        = document.getElementById('input-archivo');
const dropZoneArchivo     = document.getElementById('drop-zone-archivo');
const nombreArchivoSuelto = document.getElementById('nombre-archivo-suelto');
const selectFormatoArch   = document.getElementById('select-formato-archivo');
const inputExtraArchivo   = document.getElementById('input-extra-archivo');
const btnDescargarArch    = document.getElementById('btn-descargar-archivo');
const btnDescargarArchTxt = document.getElementById('btn-descargar-archivo-text');
const spinnerArchivo      = document.getElementById('spinner-archivo');
const msgArchivo          = document.getElementById('msg-archivo');

let archivoSuelto = null;

inputArchivo.addEventListener('change', () => {
  if (inputArchivo.files.length > 0) {
    manejarArchivoSuelto(inputArchivo.files[0]);
  }
});

dropZoneArchivo.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZoneArchivo.classList.add('drop-zone--over');
});

dropZoneArchivo.addEventListener('dragleave', () => {
  dropZoneArchivo.classList.remove('drop-zone--over');
});

dropZoneArchivo.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZoneArchivo.classList.remove('drop-zone--over');
  const file = e.dataTransfer.files[0];
  if (file) manejarArchivoSuelto(file);
});

function manejarArchivoSuelto(file) {
  archivoSuelto = file;
  nombreArchivoSuelto.textContent = `📄 ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
  setVisible(nombreArchivoSuelto, true);
  btnDescargarArch.disabled = false;
  setVisible(msgArchivo, false);
}

btnDescargarArch.addEventListener('click', async () => {
  if (!archivoSuelto) return;

  const formato = selectFormatoArch.value;
  const extra   = inputExtraArchivo.value.trim();

  setCargando(btnDescargarArch, btnDescargarArchTxt, spinnerArchivo, true);
  setVisible(msgArchivo, false);

  const formData = new FormData();
  formData.append('file', archivoSuelto);
  if (extra) formData.append('extra', extra);

  try {
    const response = await fetch(`${API_BASE}/download/${formato}`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error desconocido del servidor');
    }

    const blob  = await response.blob();
    const ext   = formato === 'pdf' ? 'pdf' : formato === 'word' ? 'docx' : 'md';
    const fecha = new Date().toISOString().slice(0, 10);
    const nombre = `documentacion_${fecha}.${ext}`;

    descargarBlob(blob, nombre);
    mostrarMensaje(msgArchivo, `¡Documentación generada! Descargando ${nombre}...`, 'success');

  } catch (err) {
    mostrarMensaje(msgArchivo, `Error: ${err.message}`, 'error');
  } finally {
    setCargando(btnDescargarArch, btnDescargarArchTxt, spinnerArchivo, false);
  }
});
