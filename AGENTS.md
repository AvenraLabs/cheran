# Cheran Development Guidelines & Memory

## Date Formatting Standard (DD/MM/YYYY)
All dates rendered in the user interface, tables, cards, modals, PDF exports, CSV exports, WhatsApp messages, and summary texts across **Plast** and the **entire application** MUST strictly follow the **DD/MM/YYYY** format (e.g., `23/09/2026`).

- **Centralized Date Utility**: Always import and use `formatDate(value)` from `frontend/src/utils/dates.js`.
- **Date & Time**: When formatting date and time together, use `formatDateTime(value)` from `frontend/src/utils/dates.js` (`DD/MM/YYYY, HH:mm`).
- **Never display raw ISO dates** (`YYYY-MM-DD`) or US format (`MM/DD/YYYY`) to users.
- **Date Inputs**: Use `<DateInput />` from `frontend/src/components/common/DateInput.jsx` so that mobile phone browsers render the `dd-mm-yyyy` placeholder instead of an empty box.
