import { API_BASE } from '../config/api-config.js';

async function parseError(response, fallbackMessage) {
  try {
    const data = await response.json();
    return data.error || fallbackMessage;
  } catch {
    return fallbackMessage;
  }
}

async function requestBlob(url, options, fallbackMessage) {
  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error(await parseError(response, fallbackMessage));
  }

  return response.blob();
}

async function requestJson(url, options, fallbackMessage) {
  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error(await parseError(response, fallbackMessage));
  }

  return response.json();
}

function createFormData(fields) {
  const formData = new FormData();

  Object.entries(fields).forEach(([name, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      formData.append(name, value);
    }
  });

  return formData;
}

export const apiClient = {
  generateFromCode(code, format, extra) {
    const payload = { code };
    if (extra) payload.extra_requirements = extra;

    return requestBlob(`${API_BASE}/download/${format}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }, 'Error al generar la documentación');
  },

  previewZip(file) {
    const formData = createFormData({ file });

    return requestJson(`${API_BASE}/preview-zip`, {
      method: 'POST',
      body: formData
    }, 'Error al previsualizar el ZIP');
  },

  generateFromZip(file, docType, extra, language) {
    const formData = createFormData({
      file,
      doc_type: docType,
      extra_requirements: extra,
      language
    });

    return requestBlob(`${API_BASE}/upload-zip`, {
      method: 'POST',
      body: formData
    }, 'Error al procesar el ZIP');
  },

  generateFromFile(file, format, extra) {
    const formData = createFormData({ file, extra });

    return requestBlob(`${API_BASE}/download/${format}`, {
      method: 'POST',
      body: formData
    }, 'Error al generar la documentación');
  }
};
