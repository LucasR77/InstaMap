# Spec: InstaMap Cloud, Dashboard Jerárquico, Parser DOCX Robusto y Modo Estudio

> **Status:** Agreed / Ready for Execution  
> **Standard:** Matt Pocock's `/to-spec` workflow

---

## 1. Problem Statement

Actualmente, **InstaMap** funciona únicamente como una aplicación cliente local y aislada:
- No cuenta con autenticación ni persistencia multi-dispositivo; todo depende del `localStorage` del navegador.
- No existe un Dashboard ni organización en carpetas: los mapas no se pueden listar, clasificar en categorías ni mover.
- El parser de archivos `.docx` falla ante documentos Word reales: la mayoría de los usuarios no aplican estilos formales ("Heading 1", "Título 1"), sino negritas sueltas, mayúsculas sostenidas y numeraciones (`1.1`, `Capítulo I`, números romanos), lo que genera bloques de texto monolíticos sin jerarquía. Las tablas Word tampoco se transforman en ramas interactivas.
- No es posible agregar o eliminar nodos manualmente desde la interfaz gráfica si el usuario quiere expandir o podar el mapa.
- En el panel de lectura lateral, ciertos títulos de párrafo con itálicas o guiones bajos quedan mal formateados como `_titulo_:`, y las expresiones matemáticas en LaTeX se visualizan rotas debido a la ausencia de los estilos CSS de KaTeX y a delimitadores no normalizados.

---

## 2. Solution Overview

Transformar **InstaMap** en una plataforma completa de mapas mentales y estudio en la nube:
1. **Autenticación Híbrida (Supabase Auth)**: Permite a los usuarios invitados usar el editor en modo local/demo, y a los usuarios registrados (Email/Contraseña + Google OAuth) almacenar automáticamente sus mapas en la nube.
2. **Dashboard de Mapas y Carpetas**: Vista principal con árbol de carpetas infinitamente anidable, listado de mapas con estadísticas de dominio, buscador, movimiento entre carpetas y eliminación.
3. **Auto-guardado Continuo**: Sincronización transparente con PostgreSQL y Row Level Security (RLS) con indicador en tiempo real (`Guardado` / `Guardando...`).
4. **Parser DOCX Inteligente**: Motor heurístico que reconoce títulos y subtítulos por mayúsculas, negritas huérfanas, numeraciones jerárquicas y números romanos, además de transformar tablas de Word en subramas estructuradas.
5. **Manipulación Manual del Grafo**: Creación manual de nodos (hijos y ramas principales) desde la barra flotante, el panel lateral y atajos de teclado (`Tab`, `Ctrl+Enter`), junto con eliminación segura de nodos.
6. **Corrección de Renderizado Lateral & LaTeX**: Incorporación de `katex.min.css`, normalización de delimitadores matemáticos (`$...$`, `$$...$$`, `\(...\)`, `\[...\]`) y limpieza de prefijos `_titulo_:` / `*titulo*:`.
7. **Modo Flashcards & Enlace Público**: Mazo de estudio activo para repasar conceptos del mapa y generación de enlaces de solo lectura compartibles.

---

## 3. Seams Before Prose (Testing & Verification Seams)

Se definen los siguientes **seams** estrictos donde se verificará el comportamiento del sistema:

| Seam ID | Componente / Límite | Comportamiento esperado verificado en el seam |
|---|---|---|
| **SEAM-DOCX** | `parseDocx(buffer)` | Entrada: archivo `.docx` con negritas numeradas (`1.1`), títulos en mayúsculas y tablas Word.<br>Salida: Markdown estructurado con niveles `#`, `##`, `###` y tablas en sintaxis GFM. |
| **SEAM-LATEX** | `MarkdownViewer` / `normalizeContent` | Entrada: texto con fórmulas `\(x^2\)`, `\[\sum i\]` o `_hipótesis_:`.<br>Salida: elementos KaTeX renderizados con tipografía matemática correcta y encabezados limpios sin guiones bajos residuales. |
| **SEAM-GRAPH** | `useGraphState` (`addNewNode`, `deleteNode`) | Invocación de `addNewNode(parentId, label)` genera un nuevo subnodo hijo con ID único, preserva el árbol existente, actualiza `rawMarkdown` y emite evento de re-layout. |
| **SEAM-AUTH** | `useAuth` / `SupabaseClient` | Manejo de sesión persistente, login con credenciales válidas, logout y fallback transparente a modo invitado (`local`). |
| **SEAM-DB-SYNC** | `useGraphState` ↔ `maps` table | Modificaciones en el editor disparan auto-guardado con debounce de 800ms solo si `user` está autenticado, actualizando `updated_at` e informando estado `saving` → `saved`. |
| **SEAM-DASHBOARD** | `useDashboardState` | Creación de carpetas anidadas (`parent_id`), navegación breadcrumbs, filtrado en memoria/consulta y borrado de mapa con confirmación. |

---

## 4. Implementation Decisions

### A. Backend & Persistencia (Supabase)
- **Motor**: Supabase PostgreSQL alojado en región `sa-east-1`.
- **Esquema**:
  - `folders`: `id (uuid)`, `user_id (uuid)`, `parent_id (uuid, nullable)`, `name (text)`, `color (text)`, `created_at`, `updated_at`.
  - `maps`: `id (uuid)`, `user_id (uuid)`, `folder_id (uuid, nullable)`, `title (text)`, `raw_markdown (text)`, `mastered_node_ids (jsonb)`, `layout_direction (text)`, `is_public (boolean)`, `share_slug (text, unique)`, `created_at`, `updated_at`.
- **Seguridad**: RLS activado con políticas:
  - `select, insert, update, delete` para `auth.uid() = user_id`.
  - `select` público para `maps` donde `is_public = true`.

### B. Enrutamiento y Experiencia de Usuario
- Arquitectura SPA con vistas:
  - `dashboard`: Vista principal por defecto al iniciar sesión.
  - `editor`: Lienzo interactivo (abierto desde un mapa del dashboard o en modo local).
  - `share`: Vista de solo lectura al acceder a un enlace público.
- El header siempre cuenta con un botón para alternar entre el mapa actual y el Dashboard (`← Mis Mapas`), además de un indicador visual de guardado.

### C. Parser DOCX
- Ampliación de `DOCX_STYLE_MAP` con sinónimos en español e inglés.
- Pre-procesador sobre Mammoth para tablas: convertir elementos HTML `<table>` generados por Mammoth a Markdown con pipes (`|`), permitiendo que `extractParagraphAndBulletSubnodes` los parsee como nodos hijos detallados.
- Regla regex para títulos:
  - Detectar líneas cortas (< 80 caracteres) totalmente en mayúsculas precedidas y seguidas por saltos de línea (ej. `INTRODUCCIÓN`, `MARCO TEÓRICO`).
  - Detectar prefijos de numeración formal: `1.`, `1.1`, `2.1.3`, `Capítulo \d+`, números romanos (`I.`, `II.`, `IV.`).

### D. Manipulación de Nodos y Markdown
- Función `addNewNode(parentId?, initialLabel?, initialContent?)`:
  - Si `parentId` está definido: agrega un subnodo hijo en el árbol y actualiza el Markdown (`- **Nuevo Concepto**: descripción` bajo la sección correspondiente).
  - Si `parentId` no está definido: agrega una nueva sección raíz (`## Nuevo Tema`).
- Función `deleteNode(nodeId)`: elimina el subárbol a partir de `nodeId` y regenera el Markdown limpio mediante `exportTreeToMarkdown`.

### E. Renderizado Lateral y LaTeX
- Importar `katex/dist/katex.min.css` en `src/main.tsx`.
- Normalizar delimitadores:
  - Convertir `\(` y `\)` en `$`.
  - Convertir `\[` y `\]` en `$$`.
  - Escapar dólares en contextos de moneda (`\$`).
- Normalizar subtítulos de párrafos:
  - Reemplazar patrones `^_([^_]+)_:` o `^\*([^*]+)\*:` por `**$1**:`.

### F. Modo Estudio (Flashcards)
- Modal que itera sobre los nodos de tipo concepto/subtema del mapa cargado.
- Frente: `node.label`.
- Dorso: contenido markdown del nodo (`cleanNodeBody`).
- Botones para marcar "Dominado" o "Repasar", sincronizando en vivo con `masteredNodeIds`.

---

## 5. Out of Scope (Decisiones Deliberadamente Excluidas)

- **Asistentes o llamadas a modelos de IA generativa**: Deliberadamente excluidos para evitar consumo innecesario de tokens y costos de API.
- **Edición colaborativa en tiempo real tipo Google Docs / CRDTs (Yjs)**: Se utiliza bloqueo de usuario único con auto-guardado en base de datos.
- **Importador de PDFs complejos con OCR**: Se mantiene el foco en `.docx` y Markdown de alta fidelidad.
- **Cobros / Pasarela de pagos**: La plataforma es libre para el usuario sin restricciones de suscripción en esta etapa.

---

## 6. Acceptance Criteria

- [ ] Un usuario no autenticado puede entrar y usar el mapa de muestra o subir un `.docx` (modo invitado local).
- [ ] Un usuario puede registrarse e iniciar sesión con Supabase Auth.
- [ ] Al iniciar sesión, se muestra el Dashboard con las carpetas y mapas del usuario.
- [ ] El usuario puede crear carpetas, subcarpetas, mover mapas y eliminar mapas.
- [ ] Las modificaciones en el editor se guardan automáticamente en Supabase con indicador en vivo.
- [ ] Al subir un archivo `.docx` con mayúsculas, numeración `1.1` o tablas, se generan ramas limpias y estructuradas sin amalgamarse en bloques gigantes.
- [ ] El usuario puede agregar un nodo hijo o rama con un click o atajo, y puede eliminarlo.
- [ ] Las fórmulas matemáticas en LaTeX se visualizan con tipografía e íconos matemáticos correctos sin errores de CSS ni delimitadores rotos.
- [ ] Los títulos de párrafos como `_titulo_:` se renderizan formateados como `**titulo**:`.
- [ ] El modal de Flashcards permite repasar y marcar nodos como dominados.
- [ ] Se puede generar un enlace público y abrir el mapa en modo de solo lectura sin iniciar sesión.
