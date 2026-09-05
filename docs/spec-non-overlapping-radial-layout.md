# Spec: Disposición de Nodos Sin Superposición y Expansión Dinámica de Subnodos Hacia Afuera

> **Status:** Draft / Ready for Review  
> **Standard:** Matt Pocock's `/to-spec` workflow  
> **Target:** Layout Engine & Graph Canvas (`dagreLayout.ts`, `InteractiveGraph.tsx`)

---

## 1. Problem Statement

Actualmente en **InstaMap**, los nodos del mapa mental sufren de superposiciones visuales (solapamiento) tanto en el eje horizontal como en el vertical bajo diversos escenarios frecuentes:

1. **Colapso horizontal por niveles fijos**: El algoritmo actual en el motor de distribución calcula posiciones horizontales rígidas basadas en tres profundidades fijas (`depth1 = 300`, `depth2 = 640`, `depth3 = 980`). Todo nodo con nivel jerárquico 4 o superior (subconceptos, párrafos y hojas anidadas) se fija en `depth3`. En consecuencia, los nodos de nivel 4, nivel 5 y nivel 6 quedan apilados en la misma coordenada horizontal, superponiéndose por completo.
2. **Colisión vertical entre nodos hermanos**: El cálculo de la altura de cada nodo se basa en una heurística que subestima el tamaño real renderizado en el DOM cuando los títulos contienen texto multilínea, etiquetas de colapso (`+N`), casillas de verificación de maestría o variaciones de escala tipográfica (`fontSizeScale`). Esto provoca que nodos hermanos colisionen verticalmente.
3. **Superposición al expandir subnodos**: Cuando el usuario hace clic en el botón de expansión (`+N`) de un nodo colapsado, los subnodos resultantes aparecen sin desplazar adecuadamente a las ramas adyacentes, sobreescribiendo visualmente otros nodos del grafo.
4. **Falta de proyección hacia afuera**: Los subnodos no se proyectan de forma natural hacia el exterior respecto a su nodo padre; en ramas profundas o asimétricas, el árbol no distribuye los subárboles con suficiente holgura espacial.

---

## 2. Solution

Diseñar e implementar un motor de distribución con **proyección hacia afuera (outward expansion)** y **garantía de no superposición (zero-overlap guarantee)** para el mapa mental interactivo:

1. **Proyección Horizontal Dinámica por Generación**:
   - Cada nodo hijo calcula su posición horizontal en función de la coordenada y el ancho de su nodo padre inmediato más un espaciado horizontal configurado (`horizontalGap`).
   - En el hemisferio derecho: $X_{\text{hijo}} = X_{\text{padre}} + \text{ancho}_{\text{padre}} + \text{gap}_x$.
   - En el hemisferio izquierdo: $X_{\text{hijo}} = X_{\text{padre}} - \text{ancho}_{\text{hijo}} - \text{gap}_x$.
   - Soporte para profundidad ilimitada: los niveles 4, 5, 6 y sucesivos continúan expandiéndose hacia afuera sin límites artificiales ni colisiones axiales.

2. **Cálculo Recursivo de Bounding Box de Subárbol**:
   - El espacio vertical reservado para cualquier nodo visible corresponde al máximo entre su propia altura renderizada y la altura acumulada de todos sus subárboles hijos visibles más los espaciados verticales entre ellos.
   - Alineación centroide: cada nodo padre se centra verticalmente con respecto al bloque total que ocupan sus hijos. Si el padre es más alto que sus hijos, los hijos se centran verticalmente con respecto a él.

3. **Espaciado y Expansión Dinámica sin Solapamiento**:
   - Al expandir un nodo previamente colapsado, el árbol recalcula el tamaño del subárbol y desplaza las ramas adyacentes hacia afuera verticalmente, garantizando que ninguna caja delimitadora colisione con otra.
   - Se incorpora un margen de seguridad (`safetyPadding`) para asegurar legibilidad incluso con fuentes grandes o títulos extensos.

4. **Curvas de Conexión (Bézier Edges) Coherentes**:
   - Las conexiones entre nodos mantienen sus anclajes de salida (`source-right` / `source-left`) y llegada (`target-left` / `target-right`) apuntando siempre hacia afuera desde el centro hacia la periferia, evitando cruces antiestéticos de aristas.

---

## 3. Seams (Testing & Verification Seams)

Se define un **único seam de alto nivel** para el cálculo del layout, complementado con la verificación de renderizado en el canvas:

| Seam ID | Componente / Límite | Comportamiento esperado verificado en el seam |
|---|---|---|
| **SEAM-LAYOUT-ENGINE** | `getLayoutedElements(rootNodes, options)` | **Entrada:** Árbol de nodos (`ParsedNode[]`) con profundidades arbitrarias (niveles 1 a 6+), estados de colapso (`collapsedNodeIds`) y escala de tipografía.<br>**Salida:** Nodos (`CustomNodeType[]`) y aristas (`CustomEdgeType[]`) con posiciones $(x, y)$ calculadas.<br>**Invariantes Verificables:**<br>1. *No-Overlap:* Para cualquier par de nodos visibles $A$ y $B$, sus rectángulos delimitadores $[x, x + w] \times [y, y + h]$ no se intersectan (distancia mínima $\ge 0$).<br>2. *Outward Expansion:* Para todo par padre-hijo, en el lado derecho $x_{\text{hijo}} \ge x_{\text{padre}} + w_{\text{padre}}$, y en el lado izquierdo $x_{\text{hijo}} + w_{\text{hijo}} \le x_{\text{padre}}$.<br>3. *Expansion Clearance:* Alternar el estado de colapso de un nodo incrementa la distancia entre ramas hermanas sin introducir colisiones. |
| **SEAM-CANVAS-INTERACTION** | `<InteractiveGraph />` | Al interactuar con el botón de colapso/expansión (`+N`), el canvas recibe los nuevos nodos y aristas y ajusta la vista fluidamente sin saltos bruscos ni nodos desfasados. |

---

## 4. User Stories

1. **Como estudiante que revisa un tema con múltiples subniveles**, quiero que los conceptos de nivel 4 y 5 se desplieguen más hacia afuera que sus padres, para que no queden tapados ni encimados sobre los conceptos de nivel 3.
2. **Como usuario con un mapa mental denso**, quiero que las tarjetas de los nodos tengan suficiente separación vertical entre sí, para poder leer cada etiqueta sin que los bordes o sombras se toquen.
3. **Como estudiante que estudia un nodo específico**, quiero hacer clic en el botón `+3` de un nodo colapsado y ver que sus subnodos se abren hacia la derecha (o izquierda) empujando a los nodos hermanos hacia arriba y hacia abajo, para que el nuevo contenido tenga su propio espacio despejado.
4. **Como usuario que colapsa una rama**, quiero que los nodos hermanos adyacentes recuperen su posición compacta de forma ordenada, para optimizar el espacio visual en pantalla.
5. **Como estudiante que lee conceptos con títulos largos**, quiero que la altura calculada para cada nodo contemple el número real de líneas que ocupa el texto, para que las tarjetas de varias líneas no invadan el espacio del nodo inferior.
6. **Como usuario que aumenta el tamaño de la tipografía (A+)**, quiero que las distancias horizontales y verticales entre nodos se escalen proporcionalmente, para que el texto más grande no genere superposiciones.
7. **Como estudiante que reduce el tamaño de la tipografía (A-)**, quiero que los nodos se acerquen de manera compacta manteniendo la separación mínima requerida, para poder tener una vista panorámica del documento completo.
8. **Como usuario que crea un nuevo subnodo con el botón "+ Subnodo"**, quiero que el nuevo nodo aparezca posicionado ordenadamente hacia afuera de su nodo padre, sin sobreponerse con ningún nodo ya existente.
9. **Como usuario que pulsa "Expandir todo"**, quiero que todo el árbol se abra en abanico hacia afuera en ambos lados del nodo central, sin que ninguna rama de la izquierda ni de la derecha colisione.
10. **Como usuario que pulsa "Colapsar todo"**, quiero que el mapa se contraiga dejando visibles únicamente las ramas principales (Nivel 2) a ambos lados del nodo central, perfectamente centradas y simétricas.
11. **Como estudiante que marca un concepto como dominado**, quiero que el cambio de estilo visual (tachado y check verde) no altere las coordenadas ni cause temblores en la posición del nodo.
12. **Como usuario que visualiza mapas con ramas asimétricas** (por ejemplo, una rama con 10 hijos y otra con 1 solo), quiero que el árbol distribuya el espacio de manera independiente en cada lado sin forzar espacios vacíos gigantes ni aplastar las ramas densas.
13. **Como usuario que navega por el grafo**, quiero que las líneas conectoras curvas (Bézier) fluyan limpiamente de izquierda a derecha en el lado derecho y de derecha a izquierda en el lado izquierdo, sin atravesar las cajas de otros nodos.
14. **Como desarrollador del proyecto**, quiero contar con una suite de pruebas automatizadas que valide matemáticamente que ninguna caja de nodo intersecte a otra para cualquier archivo de prueba o nivel de anidamiento.

---

## 5. Implementation Decisions

- **Motor de Layout Basado en Bounding Boxes Jerárquicas**:
  - Se prescinde de la asignación estática de columnas (`depth1`, `depth2`, `depth3`) en favor de un cálculo dinámico por coordenadas relativas al padre inmediato:
    $$\text{level\_offset}_d = \sum_{k=1}^d (\text{width}_k + \text{gap}_x)$$
  - Cada nivel jerárquico posee un ancho definido según su rol (Raíz: 270px, Título: 260px, Subtítulo: 260px, Hoja: 275px, ajustado por `fontSizeScale`), garantizando un cálculo predecible de coordenadas $X$.
- **Separador de Colisiones Verticales en Dos Pasadas**:
  - *Pasada 1 (Bottom-Up):* Se calcula recursivamente la altura total del subárbol de cada nodo, sumando las alturas de los hijos visibles y los gaps verticales.
  - *Pasada 2 (Top-Down):* Se asignan las coordenadas $(x, y)$. La coordenada $Y$ del padre se sitúa en el baricentro exacto del espacio que ocupan sus hijos. Si el espacio de los hijos es menor a la altura del propio padre, los hijos se centran verticalmente con respecto a la altura del padre.
  - *Post-procesado anti-colisión:* Entre hermanos consecutivos se verifica la regla de invariancia:
    $$y_{i+1} \ge y_i + \text{height}_i + \text{minVerticalGap}$$
    En caso de discrepancia, se aplica un desplazamiento correctivo hacia afuera.
- **Direccionalidad Bilateral Sólida**:
  - Los nodos de nivel 2 se continúan dividiendo simétricamente entre el hemisferio derecho y el hemisferio izquierdo para preservar la estética de mapa mental radial.
  - Los anclajes de salida (`sourceHandle`) y llegada (`targetHandle`) de React Flow se mantienen estrictamente orientados hacia el exterior: en el hemisferio derecho el origen es derecho y el destino izquierdo; en el hemisferio izquierdo el origen es izquierdo y el destino derecho.
- **Estimación Precisa de Alturas**:
  - Se ajusta la fórmula de `getNodeHeight` para considerar la presencia de botones de colapso, checkboxes de maestría, padding vertical del contenedor (24px) y un factor de seguridad por salto de línea según la relación ancho/caracteres.

---

## 6. Testing Decisions

- **Criterio de Calidad de las Pruebas**:
  - Las pruebas deben evaluar exclusivamente el comportamiento geométrico y relacional externo (cajas delimitadoras $X, Y, W, H$ resultantes del layout), sin acoplarse a detalles internos de implementación.
- **Módulo a Probar**:
  - Motor de layout (`dagreLayout.test.ts`).
- **Casos de Prueba Específicos**:
  1. *Árbol Profundo (Niveles 1 a 6):* Verificar que $X_{\text{nivel } 5} > X_{\text{nivel } 4} > X_{\text{nivel } 3}$ en el lado derecho, y que ningún nodo comparta la misma $X$ que su padre o abuelo.
  2. *Detección Geométrica de Cero Solapamientos:* Función de test `assertNoOverlap(nodes)` que itere sobre todos los pares $(A, B)$ y asegure:
     $$\neg (A.x < B.x + B.w \land A.x + A.w > B.x \land A.y < B.y + B.h \land A.y + A.h > B.y)$$
  3. *Expansión y Colapso:* Validar que al cambiar un nodo de colapsado a expandido, los nodos hijos añadidos no intersecten con ningún hermano existente y que los hermanos se hayan desplazado la distancia necesaria.
  4. *Escala Tipográfica:* Validar la ausencia de solapamientos para escalas extremas (`fontSizeScale = 0.85`, `1.05`, `1.6`).
- **Prior Art en el Codebase**:
  - `markdownTreeOps.test.ts` y `docxParser.test.ts` que validan transformaciones y estructuras en Vitest.

---

## 7. Out of Scope

- **Física de grafos por fuerzas (Force-directed / D3-force simulation)**: No se utilizará simulación física en tiempo real en cada frame para evitar inestabilidad visual y consumo elevado de CPU. Se mantiene un layout determinista y estructurado.
- **Nodos con arrastre manual libre (free dragging) persistido**: Los nodos se posicionan de manera ordenada y automática mediante el algoritmo para garantizar la legibilidad del mapa mental.
- **Diseños circulares 360° no euclidianos**: El diseño se mantiene en el estándar radial bilateral (ramas hacia la izquierda y hacia la derecha del nodo central).

---

## 8. Further Notes

- El archivo de especificación queda registrado en `docs/spec-non-overlapping-radial-layout.md` para referencia de futuros sprints y ejecuciones de agentes.
- La suite de pruebas en Vitest servirá como guardia de regresión permanente para cualquier ajuste tipográfico o de diseño futuro.
