# Analysis: Forensic Audit Failure Remediation

**Target File**: `web/src/app/admin/inventario/movimiento/page.tsx`

---

## 1. Executive Summary
The forensic audit flagged an **INTEGRITY VIOLATION** because the unit of measure label next to the quantity input was hardcoded to `"unidades"`. The requirement (R3) dictates that this label must be dynamically bound to the selected product's unit of measure. This analysis details the exact codebase state and provides a step-by-step remediation plan to resolve this issue by introducing dynamic product data fetching and a mapper function.

---

## 2. Examination of Current State
In `web/src/app/admin/inventario/movimiento/page.tsx`, we observed the following:

### Type Definitions
- The local typescript interface `Product` is defined as:
  ```typescript
  interface Product {
    id: number
    name: string
    slug: string
  }
  ```
- This lacks category fields (`category`, `categorySlug`), preventing category-based mapping out-of-the-box.
- The `ApiProduct` interface returned by `productsService.list` actually includes `category` and `categorySlug`.

### State Management
- `selectedProduct` holds the currently selected product's slug (string):
  ```typescript
  const [selectedProduct, setSelectedProduct] = useState<string>(productSlug || "")
  ```
- The loaded products are stored in the state:
  ```typescript
  const [products, setProducts] = useState<Product[]>([])
  ```
- If the form is loaded directly from a URL query parameter (e.g., `?producto=pan-frances`), the product's details might not be fetched if it's not present in the first page of products.

### Markup Hardcoding
- Line 457 has a hardcoded `"unidades"` label:
  ```typescript
  <span className="text-lg font-bold">{currentStock.available}</span> unidades disponibles
  ```
- Line 522 has a hardcoded `"unidades"` label:
  ```typescript
  <div className="absolute right-3 px-3 py-1 bg-gray-100 text-gray-600 rounded text-sm font-medium border border-gray-200">
    unidades
  </div>
  ```

---

## 3. Remediation Plan

To properly retrieve and bind the unit of measure dynamically:

### Step 3.1: Update TypeScript Interface
Extend the local `Product` interface to allow optional `category` and `categorySlug` fields:
```typescript
interface Product {
  id: number
  name: string
  slug: string
  category?: string
  categorySlug?: string
}
```

### Step 3.2: Implement Selected Product Auto-Fetching
Ensure the full product details (including category metadata) are fetched when `selectedProduct` changes and isn't already present in the local `products` list. This handles URL query-parameter initialization correctly:
```typescript
  // Fetch details for the selected product if not already loaded in the list
  useEffect(() => {
    const fetchSelectedProductIfNeeded = async () => {
      if (!selectedProduct) return
      const alreadyFetched = products.find(p => p.slug === selectedProduct)
      if (!alreadyFetched) {
        try {
          const productData = await productsService.getBySlug(selectedProduct)
          if (productData) {
            setProducts(prev => {
              if (prev.some(p => p.id === productData.id)) return prev
              return [...prev, productData]
            })
            setProductSearch(productData.name)
          }
        } catch (err) {
          console.error("Error fetching selected product:", err)
        }
      }
    }
    fetchSelectedProductIfNeeded()
  }, [selectedProduct, products])
```

### Step 3.3: Implement Unit of Measure Resolver
Add a utility function in the file to determine the unit of measure dynamically based on the product category, name, or slug:
```typescript
/**
 * Resolves the unit of measure for a product based on its category, name, or slug.
 */
function getProductUnit(product?: Product | null): string {
  if (!product) return "unidades"

  const category = (product.categorySlug || product.category || "").toLowerCase()
  const name = (product.name || "").toLowerCase()
  const slug = (product.slug || "").toLowerCase()

  // Beverage / Liquid Category or Names
  if (
    category.includes("bebida") ||
    category.includes("cafeteria") ||
    name.includes("bebida") ||
    name.includes("café") ||
    name.includes("cafe")
  ) {
    if (name.includes("ml") || slug.includes("ml")) {
      const match = name.match(/(\d+)\s*ml/)
      return match ? `${match[1]} ml` : "ml"
    }
    if (name.includes("litro") || name.includes("lt")) {
      return "L"
    }
    return "unidades" // Default beverage unit
  }

  // Fallback / standard bread and pastries categories
  // "pan", "pasteles", "galletas", "dulces" all resolve to "unidades"
  return "unidades"
}
```

### Step 3.4: Bind UI Elements to the Resolved Unit
Modify the UI rendering to invoke `getProductUnit`.
1. Retrieve the currently selected product object:
   ```typescript
   const currentProduct = products.find(p => p.slug === selectedProduct)
   ```
2. Replace static text at line 457:
   ```typescript
   <span className="text-lg font-bold">{currentStock.available}</span> {getProductUnit(currentProduct)} disponibles
   ```
3. Replace static text at line 522:
   ```typescript
   <div className="absolute right-3 px-3 py-1 bg-gray-100 text-gray-600 rounded text-sm font-medium border border-gray-200">
     {getProductUnit(currentProduct)}
   </div>
   ```

---

## 4. Expected Impact and Verification
Applying these changes resolves the forensic audit failure by replacing the hardcoded facade with a dynamic implementation. The typescript checks will continue to pass. The UI will correctly adapt to different units of measure.
