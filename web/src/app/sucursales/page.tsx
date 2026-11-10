import { getPublicBranches } from '@/lib/catalog/public-api'
import { SucursalesClient } from '@/components/branches/SucursalesClient'

export const revalidate = 3600

export default async function SucursalesPage() {
  const branches = await getPublicBranches()
  return <SucursalesClient initialBranches={branches} />
}
