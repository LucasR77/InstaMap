# 02: Hierarchical Table Decomposition (Container, Rows, and Attribute Leaf Nodes)

**What to build:** When a table is parsed, create an intermediate container node (`Subconcept`) named after the first column header (e.g. `Operación HTTP`). Hang each row as an individual child node (`GET`, `POST`, `PUT`, `DELETE`), and expand remaining columns as leaf sub-subnodes with direct label format `<Column Header>: <Value>`. Ensure table headers are never emitted as sibling concept cards, and that each node has valid reading stats and flashcard readiness.

**Blocked by:** 01: Prefactor sequential block segmentation in document parser

**Status:** completed

- [x] An intermediate grouping container node is generated with its label taken from the first column header.
- [x] Each data row becomes a direct child node of the intermediate container using column 1's value as label.
- [x] Columns 2..N are converted into leaf sub-subnodes attached to their respective row node, formatted as `<Column Header>: <Value>`.
- [x] Column header names never appear as sibling concept cards at the row or section level.
- [x] All generated nodes satisfy domain invariants (`Subconcept` level calculation, reading stats, and flashcard suitability).
