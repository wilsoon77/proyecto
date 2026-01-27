"use client"

import { useState, useEffect, useCallback } from "react"
import { branchesService } from "@/lib/api"
import type { ApiBranch } from "@/lib/api/types"

interface UseBranchesReturn {
  branches: ApiBranch[]
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useBranches(): UseBranchesReturn {
  const [branches, setBranches] = useState<ApiBranch[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchBranches = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await branchesService.list()
      setBranches(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error cargando sucursales'))
      console.error('Error fetching branches:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBranches()
  }, [fetchBranches])

  return {
    branches,
    isLoading,
    error,
    refetch: fetchBranches,
  }
}

// Hook para sucursal individual
interface UseBranchReturn {
  branch: ApiBranch | null
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useBranch(id: number): UseBranchReturn {
  const [branch, setBranch] = useState<ApiBranch | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchBranch = useCallback(async () => {
    if (!id) return
    
    setIsLoading(true)
    setError(null)
    try {
      const data = await branchesService.getById(id)
      setBranch(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error cargando sucursal'))
      console.error('Error fetching branch:', err)
    } finally {
      setIsLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchBranch()
  }, [fetchBranch])

  return {
    branch,
    isLoading,
    error,
    refetch: fetchBranch,
  }
}
