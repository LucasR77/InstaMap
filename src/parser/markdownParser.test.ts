import { describe, it, expect } from 'vitest'
import { parseMarkdown } from './markdownParser'

describe('markdownParser: Extraction of Subnodes from Bold Definition Texts', () => {
  it('extracts all 5 subnodes from text with __Term: __ definitions without # headers', () => {
    const rawText = `La confiabilidad global de una solución distribuida no es un atributo unidimensional, sino un compendio de propiedades técnicas interconectadas:

__Disponibilidad (Availability): __Mide la probabilidad de que el sistema se encuentre en estado operativo y listo para atender peticiones en un instante de tiempo determinado (métrica puntual en tiempo real).

__Confiabilidad (Reliability): __Mide la probabilidad de que el sistema opere de forma continua y correcta, sin sufrir interrupciones, a lo largo de un intervalo temporal definido. Se mide a través del Tiempo Medio Entre Fallas (MTBF) y se expresa usualmente en porcentajes de tiempo de actividad (uptime), tales como el estándar 'Four Nines' (99.99%), equivalente a menos de 52.6 minutos de caída no programada acumulada al año.

__Seguridad Funcional (Safety): __Garantiza que, ante una falla inevitable de infraestructura, el sistema transicione de manera controlada hacia un estado seguro (fail-safe) sin corromper la integridad de los datos ni requerir la intervención manual urgente de desarrolladores o administradores que deban manipular bases de datos y servidores de producción en caliente.

__Seguridad y Protección (Security): __Conjunto de barreras defensivas estructuradas en cuatro pilares: Autenticación (verificación de identidad de actores), Autorización (control de permisos basado en el principio de mínimo privilegio), Auditoría (registro inmutable de acciones realizadas) y Cifrado (protección de datos en reposo y en tránsito).

__Resiliencia y Redundancia Efectiva: __La redundancia física no es garantía de confiabilidad por sí misma. Mantener réplicas pasivas de un servidor o de una base de datos es inútil si el software carece de mecanismos coordinados de supervisión de salud (heartbeats), detección precisa de caídas y protocolos de elección de líderes para ejecutar la conmutación por error (failover) de forma totalmente automatizada.`

    const tree = parseMarkdown(rawText, 'Confiabilidad en Sistemas Distribuidos')
    expect(tree.length).toBe(1)
    const root = tree[0]

    expect(root.label).toBe('Confiabilidad en Sistemas Distribuidos')
    expect(root.content).toContain('La confiabilidad global de una solución distribuida')

    // Must have 5 subnodes
    expect(root.children.length).toBe(5)

    const labels = root.children.map((c) => c.label)
    expect(labels).toEqual([
      'Disponibilidad (Availability)',
      'Confiabilidad (Reliability)',
      'Seguridad Funcional (Safety)',
      'Seguridad y Protección (Security)',
      'Resiliencia y Redundancia Efectiva'
    ])

    // Verify bodies
    expect(root.children[0].content).toContain('Mide la probabilidad de que el sistema se encuentre en estado operativo')
    expect(root.children[1].content).toContain('Tiempo Medio Entre Fallas (MTBF)')
    expect(root.children[2].content).toContain('fail-safe')
    expect(root.children[3].content).toContain('Autenticación')
    expect(root.children[4].content).toContain('heartbeats')
  })

  it('handles **Term:** and bulleted - __Term: __ properly under sections and root', () => {
    const rawText = `# Conceptos de Redes

**Latencia:** Tiempo que tarda un paquete en viajar de origen a destino.
**Ancho de Banda:** Capacidad máxima de transferencia de un canal.`

    const tree = parseMarkdown(rawText, 'Conceptos de Redes')
    expect(tree[0].children.length).toBe(2)
    expect(tree[0].children[0].label).toBe('Latencia')
    expect(tree[0].children[1].label).toBe('Ancho de Banda')
  })

  it('retains definition paragraphs when followed by a markdown table instead of swallowing them', () => {
    const rawText = `## Principios Arquitectónicos REST

Sin estado (Stateless): Cada petición del cliente al servidor debe contener toda la información necesaria para comprender y procesar la petición.

| Operación HTTP | Función Principal en REST | Idempotencia |
| --- | --- | --- |
| GET | Consultar datos | Sí |
| POST | Crear un nuevo recurso | No |`

    const tree = parseMarkdown(rawText, 'Arquitectura')
    const restSection = tree[0].children[0]
    expect(restSection.label).toBe('Principios Arquitectónicos REST')

    const statelessNode = restSection.children.find((c) => c.label.includes('Sin estado'))
    expect(statelessNode).toBeDefined()
    expect(statelessNode?.content).toContain('Cada petición del cliente al servidor')
  })

  it('decomposes table into intermediate container, rows, and attribute sub-subnodes subordinate to definition', () => {
    const rawText = `## Principios Arquitectónicos REST

Sin estado (Stateless): Cada petición del cliente al servidor debe contener toda la información necesaria para comprender y procesar la petición.

| Operación HTTP | Función Principal en REST | Idempotencia |
| --- | --- | --- |
| GET | Consultar datos sin efectos secundarios | Sí |
| POST | Crear un nuevo recurso | No |
| PUT | Actualizar completamente o crear un recurso | Sí |
| DELETE | Eliminar un recurso | Sí |`

    const tree = parseMarkdown(rawText, 'Arquitectura')
    const restSection = tree[0].children[0]
    expect(restSection.label).toBe('Principios Arquitectónicos REST')
    expect(restSection.level).toBe(2)

    // 1. Definition node is created at level 3
    const statelessNode = restSection.children.find((c) => c.label.includes('Sin estado'))
    expect(statelessNode).toBeDefined()
    expect(statelessNode!.level).toBe(3)
    expect(statelessNode!.isLeaf).toBe(false)
    expect(statelessNode!.content).toContain('Cada petición del cliente al servidor')

    // 2. Table intermediate container is nested under definition at level 4
    expect(statelessNode!.children.length).toBe(1)
    const tableContainer = statelessNode!.children[0]
    expect(tableContainer.label).toBe('Operación HTTP')
    expect(tableContainer.level).toBe(4)
    expect(tableContainer.parentId).toBe(statelessNode!.id)
    expect(tableContainer.children.length).toBe(4)

    // 3. Rows are children of container at level 5
    const rowLabels = tableContainer.children.map((c) => c.label)
    expect(rowLabels).toEqual(['GET', 'POST', 'PUT', 'DELETE'])

    const getRow = tableContainer.children[0]
    expect(getRow.label).toBe('GET')
    expect(getRow.level).toBe(5)
    expect(getRow.parentId).toBe(tableContainer.id)
    expect(getRow.children.length).toBe(2)

    // 4. Attribute sub-subnodes at level 6
    const getAttributes = getRow.children
    expect(getAttributes[0].label).toBe('Función Principal en REST: Consultar datos sin efectos secundarios')
    expect(getAttributes[0].level).toBe(6)
    expect(getAttributes[0].parentId).toBe(getRow.id)
    expect(getAttributes[0].isLeaf).toBe(true)

    expect(getAttributes[1].label).toBe('Idempotencia: Sí')
    expect(getAttributes[1].level).toBe(6)
    expect(getAttributes[1].parentId).toBe(getRow.id)
    expect(getAttributes[1].isLeaf).toBe(true)

    // 5. Column headers are NOT sibling cards
    const allLabels = restSection.children.map((c) => c.label)
    expect(allLabels).not.toContain('Operación HTTP')
    expect(allLabels).not.toContain('Función Principal en REST')
    expect(allLabels).not.toContain('Idempotencia')
  })

  it('attaches table container directly to section when no preceding definition paragraph exists', () => {
    const rawText = `## Métodos HTTP

| Operación HTTP | Función Principal en REST | Idempotencia |
| --- | --- | --- |
| GET | Consultar datos | Sí |
| POST | Crear recurso | No |`

    const tree = parseMarkdown(rawText, 'Protocolo HTTP')
    const methodsSection = tree[0].children[0]
    expect(methodsSection.label).toBe('Métodos HTTP')

    // Container attaches directly to section at level 3
    expect(methodsSection.children.length).toBe(1)
    const tableContainer = methodsSection.children[0]
    expect(tableContainer.label).toBe('Operación HTTP')
    expect(tableContainer.level).toBe(3)
    expect(tableContainer.parentId).toBe(methodsSection.id)

    // Rows attach to container at level 4
    expect(tableContainer.children.length).toBe(2)
    expect(tableContainer.children[0].label).toBe('GET')
    expect(tableContainer.children[0].level).toBe(4)
    expect(tableContainer.children[1].label).toBe('POST')
    expect(tableContainer.children[1].level).toBe(4)

    // Attributes attach to row at level 5
    expect(tableContainer.children[0].children.length).toBe(2)
    expect(tableContainer.children[0].children[0].label).toBe('Función Principal en REST: Consultar datos')
    expect(tableContainer.children[0].children[0].level).toBe(5)
    expect(tableContainer.children[0].children[1].label).toBe('Idempotencia: Sí')
    expect(tableContainer.children[0].children[1].level).toBe(5)
  })

  it('preserves text paragraphs succeeding a table within the same section', () => {
    const rawText = `## Sección Con Tabla y Conclusión

| Columna A | Columna B |
| --- | --- |
| Dato 1 | Dato 2 |

Esta es una conclusión importante que sucede a la tabla comparativa.`

    const tree = parseMarkdown(rawText, 'Documento')
    const sec = tree[0].children[0]
    expect(sec.label).toBe('Sección Con Tabla y Conclusión')
    expect(sec.content).toContain('Esta es una conclusión importante que sucede a la tabla comparativa.')
  })
})



