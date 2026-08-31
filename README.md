# InstaMap 🧠⚡

**InstaMap** es una aplicación web interactiva de alto rendimiento diseñada para transformar apuntes y documentos estructurados (Markdown, Texto plano y Microsoft Word `.docx`) en mapas conceptuales y diagramas radiales interactivos al instante.

## ✨ Características Principales

- 🗺️ **Generación Instantánea de Mapas**: Convierte encabezados (`# H1`, `## H2`, `### H3`) y viñetas en grafos estructurados automáticamente con Dagre layout.
- ⚡ **Soporte Multiformato**:
  - Archivos Markdown (`.md`, `.markdown`)
  - Archivos de texto plano (`.txt`)
  - Documentos de Microsoft Word (`.docx`) procesados 100% en el cliente con Mammoth.js
  - Entrada directa mediante editor o pegado de texto
- 📖 **Panel de Lectura y Edición**: Visualización en vivo de contenido enriquecido con soporte para fórmulas matemáticas KaTeX ($E=mc^2$) y bloques de código con syntax highlighting.
- 🎯 **Seguimiento de Progreso y Aprendizaje**: Marcado de nodos dominados, métricas de palabras y tiempo de lectura estimado, con celebración por confetti al completar el 100%.
- 📤 **Exportación Profesional**: Descarga tu mapa mental en formatos PNG (2x HD), SVG vectorial, Markdown limpio o JSON estructurado.
- 🔒 **100% Privado y Local**: Todo el procesamiento se realiza en el navegador web del usuario, sin enviar información a servidores externos.

## 🚀 Tecnologías

- **React 19** + **TypeScript** + **Vite**
- **@xyflow/react (React Flow)** para la renderización y manipulación de grafos
- **@dagrejs/dagre** para el cálculo algorítmico de jerarquías y layouts
- **Tailwind CSS v4** con diseño moderno, glassmorphism y microinteracciones
- **Lucide Icons**
- **Mammoth.js**, **React Markdown**, **KaTeX**, **Highlight.js**, **Canvas Confetti**

## 🛠️ Desarrollo Local

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Compilar para producción
npm run build
```
