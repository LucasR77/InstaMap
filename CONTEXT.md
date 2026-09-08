# InstaMap Domain Model

The ubiquitous language and conceptual model for interactive mindmaps, hierarchical document parsing, and study workflows in InstaMap.

## Core Hierarchy & Graph Structure

**Root Topic**:
The primary subject or title of the mindmap, represented as the single Level-1 central node.
_Avoid_: Main subject, canvas center, root header

**Island**:
A distinct conceptual branch of Level-2 derived directly from the Root Topic, identified by a dedicated color palette shared by its descendants.
_Avoid_: Topic group, theme branch, category cluster

**Subconcept**:
A conceptual node of Level-3 or deeper (subheadings, bullet points, or paragraphs) displayed with outward expansion relative to its parent.
_Avoid_: Child card, nested bullet, leaf block

**Outward Expansion**:
The spatial invariant where child nodes of generation \(N+1\) are positioned strictly farther from the Root Topic centroid than their generation \(N\) parent, with zero bounding-box overlap.
_Avoid_: Radial burst, outward stretching

## Study & Learning Domain

**Mastered Node**:
A node whose concept the learner has marked as retained, visually highlighted in the graph and tracked toward total map progress.
_Avoid_: Checked node, learned card, completed topic

**Flashcard**:
A dual-sided study prompt derived from a Subconcept or Island, exposing the node label on the front and its detailed markdown body on the back.
_Avoid_: Study card, memory flip

## Persistence & Storage

**Sync Status**:
The real-time lifecycle state (`local`, `saving`, `saved`, `error`) reflecting synchronization between the local workspace and remote persistence.
_Avoid_: Cloud status, save indicator

**Share Slug**:
A unique URL-safe identifier granting read-only access to a published mindmap without requiring user authentication.
_Avoid_: Public link, share token, public ID
