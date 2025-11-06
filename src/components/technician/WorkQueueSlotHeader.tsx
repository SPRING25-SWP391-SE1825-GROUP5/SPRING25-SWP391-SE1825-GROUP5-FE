import React from 'react'

interface Props {
  slotKey: string
  count: number
}

export default function WorkQueueSlotHeader({ slotKey, count }: Props) {
  return (
    <tr style={{ background: '#FFF8E6' }}>
      <td colSpan={7} style={{ borderTop: '1px solid #FFD875', borderBottom: '1px solid #FFD875', padding: '8px 12px', fontSize: 13, color: '#374151' }}>
        <span style={{ fontWeight: 500 }}>{slotKey || 'Chưa xác định'}</span>
        <span style={{ marginLeft: 8, fontSize: 12, color: '#6B7280' }}>({count} booking)</span>
      </td>
    </tr>
  )
}


