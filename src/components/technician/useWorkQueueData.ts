import { useState } from 'react'

export type SortBy = 'createdAt' | 'status' | 'serviceName' | 'customer' | 'licensePlate' | 'bookingId' | 'scheduledDate'
export type SortOrder = 'asc' | 'desc'

export function useWorkQueueData() {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [sortBy, setSortBy] = useState<SortBy>('createdAt')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

  const toggleRowSelected = (id: number, checked: boolean) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (checked) next.add(id); else next.delete(id)
      return next
    })
  }

  const toggleAllSelected = (ids: number[], checked: boolean) => {
    if (checked) setSelectedIds(new Set(ids))
    else setSelectedIds(new Set())
  }

  return {
    selectedIds,
    setSelectedIds,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    toggleRowSelected,
    toggleAllSelected,
  }
}
