# Project Plan: Inventory Movement UI/UX Refactoring

## Architecture
- React / Next.js app in `web/` using Tailwind CSS and Radix/shadcn/ui.
- The inventory movement registration UI is located at `web/src/app/admin/inventario/movimiento/page.tsx`.
- Playwright integration tests are at `web/test-integration-roles.mjs`.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|---|---|---|---|
| 1 | Exploration & Analysis | Analyze `page.tsx` and test-integration-roles.mjs. Design UI/UX changes and test cases. | None | DONE |
| 2 | Implementation: UI/UX Refactoring | Refactor `page.tsx` to add Combobox product selector, role-based branch control, dynamic units of measure, and "Registrar y agregar otro" flow. | M1 | IN_PROGRESS |
| 3 | Implementation: Playwright Updates | Update `web/test-integration-roles.mjs` to adapt to the new UI elements (combobox, buttons). | M2 | IN_PROGRESS |
| 4 | Verification & Quality Assurance | Run all integration tests across all roles using Playwright and capture screenshots to verify layout. | M3 | PLANNED |

## Interface Contracts & Component Specs
- Combobox product selector: must replace the separate search input and native HTML select, using existing shadcn-like/Radix components if available, or Tailwind.
- Branch Selector:
  - If user role is `MANAGER` (or similar depending on auth metadata), auto-select assigned branch and disable selector (unless movement type is transfer/transferencia).
  - If user role is `ADMIN`, allow free branch selection.
- Quantity Input: displays the selected product's unit of measure next to/in the input field dynamically.
- "Registrar y agregar otro" button:
  - Saves the current movement (API call).
  - Clears product selection and quantity.
  - Retains the selected branch and movement type.
  - Shows success notification but does not redirect.
