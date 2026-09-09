# 01: Prefactor sequential block segmentation in document parser

**What to build:** The document parser processes section content into an ordered sequence of structural blocks (paragraphs, definition entries, and markdown tables) in their original reading order. This eliminates the early-return shortcut that swallowed definition paragraphs into introductory section text whenever a table was present.

**Blocked by:** None (can start immediately).

**Status:** completed

- [x] Parsing a section with both definition paragraphs and markdown tables retains the definition paragraphs instead of swallowing them as raw introductory lines.
- [x] Non-table content preceding and succeeding a table is extracted cleanly in sequential document order.
- [x] Existing bullet, bold definition, and numbered list parsing continues to pass without regressions.
