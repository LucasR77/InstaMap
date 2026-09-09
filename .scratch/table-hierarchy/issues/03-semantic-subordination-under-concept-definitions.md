# 03: Semantic Subordination of Tables Under Concept Definition Nodes

**What to build:** When a table follows a concept definition paragraph (e.g. `Sin estado (Stateless): ...`), the parser generates a dedicated `Subconcept` node for the definition (with its explanation in the node body) and nests the table's intermediate container node directly underneath that definition node. This creates a cohesive 4-level hierarchy (Island/Section -> Definition Subconcept -> Table Container -> Row -> Attribute). If the table appears immediately under a section heading without a definition paragraph, the container nests directly under the section parent.

**Blocked by:** 02: Hierarchical Table Decomposition (Container, Rows, and Attribute Leaf Nodes)

**Status:** completed

- [x] A definition paragraph preceding a table produces its own `Subconcept` node with the definition text in its body.
- [x] The table's intermediate container node is attached as a child of the preceding definition `Subconcept` instead of the grandparent section.
- [x] A table immediately following a section heading without a prior definition paragraph attaches its container node directly to that section.
- [x] Level depth and island index invariants are preserved across the 4-level hierarchy.
