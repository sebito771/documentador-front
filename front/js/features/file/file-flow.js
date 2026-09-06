import { apiClient } from '../../core/api-client.js';
import { createFileDrop } from '../../components/file-drop.js';
import { downloadBlob, getFilename, setLoading, setVisible, showMessage } from '../../core/ui.js';

export function initFileFlow() {
  const elements = {
    input: document.getElementById('input-archivo'),
    dropZone: document.getElementById('drop-zone-archivo'),
    filename: document.getElementById('nombre-archivo-suelto'),
    formatSelect: document.getElementById('select-formato-archivo'),
    extraInput: document.getElementById('input-extra-archivo'),
    button: document.getElementById('btn-descargar-archivo'),
    buttonLabel: document.getElementById('btn-descargar-archivo-text'),
    spinner: document.getElementById('spinner-archivo'),
    message: document.getElementById('msg-archivo')
  };

  let selectedFile = null;

  createFileDrop({
    input: elements.input,
    dropZone: elements.dropZone,
    filenameElement: elements.filename,
    messageElement: elements.message,
    onFile(file) {
      selectedFile = file;
      elements.button.disabled = false;
    }
  });

  elements.button.addEventListener('click', async () => {
    if (!selectedFile) return;

    const format = elements.formatSelect.value;
    const extra = elements.extraInput.value.trim();
    setLoading(elements.button, elements.buttonLabel, elements.spinner, true);
    setVisible(elements.message, false);

    try {
      const blob = await apiClient.generateFromFile(selectedFile, format, extra);
      const filename = getFilename(format);
      downloadBlob(blob, filename);
      showMessage(elements.message, `¡Documentación generada! Descargando ${filename}...`, 'success');
    } catch (error) {
      showMessage(elements.message, `Error: ${error.message}`, 'error');
    } finally {
      setLoading(elements.button, elements.buttonLabel, elements.spinner, false);
    }
  });
}
