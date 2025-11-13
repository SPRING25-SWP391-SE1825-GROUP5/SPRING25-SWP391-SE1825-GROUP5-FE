import { useState, useEffect } from 'react'
import { TechnicianService } from '@/services/technicianService'
import type { User } from '@/store/authSlice'

export const useWorkQueueIds = (user: User | null, mode: 'technician' | 'staff') => {
  const [technicianId, setTechnicianId] = useState<number | null>(null)
  const [centerId, setCenterId] = useState<number | null>(null)
  const [idsResolved, setIdsResolved] = useState(false)

  useEffect(() => {
    const resolveIds = async () => {
      setIdsResolved(false)
      setTechnicianId(null)
      setCenterId(null)

      const userId = user?.id
      if (userId) {
        try {
          if (mode === 'technician') {
            const cacheKey = `technicianId_${userId}`
            const cached = localStorage.getItem(cacheKey)
            if (cached) {
              const parsed = Number(cached)
              if (Number.isFinite(parsed) && parsed > 0) {
                setTechnicianId(parsed)
                setIdsResolved(true)
                return
              }
            }
          } else {
            const cacheKey = `staffCenterId_${userId}`
            const cached = localStorage.getItem(cacheKey)
            if (cached) {
              const parsed = Number(cached)
              if (Number.isFinite(parsed) && parsed > 0) {
                setCenterId(parsed)
                setIdsResolved(true)
                return
              }
            }
            // Fallback: preferredCenterId (manual selection)
            const preferred = localStorage.getItem('preferredCenterId')
            if (preferred) {
              const parsed = Number(preferred)
              if (Number.isFinite(parsed) && parsed > 0) {
                setCenterId(parsed)
                try { localStorage.setItem(cacheKey, String(parsed)) } catch {}
                setIdsResolved(true)
                return
              }
            }
          }
        } catch {}

        // 2) Gọi API tương ứng để lấy id
        try {
          if (mode === 'technician' && Number.isFinite(Number(userId))) {
            const result = await TechnicianService.getTechnicianIdByUserId(Number(userId))
            if (result?.success && result?.data?.technicianId) {
              setTechnicianId(result.data.technicianId)
              try { localStorage.setItem(`technicianId_${userId}`, String(result.data.technicianId)) } catch {}
              setIdsResolved(true)
              return
            }
          }
          if (mode === 'staff') {
            const { StaffService } = await import('@/services/staffService')
            try {
              const assign = await StaffService.getCurrentStaffAssignment()
              if (assign?.centerId) {
                setCenterId(assign.centerId)
                try { localStorage.setItem(`staffCenterId_${userId}`, String(assign.centerId)) } catch {}
                setIdsResolved(true)
                return
              }
            } catch {}
          }
        } catch (e) {
          setTechnicianId(null)
          setCenterId(null)
          setIdsResolved(true)
          return
        }
      }

      // 3) Fallback: null nếu không resolve được
      setTechnicianId(null)
      setCenterId(null)
      setIdsResolved(true)
    }

    resolveIds()
  }, [user?.id, mode])

  return { technicianId, centerId, idsResolved, setTechnicianId, setCenterId }
}

