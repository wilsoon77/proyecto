## 2026-07-08T21:13:50-06:00
Implement the refactoring and UI/UX improvements of the inventory movement registration panel and integration test suite.

Your working directory is: c:\Users\wilso\Documents\FrameworksrProjects\React\proyecto-panaderia\.agents\worker_1\

Please read the analysis report:
- c:\Users\wilso\Documents\FrameworksrProjects\React\proyecto-panaderia\.agents\explorer_1\analysis.md
- c:\Users\wilso\Documents\FrameworksrProjects\React\proyecto-panaderia\.agents\explorer_1\handoff.md

1. Refactor `web/src/app/admin/inventario/movimiento/page.tsx`:
   - R1 (Combobox Product Selector): Replace the separate search input and native HTML select with a unified, interactive Combobox/Autocomplete product selector styled with Tailwind. It must open a dropdown of matching products when focused, filter when typing, and set the selected product slug and search term. Implement click-outside behavior to close the dropdown using a React ref and `mousedown` event listener. Sync URL `producto` search parameter with `productSearch` on mount.
   - R2 (Branch Control according to user role): Retrieve user role and branch info using `useAuth()`. If the user is a `MANAGER`, automatically select their assigned branch (`user?.branch?.slug`) and disable the selector. For `TRANSFERENCIA` (transfers), the Origin branch selector must be locked (`disabled={true}`) to the manager's branch, but the Destination branch selector must remain enabled to allow transfers. For non-transfer movements, both branch selectors (if shown) are locked. If the user is an `ADMIN`, allow free selection of any branch.
   - R3 (Dynamic Units of Measure): Display the text "unidades" adjacent to the quantity input (as a neat suffix badge/label) to explicitly context-align with the product's tracked unit.
   - R4 (Multiple Registration Workflow): Add a "Registrar y agregar otro" secondary button. On click, it performs the API call to save the movement, displays a success notification/toast (using `useToast`), and clears the product selection, quantity, reference, and notes (restoring product selection to empty and quantity to 1), but keeps the branch and movement type selections intact without redirecting or replacing the form. The normal "Registrar Movimiento" button should redirect as before.

2. Modify `web/test-integration-roles.mjs`:
   - Support `const url = process.env.TEST_BASE_URL || 'https://proyecto-wilsoon77.vercel.app';` for easy local testing.
   - Expand the `MANAGER` test block. Navigate to `/admin/inventario/movimiento`, verify branch selection is disabled, select a product using the new Combobox selector, enter a quantity, click "Registrar y agregar otro" to submit, verify success, and then submit another movement using "Registrar Movimiento" to verify it redirects back to `/admin/inventario`.
   - Take screenshots at key points.

3. Verify changes:
   - Start the local Next.js dev server (`npm run dev` in `web/`) and run the updated integration tests:
     `$env:TEST_BASE_URL="http://localhost:3000"; node web/test-integration-roles.mjs`
   - Document verification output, pass/fail status, and screenshot paths in your handoff report at `c:\Users\wilso\Documents\FrameworksrProjects\React\proyecto-panaderia\.agents\worker_1\handoff.md`.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.
