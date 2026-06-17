# Port Authority Financial Analytics Platform

A complete, full-stack web application designed for a port authority to ingest annual customs analysis reports (Excel spreadsheets), clean and stage the data, review/approve submissions, and explore interactive statistics.

---

## Technical Stack
- **Frontend**: React (functional components + hooks), React Router v7, Tailwind CSS v4, Recharts, Lucide React icons, Axios.
- **Backend**: Node.js + Express, REST API, Multer (restricted to `.xlsx`/`.xls`, 10MB limit), Cookie Parser, JSON Web Tokens (stored in HTTP-only cookies).
- **Database**: PostgreSQL (single database, schema with multiple tables).
- **Excel Parser**: `xlsx` (SheetJS).
- **Auth**: Passwords hashed with `bcrypt` before storing. Sessions verified via Express middleware.

---

## Design Choices & Engineering Decisions
Consistent with the build specification, several key architectural and design decisions were made:

1. **Branding & Theme (Cochin Port Style)**:
   Style is inspired by Cochin Port Authority's official portal. The Tailwind CSS v4 configuration (located in `client/src/index.css` via `@theme` declarations) maps custom theme colors:
   - Primary: `port-navy` (`#003366`) and `port-navy-dark` (`#00264d`) for headers, sidebars, and main buttons.
   - Accent: `port-accent` (`#d4a843`) gold tone for highlighting active routes, alerts, statuses, and badges.
   - Typography: **Inter** Google Font is embedded to replace default system fonts.

2. **Tonnage Metric for Trends**:
   Vessel Gross Register Tonnage (`grt`) was used as the primary metric for cargo tonnage trends. Both `unit_quantity1` and `unit_quantity2` are cleaned and stored in staging and stats tables, but GRT was mapped as the weight metric for the "Tonnage Trends" composed line/bar chart.

3. **Profit vs. Expenses**:
   Operating costs are not available in the report uploads. We added an admin-only form in the frontend (accessible via the "Review Reports" screen or a dedicated entry section) that sends data to `POST /api/expenses`. This inserts or updates an annual operating cost in the `operating_expenses` table. The "Profit vs. Expenses" chart queries both `port_statistics` and `operating_expenses` per year, displaying income vs operating costs side-by-side.

4. **Lookup Tables for Categories (Revenue & Cargo Breakdown)**:
   Rather than scattered string checks, we created explicit tables `revenue_category_map` and `cargo_category_map` to map raw spreadsheet invoice groups or commodity groups to human-readable buckets (e.g. "Docking Fees", "Containers", etc.) with an "Other" fallback. These are pre-seeded via `db/seed.sql` and can be customized.

5. **Security & Role Gates**:
   - Authentication cookie (`token`) is issued with `httpOnly: true`, `sameSite: 'lax'`, and `secure: false` (for local development).
   - Roles are checked on the frontend React Context/routes (UX only) and enforced on the backend via Express JWT verify and role middleware (real security gate). Any route accessed without authority returns a `401` or `403` status.

---

## Database Configuration & Local Setup

### 1. Database Configuration
Update the `.env` file in the `server/` directory if your local PostgreSQL details are different:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=portauthority
DB_USER=admin
DB_PASSWORD=admin123
JWT_SECRET=port-authority-jwt-secret-change-in-production
PORT=5000
```

*Note: The seeded configuration matches the default credentials from the user's running docker postgres environment.*

### 2. Setup database schema & seed test users
From the `server/` directory, run:
```bash
npm run db:setup
```
This runs the table definitions in `db/schema.sql`, hashes the passwords securely, and runs `db/seed.sql` to populate:
- **Admin**: `admin@portauthority.gov.in` / `admin123`
- **Analyst**: `analyst@portauthority.gov.in` / `analyst123`
- **Viewer**: `viewer@portauthority.gov.in` / `viewer123`
- **Lookup category mapping defaults**.

---

## Running the Application

### Start the Backend
From the `server/` directory:
```bash
npm run dev
```
Runs the Express server on port `5000`.

### Start the Frontend
From the `client/` directory:
```bash
npm run dev
```
Runs the Vite development server on port `5173`. Access the web portal at: `http://localhost:5173`.

---

## Testing File Upload Pipeline
A test file with dirty data has been automatically generated for you in `server/test_sample_dirty.xlsx`. It includes:
- 4 junk metadata rows above the headers (ignored)
- Blank vessel name rows (which are filled via nearest-fill algorithm)
- A row missing the `Invoice Date` (which is dropped)
- Different currencies (converted using exchange rate into INR)

Log in as `analyst@portauthority.gov.in`, upload the file for a selected year, and check the admin queue as `admin@portauthority.gov.in` to approve the data and see it instantly appear in the dashboards!
