import { useMemo } from 'react'
import { Clock, CheckCircle2, Wrench, CheckCircle, Package, XCircle } from 'lucide-react'
import type { WorkOrder } from './workQueueTypes'

export const useWorkQueueStats = (workQueue: WorkOrder[]) => {
  const stats = useMemo(() => {
    const statsData = [
      {
        label: 'Chờ xác nhận',
        value: workQueue.filter(w => w.status === 'pending').length,
        color: '#8b5cf6',
        icon: Clock,
        bgColor: 'rgba(139, 92, 246, 0.1)'
      },
      {
        label: 'Đã xác nhận',
        value: workQueue.filter(w => w.status === 'confirmed').length,
        color: '#3b82f6',
        icon: CheckCircle2,
        bgColor: 'rgba(59, 130, 246, 0.1)'
      },
      {
        label: 'Đang làm việc',
        value: workQueue.filter(w => w.status === 'in_progress').length,
        color: '#8b5cf6',
        icon: Wrench,
        bgColor: 'rgba(139, 92, 246, 0.1)'
      },
      {
        label: 'Hoàn thành',
        value: workQueue.filter(w => w.status === 'completed').length,
        color: '#10b981',
        icon: CheckCircle,
        bgColor: 'rgba(16, 185, 129, 0.1)'
      },
      {
        label: 'Đã thanh toán',
        value: workQueue.filter(w => w.status === 'paid').length,
        color: '#059669',
        icon: Package,
        bgColor: 'rgba(5, 150, 105, 0.1)'
      },
      {
        label: 'Đã hủy',
        value: workQueue.filter(w => w.status === 'cancelled').length,
        color: '#ef4444',
        icon: XCircle,
        bgColor: 'rgba(239, 68, 68, 0.1)'
      }
    ]
    return statsData
  }, [workQueue])

  return stats
}

