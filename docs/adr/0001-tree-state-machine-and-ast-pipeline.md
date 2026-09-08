# 0001: Tree State Machine, AST Pipeline, and Offline-First Persistence

InstaMap's reactive core previously relied on a monolithic hook (`useGraphState`) that performed cyclic Markdown string re-parsing on every node edit, creating ID instability and high cognitive complexity (73). We decided to make the in-memory tree (`ParsedNode[]`) the primary source of truth governed by a dedicated state machine/reducer, parse Markdown via a formal `mdast` AST visitor pipeline instead of regex heuristics, and adopt an offline-first storage queue that persists locally before syncing to Supabase.

## Status
Accepted

## Considered Options
1. **Status Quo (Monolithic Hook & String-based Regex Parser)**: Low initial effort, but caused ID drift when editing node titles, cyclic re-renders, and loss of uncommitted edits on transient network failures.
2. **Multiple Independent Hooks with Shared State**: Better file organization, but still prone to race conditions between remote synchronization and local tree re-indexing.
3. **Decoupled Tree Reducer + Unified/mdast AST Pipeline + Offline Queue (Selected)**: Single directional data flow, stable node identity, formal syntax guarantees for tables/subnodes, and zero data loss on network drops.

## Consequences
- Node modifications (`ADD_NODE`, `UPDATE_NODE`, `DELETE_NODE`) preserve stable node IDs without round-trip Markdown serialization artifacts.
- Markdown export becomes a pure projection of the state tree rather than the primary mutation bus.
- Network latency or intermittent disconnects do not block the student's editing experience.
