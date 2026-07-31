# API Changes — v2.3.0 → v3.0.0

> Documento orientado al frontend para actualizar la integración con la API.

---

## Resumen

| Versión | Fecha | Impacto API |
|---------|-------|-------------|
| 2.3.0 | 2026-04-22 | — |
| 2.3.1 | 2026-05-01 | 🔧 Bugfix PDF |
| 2.3.2 | 2026-05-09 | Sin cambios en API |
| 2.4.0 | 2026-07-08 | Sin cambios en API |
| 2.4.1 | 2026-07-18 | Sin cambios en API |
| 2.5.0 | 2026-07-20 | Sin cambios en API |
| **3.0.0** | **2026-07-25** | **⚠️ Nuevo `doc_type="multifile"`** |

---

## Cambio principal en 3.0.0

### Nuevo tipo de documento: `multifile`

El endpoint `POST /api/upload-zip` ahora acepta `doc_type="multifile"`.

**Antes (v2.3.0 — v2.5.0):**
```
doc_type: "markdown" | "pdf" | "word"
```

**Ahora (v3.0.0):**
```
doc_type: "markdown" | "pdf" | "word" | "multifile"
```

#### Comportamiento

| doc_type | Respuesta | Contenido |
|----------|-----------|-----------|
| `markdown` | Archivo `.md` (descarga) | Documentación consolidada |
| `pdf` | Archivo `.pdf` (descarga) | Documentación consolidada |
| `word` | Archivo `.docx` (descarga) | Documentación consolidada |
| `multifile` | Archivo `.zip` (descarga) | N archivos `.md` (uno por chunk) |

#### Formato de la respuesta (`multifile`)

```
Content-Type: application/zip
Content-Disposition: attachment; filename="documentacion_multifile_20260725_1430.zip"
```

El `.zip` contiene uno o más archivos `.md` nombrados según los módulos que documentan:

```
documentacion_multifile_20260725_1430.zip
├── main.md
├── auth+db.md
├── api_routes+controllers.md
└── utils_validate.md
```

Cada `.md` contiene la documentación de un grupo lógico de archivos (un chunk).

#### Petición de ejemplo

```bash
curl -X POST http://localhost:5000/api/upload-zip \
  -F "file=@proyecto.zip" \
  -F "doc_type=multifile" \
  -F "extra_requirements=Incluir tablas de errores" \
  -F "language=es"
```

#### Manejo desde el frontend

```javascript
// Ejemplo con fetch
const formData = new FormData();
formData.append('file', zipFile);
formData.append('doc_type', 'multifile');
formData.append('language', 'es');

const response = await fetch('/api/upload-zip', {
  method: 'POST',
  body: formData,
});

if (response.ok) {
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `documentacion_multifile_${getDateString()}.zip`;
  a.click();
}
```

---

## Endpoints (sin cambios desde 2.3.0)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/` | Información de la API |
| `GET` | `/api/download` | Info de endpoints de descarga |
| `POST` | `/api/download/<file_type>` | Documentar código pegado |
| `POST` | `/api/preview-zip` | Previsualizar contenido de ZIP |
| `POST` | `/api/upload-zip` | Documentar proyecto desde ZIP |

---

## Parámetros comunes (sin cambios)

### `POST /api/download/<file_type>`

```json
// Content-Type: application/json
{
  "codigo": "def hello(): ...",
  "extra": "Incluir ejemplos de uso",
  "language": "es"
}
```

| Campo | Tipo | Obligatorio | Default |
|-------|------|-------------|---------|
| `codigo` | string | ✅ | — |
| `extra` | string | ❌ | `""` |
| `language` | string | ❌ | auto-detect (`"es"` o `"en"`) |

**Idioma también aceptado vía header `Accept-Language`:**
```http
Accept-Language: en
Accept-Language: es
```
Si `language` no se envía en el body, se lee de `Accept-Language`. Si ninguno está presente, se usa detección automática por heurística de palabras clave en el código fuente.

`<file_type>` acepta: `markdown`, `pdf`, `word`.

### `POST /api/upload-zip`

```yaml
# Content-Type: multipart/form-data
file: <binario>
doc_type: "multifile"
extra_requirements: "Incluir tablas de errores"
language: "es"
```

| Campo | Tipo | Obligatorio | Default |
|-------|------|-------------|---------|
| `file` | file | ✅ | — |
| `doc_type` | string | ❌ | `"markdown"` |
| `extra_requirements` | string | ❌ | `""` |
| `language` | string | ❌ | auto-detect |

**Idioma también aceptado vía header `Accept-Language`:**
```http
Accept-Language: en
Accept-Language: es
```
Si `language` no se envía en el form, se lee de `Accept-Language`. Si ninguno está presente, se usa detección automática.

`doc_type` acepta: `markdown`, `pdf`, `word`, **`multifile`** (nuevo).

---

## Códigos de error (sin cambios desde 2.3.0)

| HTTP | `codigo_error` | Causa |
|------|----------------|-------|
| 400 | `NO_FILE` | No se envió archivo |
| 400 | `INVALID_FILE_TYPE` | No es `.zip` |
| 400 | `FILE_TOO_LARGE` | Excede 10MB |
| 400 | `EMPTY_FILE` | ZIP vacío |
| 400 | `INVALID_DOC_TYPE` | `doc_type` no válido |
| 400 | `VALIDATION_ERROR` | Error de validación |
| 500 | `PROCESSING_ERROR` | Error interno al procesar |

---

## Mejoras internas (sin impacto en API)

- **v2.4.0**: Chunking con split de archivos grandes. Backoff exponencial en reintentos de API.
- **v2.5.0**: Provider abstraction layer (`BaseAIProvider`). Preparado para múltiples proveedores de IA.
- **v3.0.0**: Skip de consolidación en modo multifile. Nombres de archivo descriptivos por chunk.

---

## Historial de versiones de API

| Versión API | `API_VERSION` en `/` |
|-------------|---------------------|
| 2.3.0 — 2.4.1 | `"2.4.1"` |
| 2.5.0 | `"2.5.0"` |
| 3.0.0 | `"3.0.0"` (pendiente de actualizar en `main.py`) |
