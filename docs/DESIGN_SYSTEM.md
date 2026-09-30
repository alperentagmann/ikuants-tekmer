# İKÜANTS TEKMER — DESIGN SYSTEM SPECIFICATION

## 1. Design Philosophy

The İKÜANTS TEKMER design system is built upon the following aesthetic pillars:
- **Editorial & Institutional**: Clean typographical rhythm, academic and corporate trustworthiness, avoiding generic SaaS startup clichés.
- **Technology & Innovation**: Sophisticated dark/light color surfaces, subtle borders, deep slate backgrounds, and vibrant cyan/sky accents.
- **Restraint & Purposeful Motion**: Micro-interactions provide meaningful feedback rather than visual noise. All animations adhere to `prefers-reduced-motion`.

---

## 2. Color Palette & Design Tokens

### Primary & Accent Colors
- **Brand Primary (Sky/Blue)**:
  - Default: `#0284c7` (Sky 600) / Dark Mode: `#38bdf8` (Sky 400)
  - Light Hover: `#0369a1` / Dark Hover: `#7dd3fc`
- **Secondary Accent (Cyan/Teal)**:
  - `#06b6d4` (Cyan 500)
- **Neutral Surfaces**:
  - Light Theme Background: `#f8fafc` (Slate 50)
  - Light Card / Surface: `#ffffff`
  - Light Border: `#e2e8f0` (Slate 200)
  - Dark Theme Background: `#090d16` (Deep Charcoal Blue)
  - Dark Card / Surface: `#0f172a` (Slate 900)
  - Dark Border: `#1e293b` (Slate 800)

### Status & State Colors
- **Success / Completed**: `#10b981` (Emerald 500) / Background: `#ecfdf5`
- **Warning / In Review**: `#f59e0b` (Amber 500) / Background: `#fffbeb`
- **Danger / Urgent**: `#ef4444` (Red 500) / Background: `#fef2f2`
- **Info / Neutral**: `#6366f1` (Indigo 500) / Background: `#eef2ff`

---

## 3. Typography & Hierarchy

- **Font Family**: Plus Jakarta Sans / Inter with clean geometric sans fallbacks.
- **Headings**:
  - `H1`: 3.5rem (56px), bold, tight tracking (`-0.03em`), line-height 1.1.
  - `H2`: 2.25rem (36px), semibold, tracking (`-0.02em`), line-height 1.2.
  - `H3`: 1.5rem (24px), semibold, tracking (`-0.01em`), line-height 1.3.
  - `H4`: 1.125rem (18px), medium, line-height 1.4.
- **Body**:
  - Regular: 1rem (16px), line-height 1.6.
  - Small / Caption: 0.875rem (14px), line-height 1.5.
  - Micro / Meta: 0.75rem (12px), line-height 1.4.

---

## 4. Layout & Grid Breakpoints

| Breakpoint | Width (px) | Grid Columns | Gutter |
| :--- | :--- | :--- | :--- |
| **Mobile (Compact)** | 390px / 430px | 4 cols | 16px |
| **Tablet** | 768px | 8 cols | 24px |
| **Desktop (Standard)** | 1024px / 1280px | 12 cols | 32px |
| **Wide Desktop** | 1440px / 1920px | 12 cols (Max container 1380px) | 32px |

---

## 5. Motion Principles

- **Speed**: Snappy UI interactions (150ms–250ms).
- **Easing**: `cubic-bezier(0.16, 1, 0.3, 1)` for smooth decelerating entry.
- **Accessibility**: Automatic fallback when `@media (prefers-reduced-motion: reduce)` is detected.
- **Transitions**: Fade, slide-in-up (10px delta), and subtle scale (0.98 to 1.0).
