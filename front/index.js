/* ============================================================
   EasyDocs — index.js
   Conecta el HTML con la API del backend.
   ============================================================ */

const API_BASE = 'http://documentador-api.vercel.app/api'; // Cambia esto a tu URL real

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
const btnDescargar    = document.getElementById('btn-descargar');
const btnDescargarTxt = document.getElementById('btn-descargar-text');
const spinnerCodigo   = document.getElementById('spinner-codigo');
const msgCodigo       = document.getElementById('msg-codigo');

btnDescargar.addEventListener('click', async () => {
  const codigo  = inputCodigo.value.trim();
  const formato = selectFormato.value;  // 'pdf' o 'markdown'

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
    const response = await fetch(`${API_BASE}/download/${formato}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ codigo })
    });

    if (!response.ok) {
      // Si hay error, el backend sí responde JSON con el mensaje
      const error = await response.json();
      throw new Error(error.error || 'Error desconocido del servidor');
    }

    // La respuesta es un blob (archivo binario)
    const blob     = await response.blob();
    const ext      = formato === 'pdf' ? 'pdf' : 'md';
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
  setVisible(resultadoZip, false);
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
 * Renderiza la lista de archivos del ZIP en el DOM.
 * La estructura exacta depende de lo que devuelva tu backend.
 * Ajusta según la respuesta real de /api/preview-zip.
 */
function renderizarListaArchivos(data) {
  listaArchivos.innerHTML = '';

  // Intentamos manejar distintas formas en que el backend puede devolver la lista
  const archivos = Array.isArray(data) ? data : (data.archivos || data.files || []);

  if (archivos.length === 0) {
    listaArchivos.innerHTML = '<p style="color:var(--text-dim);font-size:.78rem">El ZIP está vacío.</p>';
  } else {
    archivos.forEach(archivo => {
      const item = document.createElement('div');
      item.className = 'file-list__item';
      const nombre = typeof archivo === 'string' ? archivo : (archivo.nombre || archivo.name || JSON.stringify(archivo));
      item.innerHTML = `<span>📄</span> <span>${nombre}</span>`;
      listaArchivos.appendChild(item);
    });
  }

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
const resultadoZip    = document.getElementById('resultado-zip');
const contenidoZip    = document.getElementById('contenido-zip');
const metaZip         = document.getElementById('meta-zip');
const btnCopiar       = document.getElementById('btn-copiar');

btnProcesarZip.addEventListener('click', async () => {
  if (!archivoZip) return;

  setCargando(btnProcesarZip, btnProcesarTxt, spinnerZip, true);
  setVisible(msgZip, false);
  setVisible(resultadoZip, false);

  /*
   * Este endpoint espera multipart/form-data con:
   *   - file: el archivo .zip
   *   - doc_type: 'markdown' | 'pdf' | 'word'
   *   - extra_requirements: texto libre (opcional)
   */
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

    const data = await response.json();
    /*
     * El backend devuelve:
     * {
     *   success: true,
     *   documentation: "...texto...",
     *   metadata: { total_files, elapsed_time_seconds, cache: {...} },
     *   errors: { files: [...], count: 0 }
     * }
     */
    renderizarResultado(data);

  } catch (err) {
    mostrarMensaje(msgZip, `Error: ${err.message}`, 'error');
  } finally {
    setCargando(btnProcesarZip, btnProcesarTxt, spinnerZip, false);
  }
});

/** Muestra la documentación generada y las métricas */
function renderizarResultado(data) {
  contenidoZip.textContent = data.documentation || '';

  // Mostrar metadata
  const m = data.metadata || {};
  metaZip.innerHTML = `
    <span>${m.total_files ?? '?'} archivos</span>
    <span>${(m.elapsed_time_seconds ?? 0).toFixed(2)}s</span>
    <span>cache ${m.cache?.hit_rate_percent ?? 0}%</span>
  `;

  setVisible(resultadoZip, true);
  resultadoZip.scrollIntoView({ behavior: 'smooth' });

  // Advertir si hubo archivos con error
  if (data.errors?.count > 0) {
    mostrarMensaje(msgZip, `Advertencia: ${data.errors.count} archivo(s) no pudieron procesarse.`, 'info');
  }
}


/* ============================================================
   7. COPIAR AL PORTAPAPELES
   ============================================================ */

btnCopiar.addEventListener('click', async () => {
  const texto = contenidoZip.textContent;
  if (!texto) return;

  try {
    await navigator.clipboard.writeText(texto);
    const original = btnCopiar.textContent;
    btnCopiar.textContent = '✓ Copiado';
    setTimeout(() => { btnCopiar.textContent = original; }, 2000);
  } catch {
    mostrarMensaje(msgZip, 'No se pudo copiar al portapapeles.', 'error');
  }
});