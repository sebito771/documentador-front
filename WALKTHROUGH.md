# Walkthrough — API v3.0.0 Frontend Migration

## Problemas corregidos

### `docx` vs `word` (API contract mismatch)

Los `<select>` del HTML enviaban `value="docx"` pero la API espera `"word"`. Esto causaba que la extensión `.docx` nunca se asignara correctamente (caía al default `md`).

**Cambio:** Los 3 selects (`#select-formato`, `#select-doc-type`, `#select-formato-archivo`) ahora usan `value="word"`.

---

## Nuevas features

### 1. `multifile` en panel ZIP

Se agregó `<option value="multifile">` al `<select id="select-doc-type">` en el panel ZIP.

- Solo disponible en el flujo ZIP (los endpoints `/api/download/<file_type>` no soportan `multifile`)
- Al seleccionarlo y generar, la API devuelve un `.zip` con múltiples `.md`

### 2. Helper `getExtension(docType)` — `index.js:60`

Centraliza el mapping `docType → extensión de archivo`:

```js
pdf       → .pdf
word      → .docx
markdown  → .md
multifile → .zip
```

Antes estaba duplicado inline en 3 lugares con lógica condicional.

### 3. Helper `getNombreArchivo(docType)` — `index.js:65`

Genera el nombre de descarga según el tipo:

| docType | Formato nombre |
|---------|---------------|
| Normal  | `documentacion_YYYY-MM-DD.ext` |
| `multifile` | `documentacion_multifile_YYYYMMDD_HHmm.zip` |

### 4. Campo `language` en ZIP upload — `index.js:436`

Ahora se envía `formData.append('language', ...)` con el código ISO del navegador (`navigator.language` → `"es"`, `"en"`, etc.).

---

## Archivos modificados

| Archivo | Cambios |
|---------|---------|
| `front/index.html:58,114,160` | `docx` → `word` en 3 selects |
| `front/index.html:115` | Nueva option `multifile` en panel ZIP |
| `front/index.js:60-78` | Nuevas funciones `getExtension` y `getNombreArchivo` |
| `front/index.js:145` | Flow 1 usa `getNombreArchivo(formato)` |
| `front/index.js:436,451` | Flow 2: envía `language`, usa `getNombreArchivo` |
| `front/index.js:534` | Flow 3 usa `getNombreArchivo(formato)` |
