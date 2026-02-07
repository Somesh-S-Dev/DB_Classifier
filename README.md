# DB Classifier & Data Modeling Workspace

A premium, high-density web application designed for database architects and engineers to classify, document, and model complex database schemas with millisecond-perfect synchronization and a zero-mutation safety sandbox.

## 🎯 Objectives & Expectations

### Objectives
- **Cognitive Load Reduction**: Transform messy, flat database schemas into organized, business-centric modules.
- **Consistent Metadata**: Eliminate casing mismatches and fragmentation between disparate metadata files (e.g., `gold_kg.json` and `db_tables.json`).
- **Visual Intelligence**: Provide a clear, visual interface for defining table relationships (joins) and metadata (descriptions, keywords).
- **Persistence Integrity**: Ensure 100% synchronization between the browser UI, local filesystem, and PostgreSQL database.

### Expectations
- **Performance**: Handle 500+ tables without UI lag or scroll jank.
- **Safety**: Protect users from accidental data loss through session persistence and unsaved changes guardrails.
- **Precision**: Deliver an environment where every modeling operation is reversible until explicitly committed to the workspace.

## ✨ Key Features

- **Global Classifier Studio**: A searchable, high-density grid for dragging and dropping tables into business modules.
- **Dedicated Focus Mode**: A specialized workspace for each module featuring natural full-screen scrolling and accordion-based table inspection.
- **Intelligent Join Modeling**: Build complex SQL joins visually with auto-complete prompts and live relationship validation.
- **Zero-Mutation Sandbox**: Modeling changes are staged in a local sandbox, allowing for "what-if" scenarios without affecting the global project state.
- **Hybrid Security Model**: Standard JWT-based authentication coupled with real-time database-side session revocation for enterprise-grade security.
- **Glassmorphism UI**: A state-of-the-art interface utilizing modern aesthetics, micro-animations, and dynamic root scaling for maximum data density.

## 🛠 Tech Stack

### Frontend
- **Framework**: React 18 (TypeScript)
- **Build Tool**: Vite
- **State Management**: Zustand (with Snapshot-based Undo/Redo)
- **Styling**: Tailwind CSS & Framer Motion
- **Icons**: Lucide React
- **Virtualization**: React Window & AutoSizer (evaluated/integrated for large lists)

### Backend
- **Runtime**: Node.js (TSX)
- **Framework**: Express.js
- **Database**: PostgreSQL (pg)
- **Authentication**: JWT & Bcrypt
- **Email Service**: Nodemailer (OTP-based verification)
- **Process Manager**: Nodemon

## 💼 Use Cases

1. **Large Scale Schema Analysis**: Quickly group hundreds of legacy tables into manageable business domains.
2. **Knowledge Graph Enrichment**: Clean up and standardize metadata for ingestion into AI or Knowledge Graph systems.
3. **Collaborative Modeling**: Define standardized joins and table descriptions that can be exported as a unified JSON "Source of Truth".
4. **Data Engineering Sandbox**: Prototype new schema relationships and business rules without modifying the live database structure.

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- PostgreSQL Instance

### Setup

1. **Clone the repository**
2. **Backend Configuration**:
   - Navigate to `/backend`
   - Create a `.env` file based on `.env.example`
   - Install dependencies: `npm install`
   - Start development server: `npm run dev`
3. **Frontend Configuration**:
   - Navigate to `/Frontend`
   - Install dependencies: `npm install`
   - Start Vite server: `npm run dev`

## 🔮 Future Updates

- **Advanced Virtualization**: Full integration of `react-window` across all modeling views for 1000+ table stability.
- **Collaborative Real-time Editing**: Multi-user session synchronization via WebSockets.
- **AI-Assisted Classification**: Auto-suggesting module assignments based on table names and column patterns.
- **Direct SQL Export**: Exporting modeled joins and metadata as DDL or migration scripts.
- **Schema Visualizer (Graph View)**: A toggleable node-link diagram for the focus mode.

## 📜 Version History

### [2.5.9] - 2026-02-07
- **Added**: Mandatory auth verification on every navigation mount in `ProtectedRoute`.
- **Added**: "Unsaved Changes" guardrail with browser-level `beforeunload` interceptor.
- **Added**: Configurable session expiry via `SESSION_EXPIRY_HOURS` and `OTP_EXPIRY_MINUTES` in `.env`.
- **Fixed**: Session persistence refined to prevent logout on page refresh while maintaining explicit revocation.
- **Changed**: Replaced `SCHEMA` display with live `COLUMN` count in table cards for improved density.
- **Optimized**: Transitioned to full-screen natural scrolling in Focus Mode to eliminate nested scroll jank.

### [2.2.0] - 2026-01-20
- Initial implementation of the "Focus Mode" modeling view.
- Added Drag-and-Drop table classification.
- Integrated PostgreSQL session persistence.

---
*Built for Database Engineers by Engineers.*
