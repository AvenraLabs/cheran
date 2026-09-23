# Date Formatting Standard: DD/MM/YYYY

## Rule
All dates rendered in the user interface, tables, cards, modals, PDF exports, CSV exports, WhatsApp messages, and summary texts across **Plast** and the **entire application** MUST strictly follow the **DD/MM/YYYY** format (e.g., `23/09/2026`).

## Guidelines
1. **Never use raw ISO dates or US format**: Never display `YYYY-MM-DD` or `MM/DD/YYYY` directly to users in UI tables, cards, modals, PDFs, or CSV exports.
2. **Centralized Date Utility**: Always import and use `formatDate(value)` from `frontend/src/utils/dates.js` (or `../utils/dates.js` / `../../utils/dates.js`).
   ```javascript
   import { formatDate } from "../../utils/dates.js";

   // Usage:
   <span>{formatDate(entry.date)}</span>
   <td>{formatDate(sale.sale_date)}</td>
   <td>{formatDate(payment.payment_date)}</td>
   ```
3. **Date & Time**: When formatting date and time together, use `formatDateTime(value)` from `frontend/src/utils/dates.js`, which renders `DD/MM/YYYY, HH:mm`.
4. **PDF and CSV Exports**: In `jspdf`, `jspdf-autotable`, and CSV string generators, always wrap date values with `formatDate(...)`.
5. **WhatsApp Messages**: In customer ledger, invoice, and dispatch WhatsApp templates, always format dates as `formatDate(...)`.
6. **Form Inputs**: HTML `<input type="date">` internally accepts `YYYY-MM-DD` for `.value`. Use the customized `<DateInput />` component from `frontend/src/components/common/DateInput.jsx` so that mobile devices and laptops consistently display the `dd-mm-yyyy` format and placeholders.
