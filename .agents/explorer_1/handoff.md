# Handoff Report: Inventory Movement Panel and Test Suite Analysis

## 1. Observation
- **File Checked**: `web/src/app/admin/inventario/movimiento/page.tsx`
  - **Auth hook**: On line 125, `const { user } = useAuth()` is retrieved but never used elsewhere in the file.
  - **Product Search & Select**: Defined at lines 328–334 (`<input type="text" ... value={productSearch} onChange={(e) => handleProductSearchChange(e.target.value)} />`) and lines 338–350 (`<select value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)} ...>`).
  - **Branch Selects**: Origin branch select on lines 428–438 (`<select value={movementFromBranch} onChange={(e) => setMovementFromBranch(e.target.value)}>`) and destination branch select on lines 448–462 (`<select value={movementToBranch} onChange={(e) => setMovementToBranch(e.target.value)}>`).
  - **Quantity Input**: Located at lines 412–419 (`<input type="number" value={movementQuantity} onChange={(e) => setMovementQuantity(parseInt(e.target.value) || 0)} ...>`).
  - **Form Submit & Redirection**: Located at lines 257–260 inside `handleSubmit`:
    ```typescript
    setTimeout(() => {
      router.push("/admin/inventario")
    }, 2000)
    ```
- **File Checked**: `web/src/lib/api/types.ts`
  - **ApiUser definition**: On lines 13–25, `ApiUser` contains `role: 'CUSTOMER' | 'ADMIN' | 'MANAGER' | 'BAKER' | 'CASHIER'` and `branch?: { id: number; name: string; slug: string } | null`.
- **File Checked**: `web/test-integration-roles.mjs`
  - **URL Config**: Line 5 hardcodes the URL as `const url = 'https://proyecto-wilsoon77.vercel.app';`.
  - **Manager test block**: Lines 143–146 navigate to `/admin/inventario/movimiento` and take a screenshot, but do not interact with the form or check constraints.
    ```javascript
    console.log('[MANAGER] Navegando a la bitácora de Movimiento de Inventario...');
    await page.goto(`${url}/admin/inventario/movimiento`, { waitUntil: 'networkidle' }).catch(() => {});
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(outputDir, 'manager_10_movimientos_inventario.png') });
    ```
- **File Checked**: `web/src/components/ui/toast.tsx`
  - **Toast exports**: On line 6, exports `ToastProvider` and `useToast` from `@/context/ToastContext`.

---

## 2. Logic Chain
1. **Role Context**: Since `useAuth()` provides `user` with `role` and `branch`, we can access `user?.role` and `user?.branch?.slug` to identify if the current user is a `MANAGER` or an `ADMIN`.
2. **Branch Constraints**: 
   - Since a manager is assigned to a specific branch, they should only register movements for that branch.
   - For single-branch movements, they must be locked to `user?.branch?.slug` on the active branch selector.
   - For transfer movements, they must be locked to `user?.branch?.slug` on the *fromBranch* (Origin) selector, while the *toBranch* (Destination) selector must remain editable so they can choose the target branch.
   - For admins, they have no branch restrictions and can select any branch.
   - Therefore, a `useEffect` can sync the selectors based on role, and `disabled` attributes can selectively lock them (e.g., `disabled={isManager}` for Origin and `disabled={isManager && movementType !== 'TRANSFERENCIA'}` for Destination).
3. **UoM Handling**: Because the database represents product inventory as discrete integer units (no base unit field like raw materials), the unit of measure is implicitly "unidades". Adding this text to the form improves clarity.
4. **"Registrar y agregar otro" submission**:
   - To prevent form redirection and UI replacement, we should bypass setting `submitSuccess(true)` if the user clicked "Registrar y agregar otro".
   - Using a ref `submitAndKeepOpenRef` allows us to detect which button was clicked.
   - Resetting only product/quantity/note/reference states while leaving `movementType` and branch states untouched fulfills the requirement.

---

## 3. Caveats
- **User branch presence**: If a user has role `MANAGER` but no `branch` is populated (e.g., due to seed issues or bad data), the selectors may fail to auto-select. The refactored code should gracefully handle null/undefined branches by keeping the select editable or showing a warning.
- **Verification URL**: The integration tests run against `https://proyecto-wilsoon77.vercel.app` which is a deployed production URL. To verify local changes, the script must be updated to support a local development port (e.g. `process.env.TEST_BASE_URL`).

---

## 4. Conclusion
The requested features can be implemented safely by updating `web/src/app/admin/inventario/movimiento/page.tsx` with role checking from the existing `useAuth()` hook, setting conditional `disabled` properties on the branch selectors, and adding a `submitAndKeepOpenRef` to conditionally clear states and trigger toast messages on submission.

---

## 5. Verification Method
- **Independent Verification**:
  1. Inspect `web/src/app/admin/inventario/movimiento/page.tsx` and ensure imports and selectors match the proposed logic.
  2. To run the integration tests locally, launch the local frontend server:
     ```powershell
     cd web; npm run dev
     ```
     And then execute the test suite locally using:
     ```powershell
     $env:TEST_BASE_URL="http://localhost:3000"; node web/test-integration-roles.mjs
     ```
  3. Validate that screenshots generated in `documentation/pruebas_roles/capturas/` show the expected UI behaviors.
