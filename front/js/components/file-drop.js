import { setVisible, showMessage } from '../core/ui.js';

export function createFileDrop({ input, dropZone, filenameElement, messageElement, onFile, validate }) {
  function handleFile(file) {
    if (validate && !validate(file)) return;

    filenameElement.textContent = `${file.type === 'application/zip' ? '📦' : '📄'} ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
    setVisible(filenameElement, true);
    setVisible(messageElement, false);
    onFile(file);
  }

  input.addEventListener('change', () => {
    if (input.files.length > 0) handleFile(input.files[0]);
  });

  dropZone.addEventListener('dragover', event => {
    event.preventDefault();
    dropZone.classList.add('drop-zone--over');
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('drop-zone--over');
  });

  dropZone.addEventListener('drop', event => {
    event.preventDefault();
    dropZone.classList.remove('drop-zone--over');

    const [file] = event.dataTransfer.files;
    if (file) handleFile(file);
  });

  return {
    showError(message) {
      showMessage(messageElement, message, 'error');
    }
  };
}
