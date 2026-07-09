# Analysis Report: Inventory Movement Registration Panel & Integration Test Suite

## Executive Summary
This report analyzes the front-end page `web/src/app/admin/inventario/movimiento/page.tsx` and the integration tests in `web/test-integration-roles.mjs` to propose a refactoring plan that implements role-based branch constraints, a units of measure display, and a "Registrar y agregar otro" form submission workflow.

---

## 1. Inventory Movement Registration Panel Analysis

### A. Current Handling of Products, Branches, and Roles/Users
- **Products**: Loaded from `productsService.list({ pageSize: 20 })` during initial mount and dynamically updated via a search query debounce function (`searchProducts`). The selected product's `slug` is stored in the `selectedProduct` state.
- **Branches**: Loaded from `branchesService.list()` and stored in the `branches` state. The origin and destination branch slug values are stored in `movementFromBranch` and `movementToBranch` respectively.
- **Roles/Users**: The page imports `useAuth` from `@/context/AuthContext` and destructures `const { user } = useAuth()`. However, the `user` object is currently unused in the component logic. 
  - `user.role` represents the active user's role (e.g., `'ADMIN'`, `'MANAGER'`).
  - `user.branch` contains the assigned branch details (e.g., `{ slug: 'some-slug', name: 'Some Branch' }`) or is `null` if no branch is assigned (common for admins).

### B. Product Search & Select Inputs Structure
Located inside the form container under the "Producto" card (lines 328–350):
1. **Search Input**: Text input mapped to `productSearch`. When changed, it calls `handleProductSearchChange`, which implements a 400ms debounce before invoking `searchProducts` to fetch products matching the search query.
2. **Select Dropdown**: Lists options mapped from `products` filtered by `productSearch`. The selected option sets `selectedProduct` to the product's `slug`.

### C. Branch Selector & Role-based Branch Restrictions
The selectors are `<select>` dropdowns:
- **Origin Branch Selector**: Rendered if `requiresFromBranch` is true for the active `movementType`. Mapped to `movementFromBranch` state.
- **Destination Branch Selector**: Rendered if `requiresToBranch` is true for the active `movementType`. Mapped to `movementToBranch` state.

#### Recommended Role-Based Rules:
1. **Manager Constraint**:
   - Identify if `user?.role === 'MANAGER'`.
   - If yes, automatically pre-select `user?.branch?.slug` for any required branch:
     - For non-transfer movements (e.g., `PRODUCCION`, `MERMA`), only one branch selector is shown. It must automatically select `user?.branch?.slug` and be `disabled`.
     - For transfer movements (`TRANSFERENCIA`), both branch selectors are shown. The **Origin** selector must be locked (`disabled`) to `user?.branch?.slug` to prevent managers from moving stock out of branches they do not manage. The **Destination** selector must remain enabled (`disabled={false}`) to allow them to select where the stock is going.
2. **Admin Control**:
   - Identify if `user?.role === 'ADMIN'`.
   - Both branch selectors remain fully enabled (`disabled={false}`) and allow selecting any branch.

### D. Quantity Input & Unit of Measure (UoM)
- Located on lines 412–419, mapping `movementQuantity` to a number input.
- **Unit of Measure Handling**: Finished products in the database (`schema.prisma` -> `Product` model) do not have a unit of measure field (unlike raw materials which use the `BaseUnit` enum like `LB` or `ML`). Instead, finished products are always managed in discrete units (`Int` physical units).
- **Recommendation**: Since finished products are always tracked in discrete units, UoM is implicitly "unidades" (units/pieces). The UI hardcodes "unidades" when displaying current stock:
  ```typescript
  <span className="text-lg font-bold">{currentStock.available}</span> unidades disponibles
  ```
  We should render the label `"unidades"` next to the quantity input to make this explicit and aligned with other inventory panels.

### E. Form Submission & "Registrar y agregar otro" Button
- **Current Flow**: `handleSubmit` performs API calls via `inventoryService.createMovement(data)`. On success, it sets `submitSuccess` to true. This completely replaces the form UI with a success screen and triggers a redirection to `/admin/inventario` after 2 seconds.
- **Refactored Flow for "Registrar y agregar otro"**:
  1. Introduce a ref `submitAndKeepOpenRef = useRef(false)` to distinguish which button triggered submission.
  2. Implement two submit buttons at the bottom of the page:
     - **Registrar Movimiento** (Standard): Triggers form submit with `submitAndKeepOpenRef.current = false`.
     - **Registrar y agregar otro** (New): Triggers form submit with `submitAndKeepOpenRef.current = true`.
  3. Modify the success block in `handleSubmit`:
     - If `submitAndKeepOpenRef.current` is `true`:
       - Show a toast notification: `showToast("Movimiento registrado con éxito", "success")`.
       - Reset product and quantity states: `setSelectedProduct("")`, `setProductSearch("")`, `setMovementQuantity(1)`, `setMovementNote("")`, `setMovementReference("")`.
       - **Do not** set `submitSuccess` to `true` (which would close the form) and **do not** redirect.
     - If `submitAndKeepOpenRef.current` is `false`:
       - Run standard flow: `setSubmitSuccess(true)` and trigger redirection.

---

## 2. Integration Test Suite Analysis

### A. How Inventory Movement Registration is Tested
The Playwright integration suite (`web/test-integration-roles.mjs`) contains test blocks for four user roles:
1. **Baker**: Logs in, goes to `/admin/produccion`, selects a recipe, writes a note, and registers a bake (production log).
2. **Cashier**: Logs in, goes to `/admin/pos`, adds a product to the cart, and clicks "Cobrar" to create a sale.
3. **Manager**: Logs in, navigates to `/admin/inventario`, `/admin/productos`, and `/admin/inventario/movimiento` (our panel). It only takes a screenshot of the panel (`manager_10_movimientos_inventario.png`) but **does not actually submit** a stock movement form or verify the role-based branch selection constraint.
4. **Admin**: Logs in, checks various administrative panels (Dashboard, Users, Branches, Audit Log, POS).

### B. How to Execute the Playwright Tests
The tests are standalone Node scripts invoking Playwright APIs directly rather than using the `@playwright/test` framework runner.
- **Command**:
  ```bash
  node web/test-integration-roles.mjs
  ```
- **Configuration**:
  - The base URL is hardcoded as `const url = 'https://proyecto-wilsoon77.vercel.app'`.
  - Captures are saved to `documentation/pruebas_roles/capturas/`.

---

## 3. Recommended Refactoring Strategy

### Phase 1: Modify `page.tsx`
#### 1. Import `useToast`
```typescript
import { useToast } from "@/components/ui/toast"
```

#### 2. Get Toast Hook and Identify Roles
Inside `MovimientoForm`:
```typescript
const { showToast } = useToast()
const submitAndKeepOpenRef = useRef(false)

const isManager = user?.role === 'MANAGER'
const managerBranchSlug = user?.branch?.slug || ""
```

#### 3. Update Pre-selection Logic in `useEffect`
Automatically select the manager's assigned branch:
```typescript
useEffect(() => {
  if (isManager && managerBranchSlug) {
    if (movementType === 'TRANSFERENCIA') {
      setMovementFromBranch(managerBranchSlug)
    } else {
      const config = MOVEMENT_TYPES[movementType]
      if (config.requiresFromBranch) {
        setMovementFromBranch(managerBranchSlug)
      }
      if (config.requiresToBranch) {
        setMovementToBranch(managerBranchSlug)
      }
    }
  }
}, [movementType, isManager, managerBranchSlug])
```

#### 4. Apply `disabled` Properties to Selects
For **Sucursal origen**:
```typescript
disabled={isManager} // Locked to manager's branch for all movements (including transfers)
```
For **Sucursal destino**:
```typescript
disabled={isManager && movementType !== 'TRANSFERENCIA'} // Locked for single-branch movements, editable for transfers
```

#### 5. Refactor `handleSubmit` to Handle "Registrar y agregar otro"
```typescript
// Replace lines 254-260:
await inventoryService.createMovement(data)

if (submitAndKeepOpenRef.current) {
  showToast("Movimiento registrado con éxito", "success")
  // Clear product and quantity but keep type/branch
  setSelectedProduct("")
  setProductSearch("")
  setMovementQuantity(1)
  setMovementNote("")
  setMovementReference("")
} else {
  setSubmitSuccess(true)
  setTimeout(() => {
    router.push("/admin/inventario")
  }, 2000)
}
```

#### 6. Render the New Button
Inside the form button group:
```typescript
<div className="flex items-center justify-end gap-4 pt-4">
  <Link href="/admin/inventario">
    <Button type="button" variant="outline" size="lg">
      Cancelar
    </Button>
  </Link>
  
  {/* New button */}
  <Button
    type="submit"
    variant="secondary"
    size="lg"
    disabled={isSubmitting}
    onClick={() => { submitAndKeepOpenRef.current = true }}
  >
    {isSubmitting && submitAndKeepOpenRef.current ? (
      <>
        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
        Registrando...
      </>
    ) : (
      <>
        <Plus className="h-4 w-4 mr-2" />
        Registrar y agregar otro
      </>
    )}
  </Button>

  <Button 
    type="submit" 
    size="lg"
    disabled={isSubmitting}
    onClick={() => { submitAndKeepOpenRef.current = false }}
    className="min-w-[200px]"
  >
    {isSubmitting && !submitAndKeepOpenRef.current ? (
      <>
        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
        Registrando...
      </>
    ) : (
      <>
        <Save className="h-4 w-4 mr-2" />
        Registrar Movimiento
      </>
    )}
  </Button>
</div>
```

---

### Phase 2: Enhance Integration Tests (`test-integration-roles.mjs`)
1. **Dynamic Base URL**:
   Change:
   ```javascript
   const url = process.env.TEST_BASE_URL || 'https://proyecto-wilsoon77.vercel.app';
   ```
   This allows local validation against `http://localhost:3000` via:
   ```bash
   $env:TEST_BASE_URL="http://localhost:3000"; node web/test-integration-roles.mjs
   ```
2. **Expand Manager Test Block**:
   Enhance the MANAGER role test to:
   - Select a product, write a quantity, and test form submission.
   - Verify that when the manager loads the page, their branch is pre-selected and the dropdown is disabled.
   - Test both standard submit (asserting redirection) and "Registrar y agregar otro" (asserting toast and reset fields).
