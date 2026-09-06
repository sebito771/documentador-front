const LANGUAGE_COLORS = {
  js: '#f7df1e', ts: '#3178c6', py: '#3572a5', java: '#b07219', go: '#00add8',
  php: '#4f5d95', css: '#563d7c', html: '#e34c26', json: '#292929', xml: '#0060ac',
  yml: '#cb171e', yaml: '#cb171e'
};

export function renderZipPreview(container, data) {
  container.innerHTML = '';
  const files = Array.isArray(data) ? data : (data.archivos || data.files || []);

  if (files.length === 0) {
    container.innerHTML = '<p style="color:var(--text-dim);font-size:.78rem">El ZIP está vacío o no contiene archivos reconocibles.</p>';
    container.classList.remove('hidden');
    return;
  }

  const validCount = files.filter(file => file.valid === undefined || file.valid).length;
  const invalidCount = files.length - validCount;
  const summary = document.createElement('div');
  summary.style.cssText = 'display:flex;gap:14px;margin-bottom:8px;font-size:.75rem;font-family:IBM Plex Mono,monospace;color:var(--text-dim,#888)';
  summary.innerHTML = `<span>📦 <strong style="color:var(--text)">${files.length}</strong> archivos totales</span><span>✅ <strong style="color:#4ade80">${validCount}</strong> procesables</span>${invalidCount ? `<span>⛔ <strong style="color:#f87171">${invalidCount}</strong> ignorados</span>` : ''}`;

  const list = document.createElement('div');
  list.className = 'file-preview-list';
  list.style.cssText = 'display:flex;flex-direction:column;gap:6px;';
  files.forEach(file => list.appendChild(createFileItem(file)));

  container.append(summary, list);
  container.classList.remove('hidden');
}

function createFileItem(file) {
  const name = file.file || file.nombre || file.name || '(desconocido)';
  const language = (file.language || '').toLowerCase();
  const valid = file.valid === undefined || file.valid;
  const size = file.size || '';
  const parts = name.split('/');
  const filename = parts.pop();
  const directory = parts.length ? `${parts.join('/')}/` : '';
  const item = document.createElement('div');
  const badgeColor = LANGUAGE_COLORS[language] || '#888';
  const textColor = ['js', 'yml', 'yaml'].includes(language) ? '#222' : '#fff';

  item.style.cssText = `display:flex;align-items:center;gap:10px;padding:7px 10px;border-radius:6px;background:${valid ? 'var(--surface,#1a1a2e)' : 'rgba(255,80,80,.05)'};border:1px solid ${valid ? 'var(--border,#2a2a3e)' : 'rgba(255,80,80,.2)'};font-size:.78rem;font-family:IBM Plex Mono,monospace;opacity:${valid ? '1' : '.6'}`;
  item.innerHTML = `<span title="${valid ? 'Será procesado' : 'No será procesado (extensión no soportada)'}" style="font-size:1rem;flex-shrink:0">${valid ? '✅' : '⛔'}</span><span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${name}"><span style="color:var(--text-dim,#666)">${directory}</span><span style="color:var(--text,#eee);font-weight:500">${filename}</span></span>${language ? `<span style="background:${badgeColor};color:${textColor};padding:2px 7px;border-radius:4px;font-size:.68rem;font-weight:600;flex-shrink:0;letter-spacing:.5px;text-transform:uppercase">${language}</span>` : ''}${size ? `<span style="color:var(--text-dim,#888);flex-shrink:0;min-width:52px;text-align:right">${size}</span>` : ''}`;
  return item;
}
