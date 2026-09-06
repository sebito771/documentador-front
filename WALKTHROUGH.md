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

### 2. Mapa de extensiones en `getFilename(docType)` — `front/js/core/ui.js`

Centraliza el mapping `docType → extensión de archivo`:

```js
pdf       → .pdf
word      → .docx
markdown  → .md
multifile → .zip
```

Antes estaba duplicado inline en 3 lugares con lógica condicional.

### 3. Generación de nombres en `getFilename(docType)` — `front/js/core/ui.js`

Genera el nombre de descarga según el tipo:

| docType | Formato nombre |
|---------|---------------|
| Normal  | `documentacion_YYYY-MM-DD.ext` |
| `multifile` | `documentacion_multifile_YYYYMMDD_HHmm.zip` |

### 4. Campo `language` en ZIP upload — `front/js/features/zip/zip-flow.js`

Ahora `zip-flow.js` obtiene el código ISO del navegador (`navigator.language` → `"es"`, `"en"`, etc.) y lo entrega al cliente HTTP para incluirlo en el `FormData`.

---

## Archivos modificados

| Archivo | Cambios |
|---------|---------|
| `front/index.html:58,114,160` | `docx` → `word` en 3 selects |
| `front/index.html:115` | Nueva option `multifile` en panel ZIP |
| `front/js/core/ui.js` | Centraliza `getFilename` y la descarga de blobs |
| `front/js/features/code/code-flow.js` | Flow 1 usa `getFilename(formato)` |
| `front/js/features/zip/zip-flow.js` | Flow 2 envía `language` y usa `getFilename` |
| `front/js/features/file/file-flow.js` | Flow 3 usa `getFilename(formato)` |

## Arquitectura modular

El frontend usa módulos ES con `front/js/app/main.js` como único punto de entrada. La configuración vive en `config`, el cliente HTTP y las utilidades compartidas en `core`, la interacción reutilizable en `components`, y cada flujo de usuario en `features`. Así, los cambios de API no requieren modificar los controladores de la interfaz.
