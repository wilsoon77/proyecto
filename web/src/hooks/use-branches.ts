"use client"

import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { branchesService } from '@/lib/api'
import type { ApiBranch } from '@/lib/api/types'
import {
  getStoredBranchSlug,
  resolveBranchSelection,
  SELECTED_BRANCH_CHANGE_EVENT,
  SELECTED_BRANCH_STORAGE_KEY,
  setStoredBranchSlug,
} from '@/lib/branches'

export const branchKeys = {
  all: ['branches'] as const,
  lists: () => [...branchKeys.all, 'list'] as const,
  details: () => [...branchKeys.all, 'detail'] as const,
  detail: (id: number) => [...branchKeys.details(), id] as const,
}

interface UseBranchesReturn {
  branches: ApiBranch[]
  isLoading: boolean
  isFetching: boolean
  error: Error | null
  refetch: () => void
}

export function useBranches(options = {}): UseBranchesReturn {
  const queryInfo = useQuery({
    queryKey: branchKeys.lists(),
    queryFn: () => branchesService.list(),
    ...options,
  })

  return {
    branches: queryInfo.data || [],
    isLoading: queryInfo.isLoading,
    isFetching: queryInfo.isFetching,
    error: queryInfo.error as Error | null,
    refetch: queryInfo.refetch,
  }
}

// Hook para sucursal individual
interface UseBranchReturn {
  branch: ApiBranch | null
  isLoading: boolean
  isFetching: boolean
  error: Error | null
  refetch: () => void
}

export function useBranch(id: number, options = {}): UseBranchReturn {
  const queryInfo = useQuery({
    queryKey: branchKeys.detail(id),
    queryFn: () => branchesService.getById(id),
    enabled: !!id,
    ...options,
  })

  return {
    branch: queryInfo.data || null,
    isLoading: queryInfo.isLoading,
    isFetching: queryInfo.isFetching,
    error: queryInfo.error as Error | null,
    refetch: queryInfo.refetch,
  }
}

export function useSelectedBranch() {
  const { branches, isLoading, error } = useBranches()
  const [storedSlug, setStoredSlug] = useState<string | null>(null)
  const [hasHydratedStorage, setHasHydratedStorage] = useState(false)

  useEffect(() => {
    const sync = () => {
      setStoredSlug(getStoredBranchSlug())
      setHasHydratedStorage(true)
    }

    sync()

    const handleStorage = (event: StorageEvent) => {
      if (event.key === SELECTED_BRANCH_STORAGE_KEY) {
        sync()
      }
    }

    window.addEventListener(SELECTED_BRANCH_CHANGE_EVENT, sync)
    window.addEventListener('storage', handleStorage)
    return () => {
      window.removeEventListener(SELECTED_BRANCH_CHANGE_EVENT, sync)
      window.removeEventListener('storage', handleStorage)
    }
  }, [])

  const selectedBranch = resolveBranchSelection(branches, storedSlug)

  useEffect(() => {
    if (!hasHydratedStorage || !selectedBranch) return
    if (storedSlug !== selectedBranch.slug) {
      setStoredBranchSlug(selectedBranch.slug)
    }
  }, [hasHydratedStorage, selectedBranch, storedSlug])

  return {
    branches,
    selectedBranch,
    selectedBranchSlug: selectedBranch?.slug ?? storedSlug ?? undefined,
    isLoading: isLoading || !hasHydratedStorage,
    error,
  }
}
