## 2026-07-09T03:34:58Z

Implement the remediation of the Forensic Audit Failure in `web/src/app/admin/inventario/movimiento/page.tsx`.

1. Modify `web/src/app/admin/inventario/movimiento/page.tsx`:
   - Extend local `Product` interface:
     ```typescript
     interface Product {
       id: number
       name: string
       slug: string
       category?: string
       categorySlug?: string
     }
     ```
   - Implement a `useEffect` hook to fetch selected product details if not already present in the local `products` list, ensuring that when the page is loaded with a `producto` URL parameter, the product's category metadata is retrieved correctly:
     ```typescript
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
   - Implement the `getProductUnit` utility function:
     ```typescript
     function getProductUnit(product?: Product | null): string {
       if (!product) return "unidades"
       const category = (product.categorySlug || product.category || "").toLowerCase()
       const name = (product.name || "").toLowerCase()
       const slug = (product.slug || "").toLowerCase()
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
         return "unidades"
       }
       return "unidades"
     }
     ```
   - Dynamically bind the UI labels to the resolved product unit of measure:
     - Get `currentProduct` from the products list matching `selectedProduct`.
     - Replace the hardcoded stock status label with `getProductUnit(currentProduct)`.
     - Replace the hardcoded quantity suffix badge with `getProductUnit(currentProduct)`.

2. Verification:
   - Ensure the Next.js dev server builds successfully (`npm run build` or running `npm run dev` check).
   - Run the Playwright integration tests locally using:
     `$env:TEST_BASE_URL="http://localhost:3000"; node web/test-integration-roles.mjs`
     Verify that all tests pass.
   - Save your handoff report at `c:\Users\wilso\Documents\FrameworksrProjects\React\proyecto-panaderia\.agents\worker_2\handoff.md`.
