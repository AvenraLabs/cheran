---
name: adminpanel-frontend-design-system
description: Complete production-grade frontend architecture, design system, typography, colors, component library, and responsiveness guide for modern web & mobile-responsive admin panels.
---

# Admin Panel Frontend Design System & Architecture Skill

This skill documents the complete frontend architecture, design language, color palette, typography, CSS tokens, component library primitives, layout structure, and responsiveness guidelines used in the admin panel. Use this skill as a direct blueprint to bootstrap and build high-end, responsive (desktop + mobile) admin panels in new projects.

---

## 1. Core Tech Stack & Framework Packages

### 1.1 Core Framework & Tooling
- **Framework**: React 19 / 18 + Vite
- **Language**: JavaScript (ESModules)
- **Styling**: Tailwind CSS v4 (`@tailwindcss/vite` / `@theme`) + Vanilla CSS variables
- **Icons**: Lucide React (`lucide-react`)
- **Animation**: Framer Motion (`framer-motion`)
- **Headless UI Primitives**: Radix UI (`@radix-ui/react-dialog`, `@radix-ui/react-dropdown-menu`, `@radix-ui/react-popover`, `@radix-ui/react-tabs`, `@radix-ui/react-tooltip`)
- **Table Engine**: TanStack React Table v8 (`@tanstack/react-table`)
- **Command Palette**: `cmdk`
- **Routing**: React Router v7 (`react-router-dom`)
- **Notifications**: Sonner (`sonner`)
- **HTTP Client**: Axios (`axios`)
- **Date Handling**: `date-fns`

### 1.2 Recommended `package.json` Dependencies

```json
{
  "dependencies": {
    "@radix-ui/react-dialog": "^1.1.23",
    "@radix-ui/react-dropdown-menu": "^2.1.24",
    "@radix-ui/react-popover": "^1.1.23",
    "@radix-ui/react-separator": "^1.1.15",
    "@radix-ui/react-tabs": "^1.1.21",
    "@radix-ui/react-tooltip": "^1.2.16",
    "@tailwindcss/vite": "^4.3.0",
    "@tanstack/react-table": "^8.21.3",
    "axios": "^1.6.0",
    "cmdk": "^1.1.1",
    "date-fns": "^2.30.0",
    "framer-motion": "^12.43.0",
    "lucide-react": "^0.294.0",
    "react": "^19.2.6",
    "react-dom": "^19.2.6",
    "react-router-dom": "^7.18.1",
    "sonner": "^2.0.7"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^6.0.1",
    "tailwindcss": "^4.3.0",
    "vite": "^8.0.12"
  }
}
```

---

## 2. Typography & Font Pairing

The design system pairs two modern typefaces:

1. **Body & UI Font**: **`Inter`** (`300`, `400`, `500`, `600`, `700`, `800`)
   - Clean, neutral, highly legible sans-serif for inputs, table cells, buttons, labels, and compact copy.
2. **Display & Heading Font**: **`Lexend`** (`400`, `500`, `600`, `700`)
   - Distinctive geometric typography with friendly open counters used for clean single-line page headers, card titles, modal titles, and big numeric metric counters.

### Font Import (`index.html` or top of `index.css`)

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Lexend:wght@400;500;600;700&display=swap');
```

---

## 3. Strict Minimalist Heading Rule (Zero Subtitle / Explanation Fluff)

### ⛔ NEVER DO:
- **NO Subtitles or Multi-line Explanations**: Never add 1-2 lines of fluff sentences below page titles, card headers, table headers, forms, or modal titles (e.g., *"Manage your records and view analytics easily across all accounts"* ❌). This looks amateurish, creates visual clutter, and wastes valuable screen real estate.
- **NO Descriptive Paragraph Blocks**: Admin panels are high-density productivity tools for operators. Every pixel must be actionable data, tables, inputs, filters, or metrics—NOT tutorial/marketing explanations.
- **NO Superfluous Technical Pills**: Do not add filler pill badges like *"Counter Mode · Auto Focus Enabled"* to card headers.

### ✅ ALWAYS DO:
- **Single Concise Heading Only**: Use a single clean heading (e.g., `Users Directory`, `Billing & Invoices`, `Analytics Overview`, `Settings`).
- **Data-Dense Header Line**: Pair the single heading on the same row with compact action buttons, search inputs, or short count pills (e.g., `1,240 Total`).
- **Clean Forms & Modals**: Field labels alone (`Full Name *`, `Email Address *`) provide sufficient context. Do not clutter forms with sentence-long explanations under each heading.

---

## 4. Color Palette & Design Tokens

Avoid high-saturation generic blue (#0000ff) or harsh pure black (#000000). The palette is a **warm-neutral organic palette** with a signature **Forest/Teal accent** and rich deep ink text.

| Token Name | HEX Code | CSS Variable | Usage Context |
| :--- | :--- | :--- | :--- |
| **Surface Canvas** | `#FAFAF8` | `--color-surface` | App background, page canvas, table sub-footers |
| **Card / Surface** | `#FFFFFF` | `--color-card` | White cards, modals, table rows, popovers |
| **Warm Border** | `#E4E1D8` | `--color-border` | Standard borders, divider lines, table headers |
| **Subtle Border** | `#EDEAE1` | `--color-border-subtle` | Soft inner dividers, card headers, row borders |
| **Primary Ink** | `#14213D` | `--color-ink` | Headings, primary text, high-emphasis values |
| **Muted Ink** | `#52607D` | `--color-ink-muted` | Labels, secondary descriptions, table headers |
| **Faint Slate** | `#8C97AB` | — | Placeholder text, disabled labels, faint icons |
| **Signature Teal 600** | `#2F6F5E` | `--color-brand-600` | Primary buttons, active nav links, focus rings |
| **Signature Teal 700** | `#245749` | `--color-brand-700` | Primary button hover state |
| **Soft Teal 50** | `#EAF3F0` | `--color-brand-50` | Active selection pills, row highlights, icon bg |
| **Soft Teal 100** | `#D3E6E0` | `--color-brand-100` | Active borders, hovered badges |
| **Amber Warning 600** | `#B8860B` | `--color-amber-600` | Pending, draft, warning indicators & text |
| **Amber Warning 50** | `#FDF8EC` | `--color-amber-50` | Pending status badge background |
| **Amber Border** | `#F7E7C4` | — | Pending status badge border |
| **Danger Red 600** | `#B0403A` | `--color-danger-600` | Destructive buttons, error borders, delete icons |
| **Danger Red 50** | `#FDF2F1` | `--color-danger-50` | Failed/overdue badge bg, error alert bg |
| **Danger Border** | `#F8D7D5` | — | Failed/overdue status badge border |

---

## 5. Spacing, Sizing, Radii & Shadows

- **Grid System**: 8px modular grid (`gap-2` = 8px, `gap-4` = 16px, `gap-6` = 24px, `p-4` = 16px, `p-5` = 20px, `p-6` = 24px).
- **Border Radii**:
  - Cards, Containers & Modals: `rounded-[10px]` (`--radius-card: 10px`)
  - Buttons, Inputs, Dropdowns: `rounded-[8px]` (`--radius-btn: 8px`)
  - Badges & Pills: `rounded-full`
  - Small icon action buttons: `rounded-[6px]`
- **Shadows**:
  - Subtle (Buttons/Cards): `shadow-[0_1px_2px_rgba(20,33,61,0.04)]`
  - Dropdowns/Modals: `shadow-[0_4px_16px_rgba(20,33,61,0.08)]`

---

## 6. Master CSS Configuration (`src/index.css`)

Copy this complete `index.css` setup into your project:

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Lexend:wght@400;500;600;700&display=swap');
@import "tailwindcss";

@theme {
  --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
  --font-display: 'Lexend', 'Inter', system-ui, sans-serif;

  --color-ink: #14213D;
  --color-ink-muted: #52607D;
  --color-brand-600: #2F6F5E;
  --color-brand-700: #245749;
  --color-brand-50: #EAF3F0;
  --color-brand-100: #D3E6E0;
  --color-amber-600: #B8860B;
  --color-amber-50: #FDF8EC;
  --color-surface: #FAFAF8;
  --color-card: #FFFFFF;
  --color-border: #E4E1D8;
  --color-border-subtle: #EDEAE1;
  --color-danger-600: #B0403A;
  --color-danger-50: #FDF2F1;
  --color-success-600: #2F6F5E;
  --color-success-50: #EAF3F0;

  --radius-card: 10px;
  --radius-btn: 8px;

  --shadow-subtle: 0 1px 2px rgba(20, 33, 61, 0.04);
  --shadow-card: 0 1px 3px rgba(20, 33, 61, 0.05), 0 1px 2px rgba(20, 33, 61, 0.03);
  --shadow-dropdown: 0 4px 16px rgba(20, 33, 61, 0.08);
}

@layer base {
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    border-color: var(--color-border);
  }

  html {
    font-family: var(--font-sans);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background-color: var(--color-surface);
    color: var(--color-ink);
  }

  body {
    background-color: var(--color-surface);
    color: var(--color-ink);
    min-height: 100vh;
  }

  #root {
    min-height: 100vh;
    width: 100%;
    max-width: 100%;
    display: flex;
  }

  h1, h2, h3, h4, h5, h6 {
    font-family: var(--font-display);
    color: var(--color-ink);
    font-weight: 600;
  }

  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Custom input focus overrides */
  select:focus, input:focus, textarea:focus, button:focus, *:focus-visible {
    border-color: var(--color-brand-600) !important;
    outline: none !important;
    box-shadow: 0 0 0 3px rgba(47, 111, 94, 0.15) !important;
    accent-color: #2F6F5E !important;
    caret-color: #2F6F5E !important;
  }

  /* Custom Date & Time picker accent styling */
  input[type="date"], input[type="time"] {
    accent-color: #2F6F5E;
    caret-color: #2F6F5E;
    color-scheme: light;
  }

  input[type="date"]::-webkit-calendar-picker-indicator {
    cursor: pointer;
    border-radius: 4px;
    padding: 2px;
    filter: invert(36%) sepia(35%) saturate(718%) hue-rotate(117deg) brightness(92%) contrast(89%);
  }
}

/* Custom Slim Scrollbars */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: var(--color-surface);
}
::-webkit-scrollbar-thumb {
  background: #D3CEC4;
  border-radius: 9999px;
}
::-webkit-scrollbar-thumb:hover {
  background: #B8B2A6;
}

.tabular-nums {
  font-variant-numeric: tabular-nums;
}
```

---

## 7. Layout Architecture (Desktop & Mobile)

The layout features:
1. **Collapsible Responsive Sidebar**: Fixed drawer on mobile (`<lg`), collapsible sidebar (260px expanded / 72px collapsed) on desktop.
2. **Slim Sticky Header (56px / `h-14`)**: Displays current single page title, mobile menu hamburger toggle, and universal Search / Command Palette (`Ctrl+K`).
3. **Scrollable Viewport Container**: Max container width `max-w-[1440px]` with responsive padding (`p-4 sm:p-6 lg:p-8`).

```jsx
// src/components/Layout/DashboardLayout.jsx
import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { CommandPalette } from '../common/CommandPalette';
import { Menu, Search } from 'lucide-react';

export function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="flex h-screen w-full bg-[#FAFAF8] overflow-hidden text-[#14213D]">
      {/* Sidebar Navigation */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />

      {/* Global Command Palette */}
      <CommandPalette open={cmdOpen} setOpen={setCmdOpen} />

      {/* Main Content Viewport */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden relative">
        {/* Sticky Top Bar */}
        <header className="h-14 px-4 sm:px-6 bg-white border-b border-[#EDEAE1] flex items-center justify-between gap-4 sticky top-0 z-30 shrink-0 shadow-[0_1px_2px_rgba(20,33,61,0.02)]">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden w-8 h-8 rounded-[6px] border border-[#E4E1D8] bg-[#FAFAF8] text-[#52607D] flex items-center justify-center cursor-pointer"
            >
              <Menu className="w-4 h-4" />
            </button>

            <h1 className="font-display font-bold text-base text-[#14213D] truncate tracking-tight">
              Admin Portal
            </h1>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setCmdOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-[8px] bg-[#FAFAF8] hover:bg-[#EAF3F0] border border-[#E4E1D8] hover:border-[#D3E6E0] text-xs text-[#52607D] transition-colors cursor-pointer"
            >
              <Search className="w-3.5 h-3.5 text-[#8C97AB]" />
              <span className="hidden sm:inline">Search</span>
              <kbd className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-medium text-[#2F6F5E] bg-white border border-[#E4E1D8] rounded-[4px]">
                Ctrl + K
              </kbd>
            </button>
          </div>
        </header>

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto bg-[#FAFAF8]">
          <div className="max-w-[1440px] mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
```

---

## 8. Compact Action Bar / Page Header Pattern

**Rule**: Always use a single clean heading without any subheadings or descriptive sentences below it:

```jsx
<div className="bg-white border border-[#E4E1D8] rounded-[10px] p-4 shadow-[0_1px_2px_rgba(20,33,61,0.04)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
  <div className="flex items-center gap-3">
    <h2 className="font-display font-bold text-base text-[#14213D]">Users Directory</h2>
    <span className="text-xs px-2 py-0.5 rounded-full bg-[#EAF3F0] text-[#2F6F5E] font-medium font-mono">
      1,240 Total
    </span>
  </div>
  
  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
    <Button variant="outline" size="sm" icon={Download}>Export</Button>
    <Button variant="primary" size="sm" icon={Plus} onClick={() => setModalOpen(true)}>Add User</Button>
  </div>
</div>
```

---

## 9. Complete Reusable Component Library

Place these primitives in `src/components/ui/` and `src/components/common/`:

### 9.1 `Button.jsx` (`src/components/ui/Button.jsx`)

```jsx
import React, { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

export const Button = forwardRef(({
  children,
  variant = 'primary', // primary | secondary | outline | ghost | destructive
  size = 'md', // sm | md | lg | icon
  loading = false,
  disabled = false,
  icon: Icon = null,
  iconRight: IconRight = null,
  className = '',
  type = 'button',
  ...props
}, ref) => {
  const baseStyles = "inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F6F5E] focus-visible:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none rounded-[8px] cursor-pointer";
  
  const variants = {
    primary: "bg-[#2F6F5E] hover:bg-[#245749] text-white shadow-xs border border-[#2F6F5E]",
    secondary: "bg-[#EAF3F0] hover:bg-[#D3E6E0] text-[#2F6F5E] border border-transparent font-semibold",
    outline: "bg-white hover:bg-[#FAFAF8] text-[#14213D] border border-[#E4E1D8] shadow-xs",
    ghost: "bg-transparent hover:bg-[#EAF3F0] text-[#52607D] hover:text-[#14213D]",
    destructive: "bg-[#B0403A] hover:bg-[#983631] text-white shadow-xs border border-[#B0403A]",
  };

  const sizes = {
    sm: "h-8 px-3 text-xs gap-1.5",
    md: "h-9 px-3.5 text-sm gap-2",
    lg: "h-10 px-4 text-base gap-2",
    icon: "h-9 w-9 p-0 text-sm",
  };

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      ) : Icon ? (
        <Icon className="w-4 h-4 shrink-0" />
      ) : null}
      {children}
      {!loading && IconRight ? <IconRight className="w-4 h-4 shrink-0" /> : null}
    </button>
  );
});

Button.displayName = 'Button';
```

---

### 9.2 `Card.jsx` (`src/components/ui/Card.jsx`)

*Clean, minimal container without unnecessary subtitle text.*

```jsx
import React from 'react';

export function Card({ className = '', children, ...props }) {
  return (
    <div
      className={`bg-white border border-[#E4E1D8] rounded-[10px] shadow-[0_1px_2px_rgba(20,33,61,0.04)] ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className = '', children, ...props }) {
  return (
    <div
      className={`px-5 py-3.5 border-b border-[#EDEAE1] flex items-center justify-between gap-4 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({ className = '', children, ...props }) {
  return (
    <h3
      className={`font-display text-sm font-semibold text-[#14213D] leading-tight ${className}`}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardContent({ className = '', children, ...props }) {
  return (
    <div className={`p-5 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ className = '', children, ...props }) {
  return (
    <div
      className={`px-5 py-3 bg-[#FAFAF8] border-t border-[#EDEAE1] flex items-center justify-end gap-3 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
```

---

### 9.3 `Input.jsx` & Custom `Select.jsx` (`src/components/ui/Input.jsx`)

*Eliminates standard native OS blue focus styling with custom soft teal dropdown highlight & checkmark.*

```jsx
import React, { forwardRef, useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export const Input = forwardRef(({
  className = '',
  type = 'text',
  error = false,
  icon: Icon = null,
  ...props
}, ref) => {
  return (
    <div className="relative w-full">
      {Icon && (
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#52607D]">
          <Icon className="w-4 h-4" />
        </div>
      )}
      <input
        ref={ref}
        type={type}
        className={`w-full h-9 bg-white text-[#14213D] placeholder-[#8C97AB] text-sm rounded-[8px] border ${
          error ? 'border-[#B0403A] focus:ring-[#B0403A]' : 'border-[#E4E1D8] focus:border-[#2F6F5E]'
        } ${Icon ? 'pl-9' : 'px-3'} pr-3 outline-none transition-colors focus:ring-2 focus:ring-[#2F6F5E]/15 disabled:opacity-50 disabled:bg-[#FAFAF8] ${className}`}
        {...props}
      />
    </div>
  );
});
Input.displayName = 'Input';

const extractOptionsFromChildren = (childrenNode) => {
  let opts = [];
  React.Children.forEach(childrenNode, (child) => {
    if (!child) return;
    if (React.isValidElement(child)) {
      if (child.type === 'option' || child.props.value !== undefined) {
        let label = child.props.children;
        if (Array.isArray(label)) {
          label = label.map((item) => (typeof item === 'object' ? '' : item)).join('');
        }
        opts.push({
          value: child.props.value ?? '',
          label: label !== undefined && label !== null ? String(label) : '',
          disabled: child.props.disabled ?? false,
        });
      } else if (child.props && child.props.children) {
        opts = opts.concat(extractOptionsFromChildren(child.props.children));
      }
    } else if (Array.isArray(child)) {
      opts = opts.concat(extractOptionsFromChildren(child));
    }
  });
  return opts;
};

export const Select = forwardRef(({
  className = '',
  error = false,
  value,
  onChange,
  disabled = false,
  name,
  required = false,
  placeholder,
  children,
  ...props
}, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const containerRef = useRef(null);
  const hiddenSelectRef = useRef(null);

  const parsedOptions = props.options && props.options.length > 0 ? props.options : extractOptionsFromChildren(children);
  const selectedOption = parsedOptions.find((opt) => String(opt.value) === String(value));

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setOpenUpward(spaceBelow < 220 && rect.top > 200);
    }
  }, [isOpen]);

  const handleSelect = (optValue) => {
    if (disabled) return;
    setIsOpen(false);

    if (hiddenSelectRef.current) {
      hiddenSelectRef.current.value = optValue;
      hiddenSelectRef.current.dispatchEvent(new Event('change', { bubbles: true }));
    }

    if (onChange) {
      onChange({
        target: {
          name: name || '',
          value: optValue,
        },
      });
    }
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <select
        ref={(node) => {
          hiddenSelectRef.current = node;
          if (typeof ref === 'function') ref(node);
          else if (ref) ref.current = node;
        }}
        value={value}
        onChange={onChange}
        name={name}
        disabled={disabled}
        required={required}
        className="sr-only pointer-events-none absolute opacity-0 w-0 h-0"
        tabIndex={-1}
      >
        {children}
      </select>

      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full h-9 bg-white text-[#14213D] text-xs font-semibold rounded-[8px] border ${
          error ? 'border-[#B0403A]' : isOpen ? 'border-[#2F6F5E] ring-2 ring-[#2F6F5E]/15' : 'border-[#E4E1D8] hover:border-[#2F6F5E]/60'
        } px-3 flex items-center justify-between outline-none transition-all cursor-pointer disabled:opacity-50 disabled:bg-[#FAFAF8]`}
        {...props}
      >
        <span className="truncate text-left">{selectedOption ? selectedOption.label : (placeholder || 'Select option...')}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-[#52607D] shrink-0 transition-transform ${isOpen ? 'rotate-180 text-[#2F6F5E]' : ''}`} />
      </button>

      {isOpen && (
        <div className={`absolute left-0 right-0 ${openUpward ? 'bottom-full mb-1' : 'top-full mt-1'} bg-white border border-[#E4E1D8] rounded-[8px] shadow-lg z-50 max-h-56 overflow-y-auto py-1`}>
          {parsedOptions.map((opt, idx) => {
            const isSelected = String(opt.value) === String(value);
            return (
              <div
                key={idx}
                onClick={() => !opt.disabled && handleSelect(opt.value)}
                className={`px-3 py-2 text-xs flex items-center justify-between transition-colors cursor-pointer ${
                  opt.disabled
                    ? 'opacity-40 cursor-not-allowed text-[#8C97AB]'
                    : isSelected
                    ? 'bg-[#EAF3F0] text-[#2F6F5E] font-bold'
                    : 'text-[#14213D] hover:bg-[#EAF3F0] hover:text-[#2F6F5E]'
                }`}
              >
                <span className="truncate">{opt.label}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-[#2F6F5E] shrink-0" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});
Select.displayName = 'Select';

export const Textarea = forwardRef(({
  className = '',
  error = false,
  rows = 3,
  ...props
}, ref) => {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={`w-full bg-white text-[#14213D] placeholder-[#8C97AB] text-sm rounded-[8px] border p-3 ${
        error ? 'border-[#B0403A]' : 'border-[#E4E1D8] focus:border-[#2F6F5E]'
      } outline-none transition-colors focus:ring-2 focus:ring-[#2F6F5E]/15 disabled:opacity-50 disabled:bg-[#FAFAF8] ${className}`}
      {...props}
    />
  );
});
Textarea.displayName = 'Textarea';
```

---

### 8.4 `Table.jsx` (`src/components/ui/Table.jsx`)

*TanStack Table with sticky headers, sorting arrows, animated skeleton loader, built-in empty state, and responsive pagination footer.*

```jsx
import React from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
} from '@tanstack/react-table';
import { ChevronDown, ChevronUp, ChevronsUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { EmptyState } from '../common/EmptyState';

export function Table({
  data = [],
  columns = [],
  pageSize = 12,
  emptyTitle = 'No records found',
  emptyDescription = 'There are no items matching your criteria.',
  emptyIcon,
  loading = false,
  className = '',
}) {
  const [sorting, setSorting] = React.useState([]);
  const [globalFilter, setGlobalFilter] = React.useState('');

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize } },
  });

  return (
    <div className={`w-full bg-white border border-[#E4E1D8] rounded-[10px] shadow-[0_1px_2px_rgba(20,33,61,0.04)] overflow-hidden flex flex-col ${className}`}>
      <div className="overflow-x-auto min-h-[300px]">
        <table className="w-full text-left border-collapse">
          <thead className="bg-[#FAFAF8] border-b border-[#E4E1D8] sticky top-0 z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-2.5 text-xs font-semibold text-[#52607D] uppercase tracking-wider select-none"
                  >
                    {header.isPlaceholder ? null : (
                      <div
                        className={`flex items-center gap-1.5 ${
                          header.column.getCanSort() ? 'cursor-pointer hover:text-[#14213D]' : ''
                        }`}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanSort() && (
                          <span className="shrink-0 text-[#8C97AB]">
                            {header.column.getIsSorted() === 'asc' ? (
                              <ChevronUp className="w-3.5 h-3.5 text-[#2F6F5E]" />
                            ) : header.column.getIsSorted() === 'desc' ? (
                              <ChevronDown className="w-3.5 h-3.5 text-[#2F6F5E]" />
                            ) : (
                              <ChevronsUpDown className="w-3.5 h-3.5 opacity-50" />
                            )}
                          </span>
                        )}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-[#EDEAE1] text-sm text-[#14213D]">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {columns.map((_, colIdx) => (
                    <td key={colIdx} className="px-4 py-3">
                      <div className="h-4 bg-[#EAF3F0] rounded w-3/4"></div>
                    </td>
                  ))}
                </tr>
              ))
            ) : table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-[#FAFAF8] transition-colors group"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-2.5 align-middle">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center">
                  <EmptyState
                    icon={emptyIcon}
                    title={emptyTitle}
                    description={emptyDescription}
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {table.getPageCount() > 1 && (
        <div className="px-4 py-2.5 bg-[#FAFAF8] border-t border-[#E4E1D8] flex items-center justify-between text-xs text-[#52607D]">
          <div className="tabular-nums">
            Showing <span className="font-semibold text-[#14213D]">{table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}</span> to{' '}
            <span className="font-semibold text-[#14213D]">
              {Math.min(
                (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                table.getFilteredRowModel().rows.length
              )}
            </span>{' '}
            of <span className="font-semibold text-[#14213D]">{table.getFilteredRowModel().rows.length}</span> results
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="p-1 rounded-[6px] border border-[#E4E1D8] bg-white hover:bg-[#FAFAF8] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4 text-[#14213D]" />
            </button>
            <span className="px-2 tabular-nums">
              Page <span className="font-semibold text-[#14213D]">{table.getState().pagination.pageIndex + 1}</span> of{' '}
              <span className="font-semibold text-[#14213D]">{table.getPageCount()}</span>
            </span>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="p-1 rounded-[6px] border border-[#E4E1D8] bg-white hover:bg-[#FAFAF8] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronRight className="w-4 h-4 text-[#14213D]" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

### 8.5 `StatsCard.jsx` (`src/components/common/StatsCard.jsx`)

```jsx
import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export function StatsCard({
  title,
  value,
  icon: Icon,
  subtext,
  trend = null, // 'up' | 'down' | null
  trendValue = null,
  active = false, // Highlights with 3px signature teal left border
  className = '',
}) {
  return (
    <div
      className={`bg-white rounded-[10px] border border-[#E4E1D8] p-4.5 shadow-[0_1px_2px_rgba(20,33,61,0.04)] relative overflow-hidden transition-all hover:shadow-[0_2px_6px_rgba(20,33,61,0.06)] ${
        active ? 'border-l-[3px] border-l-[#2F6F5E]' : ''
      } ${className}`}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-medium text-[#52607D] tracking-tight">{title}</span>
        {Icon && (
          <div className="w-8 h-8 rounded-[6px] bg-[#EAF3F0] text-[#2F6F5E] flex items-center justify-center shrink-0">
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-2">
        <span className="font-display font-bold text-2xl text-[#14213D] tabular-nums tracking-tight">
          {value}
        </span>

        {trendValue && (
          <span
            className={`inline-flex items-center text-xs font-semibold tabular-nums ${
              trend === 'up' ? 'text-[#2F6F5E]' : trend === 'down' ? 'text-[#B0403A]' : 'text-[#52607D]'
            }`}
          >
            {trend === 'up' && <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />}
            {trend === 'down' && <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />}
            {trendValue}
          </span>
        )}
      </div>

      {subtext && (
        <p className="text-[11px] text-[#8C97AB] mt-1 truncate">
          {subtext}
        </p>
      )}
    </div>
  );
}
```

---

### 8.6 `StatusBadge.jsx` (`src/components/common/StatusBadge.jsx`)

```jsx
import React from 'react';

export function StatusBadge({ status, label: customLabel, size = 'default' }) {
  const normKey = String(status ?? '').toLowerCase();

  const getVariant = (key) => {
    if (['active', 'approved', 'published', 'paid', 'success', 'true'].includes(key)) {
      return {
        bg: 'bg-[#EAF3F0]',
        text: 'text-[#2F6F5E]',
        border: 'border-[#D3E6E0]',
        dot: 'bg-[#2F6F5E]',
      };
    }
    if (['pending', 'draft', 'partial', 'warning', 'in-review'].includes(key)) {
      return {
        bg: 'bg-[#FDF8EC]',
        text: 'text-[#B8860B]',
        border: 'border-[#F7E7C4]',
        dot: 'bg-[#B8860B]',
      };
    }
    if (['rejected', 'dropped', 'terminated', 'overdue', 'unpaid', 'danger', 'failed'].includes(key)) {
      return {
        bg: 'bg-[#FDF2F1]',
        text: 'text-[#B0403A]',
        border: 'border-[#F8D7D5]',
        dot: 'bg-[#B0403A]',
      };
    }
    return {
      bg: 'bg-[#FAFAF8]',
      text: 'text-[#52607D]',
      border: 'border-[#E4E1D8]',
      dot: 'bg-[#8C97AB]',
    };
  };

  const labelMap = { true: 'Active', false: 'Inactive' };
  const variant = getVariant(normKey);
  const displayLabel = customLabel || labelMap[normKey] || status || 'N/A';
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${variant.bg} ${variant.text} ${variant.border} ${sizeClasses}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${variant.dot}`} />
      <span className="capitalize">{displayLabel}</span>
    </span>
  );
}
```

---

### 8.7 `Modal.jsx` (`src/components/common/Modal.jsx`)

```jsx
import React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'max-w-lg',
  footer,
}) {
  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={(open) => !open && onClose?.()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 bg-[#14213D]/40 backdrop-blur-[2px] z-50 animate-in fade-in duration-200" />
        <DialogPrimitive.Content
          className={`fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] ${maxWidth} bg-white border border-[#E4E1D8] rounded-[10px] shadow-[0_4px_16px_rgba(20,33,61,0.08)] z-50 outline-none overflow-hidden max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-150`}
        >
          <div className="px-5 py-4 border-b border-[#EDEAE1] flex items-center justify-between">
            <DialogPrimitive.Title className="font-display text-base font-semibold text-[#14213D]">
              {title}
            </DialogPrimitive.Title>
            <DialogPrimitive.Close
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-[6px] text-[#52607D] hover:bg-[#EAF3F0] hover:text-[#14213D] transition-colors outline-none cursor-pointer"
            >
              <X className="w-4 h-4" />
            </DialogPrimitive.Close>
          </div>
          
          <div className="p-5 overflow-y-auto flex-1">
            {children}
          </div>

          {footer && (
            <div className="px-5 py-3 bg-[#FAFAF8] border-t border-[#EDEAE1] flex items-center justify-end gap-2.5">
              {footer}
            </div>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
```

---

### 8.8 `ConfirmDialog.jsx` (`src/components/common/ConfirmDialog.jsx`)

```jsx
import React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '../ui/Button';

export function ConfirmDialog({
  isOpen,
  onClose,
  onCancel,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  danger = false,
  loading = false,
}) {
  const handleClose = onClose || onCancel;

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={(open) => !open && handleClose?.()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 bg-[#14213D]/40 backdrop-blur-[2px] z-50 animate-in fade-in duration-200" />
        <DialogPrimitive.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-sm bg-white border border-[#E4E1D8] rounded-[10px] shadow-[0_4px_16px_rgba(20,33,61,0.08)] z-50 outline-none overflow-hidden p-5 text-center animate-in zoom-in-95 duration-150">
          <div className="flex justify-end">
            <DialogPrimitive.Close
              onClick={handleClose}
              className="w-7 h-7 flex items-center justify-center rounded-[6px] text-[#52607D] hover:bg-[#FAFAF8] transition-colors outline-none cursor-pointer"
            >
              <X className="w-4 h-4" />
            </DialogPrimitive.Close>
          </div>

          <div
            className={`w-11 h-11 rounded-full flex items-center justify-center mx-auto mb-3.5 ${
              danger ? 'bg-[#FDF2F1] text-[#B0403A]' : 'bg-[#FDF8EC] text-[#B8860B]'
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
          </div>

          <DialogPrimitive.Title className="font-display text-base font-semibold text-[#14213D] mb-1">
            {title}
          </DialogPrimitive.Title>

          <DialogPrimitive.Description className="text-xs text-[#52607D] leading-relaxed mb-6">
            {message}
          </DialogPrimitive.Description>

          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant={danger ? 'destructive' : 'primary'}
              onClick={onConfirm}
              loading={loading}
              className="flex-1"
            >
              {confirmText}
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
```

---

### 8.9 `EmptyState.jsx` (`src/components/common/EmptyState.jsx`)

```jsx
import React from 'react';
import { Inbox } from 'lucide-react';
import { Button } from '../ui/Button';

export function EmptyState({
  icon: Icon = Inbox,
  title = 'No records found',
  description = 'There are no items to display at this time.',
  actionLabel,
  onAction,
  className = '',
}) {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-8 max-w-sm mx-auto ${className}`}>
      <div className="w-12 h-12 rounded-full bg-[#EAF3F0] text-[#2F6F5E] flex items-center justify-center mb-3">
        <Icon className="w-6 h-6" />
      </div>
      <h4 className="font-display font-semibold text-[#14213D] text-base mb-1">
        {title}
      </h4>
      <p className="text-xs text-[#52607D] leading-relaxed mb-4">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
```

---

## 10. Mandatory 6 UX States Checklist

Every feature, page, and module must implement:

1. **Loading State**: Pulse skeletons matching table or card layouts.
2. **Empty State**: `<EmptyState>` when zero data is returned.
3. **Error State**: Inline alert with retry button when API requests fail.
4. **Success State**: Sonner toast feedback (`toast.success("Saved successfully")`).
5. **Confirmation Dialog**: Prompt via `<ConfirmDialog>` on delete or critical status change.
6. **Form Submitting State**: Disabled inputs + loading spinner on submit button.

---

## 11. API Client Architecture (`src/api/axios.js`)

Centralized Axios instance with bearer token injection, automated error interceptors, and unified error handling:

```javascript
import axios from 'axios';
import { toast } from 'sonner';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || 'An unexpected error occurred';
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    } else if (error.response?.status >= 500) {
      toast.error(message);
    }
    return Promise.reject(error);
  }
);
```

---

## 12. Mobile & PWA Responsiveness Checklist

- **Touch Targets**: All clickable buttons and input elements must have a minimum height of `36px` to `44px` on mobile screens.
- **Adaptive Grids**: Use `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`.
- **Modals on Mobile**: Set modal container width to `w-[calc(100%-2rem)]` so dialogs never overflow viewport boundaries.
- **Table Horizontal Scroll**: Wrap every table in `<div className="overflow-x-auto">`.
- **Sidebar Drawer**: On screens `< lg` (1024px), sidebar operates as a full overlay drawer toggled by the hamburger button.
