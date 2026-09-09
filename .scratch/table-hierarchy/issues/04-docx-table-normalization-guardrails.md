# 04: Word (.docx) Table Structure Normalization & End-to-End Ingestion

**What to build:** The Word document preprocessor (`docxParser.ts`) preserves table structures emitted by Mammoth into clean Markdown tables, ensuring table rows and cells do not degrade into disconnected bold text lines or orphan headers. Verifies the end-to-end ingestion from `.docx` files containing conceptual definitions and comparative tables into the 4-level mindmap hierarchy.

**Blocked by:** 03: Semantic Subordination of Tables Under Concept Definition Nodes

**Status:** completed

- [x] Word tables with multiple columns and rows normalize cleanly into Markdown tables in `normalizeDocxMarkdown`.
- [x] Converted tables are never flattened into isolated bold headings or detached lines.
- [x] End-to-end ingestion converts a `.docx` document containing a definition followed by a comparative table into the proper 4-level `ParsedNode[]` hierarchy.
