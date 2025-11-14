import React from 'react';

type OrderItemsTableProps = {
  orderId: number | string
  items: any[]
  isLoading: boolean
  fulfillmentCenterName?: string
};

export default function OrderItemsTable({
  orderId,
  items,
  isLoading,
  fulfillmentCenterName = 'Chưa chọn',
}: OrderItemsTableProps) {
  const columns = [
    { key: 'code', label: 'Mã', width: 80 },
    { key: 'partNumber', label: 'Mã SP', width: 120 },
    { key: 'name', label: 'Tên phụ tùng' },
    { key: 'brand', label: 'Thương hiệu', width: 120 },
    { key: 'quantity', label: 'Số lượng', width: 120 },
    { key: 'unitPrice', label: 'Đơn giá', width: 160 },
    { key: 'center', label: 'Chi nhánh', width: 200 },
  ];

  const skeletonRows = Array.from({ length: 3 });

  return (
    <table className={`orders-items-grid ${isLoading ? 'is-loading' : ''}`} style={{ margin: 0, width: '100%' }}>
      <thead>
        <tr>
          {columns.map(col => (
            <th key={col.key} style={col.width ? { width: col.width } : undefined}>
              <span>{col.label}</span>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {isLoading ? (
          skeletonRows.map((_, rowIdx) => (
            <tr key={`loading-${rowIdx}`}>
              {columns.map(col => (
                <td key={col.key}>
                  <div className="skeleton-bar" />
                </td>
              ))}
            </tr>
          ))
        ) : !items || items.length === 0 ? (
          <tr>
            <td colSpan={columns.length} className="order-items-empty">Không có sản phẩm</td>
          </tr>
        ) : (
          items.map((it: any, idx: number) => {
            const partId = it.partId || it.PartId || it.id || it.Id || idx + 1;
            const partNumber = it.partNumber || it.PartNumber || '';
            const name = it.partName || it.PartName || it.name || it.Name || `Item #${idx + 1}`;
            const brand = it.brand || it.Brand || '';
            const imageUrl = it.imageUrl || it.ImageUrl || '';
            const rating = it.rating || it.Rating;
            const qty = it.quantity || it.Quantity || it.qty || 0;
            const unitPrice = it.unitPrice || it.UnitPrice || it.price || it.Price || 0;
            const formatPrice = (n: number) =>
              new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n || 0);

            return (
              <tr key={`${orderId}-${partId}-${idx}`}>
                <td>#{partId}</td>
                <td className="order-item-number">{partNumber || '-'}</td>
                <td>
                  <div className="order-item-name">
                    {imageUrl && (
                      <img
                        src={imageUrl}
                        alt={name}
                        className="order-item-thumb"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    )}
                    <div className="order-item-text">
                      <div className="order-item-title">{name}</div>
                      {rating !== null && rating !== undefined && (
                        <div className="order-item-rating">⭐ {Number(rating).toFixed(1)}</div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="order-item-brand">{brand || '-'}</td>
                <td>{qty}</td>
                <td>{formatPrice(unitPrice)}</td>
                <td className="order-item-center">{fulfillmentCenterName}</td>
              </tr>
            );
          })
        )}
      </tbody>
    </table>
  );
}


