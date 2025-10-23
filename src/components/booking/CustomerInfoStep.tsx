import React from 'react'

interface CustomerInfo {
  fullName: string
  phone: string
  email: string
}

interface CustomerInfoStepProps {
  data: CustomerInfo
  onUpdate: (data: Partial<CustomerInfo>) => void
  onNext: () => void
  onPrev: () => void
}

const CustomerInfoStep: React.FC<CustomerInfoStepProps> = ({ data, onUpdate, onNext, onPrev }) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (data.fullName && data.phone && data.email) {
      onNext()
    }
  }

  return (
    <div className="customer-info-step">
      <h2>Thông tin khách hàng</h2>
      <form onSubmit={handleSubmit} className="cis-card">
        <div className="form-group">
          <label>Họ và tên *</label>
          <input
            type="text"
            value={data.fullName}
            onChange={(e) => onUpdate({ fullName: e.target.value })}
            required
          />
        </div>
        <div className="form-group">
          <label>Số điện thoại *</label>
          <input
            type="tel"
            value={data.phone}
            onChange={(e) => onUpdate({ phone: e.target.value })}
            required
          />
        </div>
        <div className="form-group">
          <label>Email *</label>
          <input
            type="email"
            value={data.email}
            onChange={(e) => onUpdate({ email: e.target.value })}
            required
          />
        </div>
        <div className="form-actions">
          <button type="button" onClick={onPrev} className="btn-secondary">
            Quay lại
          </button>
          <button type="submit" className="btn-primary">
            Tiếp theo
          </button>
        </div>
      </form>
      <style>{`
        .customer-info-step { 
          display: flex; 
          flex-direction: column; 
          align-items: center; 
          width: 100%; 
        }
        .customer-info-step h2 { 
          font-size: 1.5rem; 
          font-weight: 700; 
          color: var(--text-primary); 
          margin: 0 0 1.5rem 0; 
          text-align: center;
        }
        .cis-card { 
          background: var(--bg-card); 
          border: 1px solid var(--border-primary); 
          border-radius: 16px; 
          padding: 2rem; 
          box-shadow: 0 4px 20px rgba(0,0,0,.08);
          max-width: 480px;
          width: 100%;
          margin: 0 auto;
        }
        .form-group { 
          display: flex; 
          flex-direction: column; 
          gap: .75rem; 
          margin-bottom: 1.5rem; 
        }
        .form-group label { 
          color: var(--text-primary); 
          font-weight: 600; 
          font-size: .95rem; 
          margin-bottom: 0.25rem;
        }
        .form-group input[type="text"], .form-group input[type="tel"], .form-group input[type="email"] { 
          width: 100%; 
          box-sizing: border-box; 
          background: #fff; 
          border: 2px solid var(--border-primary); 
          color: var(--text-primary); 
          border-radius: 10px; 
          padding: .875rem 1rem; 
          font-size: 1rem;
          transition: all 0.2s ease;
        }
        .form-group input:focus {
          outline: none;
          border-color: var(--progress-current);
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        .form-actions { 
          display: flex; 
          justify-content: center; 
          gap: 1.25rem; 
          margin-top: 2.5rem; 
          padding-top: 1.5rem; 
          border-top: 1px solid var(--border-primary);
        }
        .btn-primary, .btn-secondary { 
          padding: .875rem 2.5rem; 
          border-radius: 10px; 
          font-weight: 600; 
          font-size: 1rem;
          cursor: pointer; 
          transition: all 0.3s ease;
          min-width: 140px;
          border: 2px solid transparent;
        }
        .btn-primary { 
          background: var(--progress-current); 
          color: #fff; 
          border: 2px solid var(--progress-current); 
        }
        .btn-primary:hover {
          background: var(--primary-600);
          border-color: var(--primary-600);
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
        }
        .btn-secondary { 
          background: #fff; 
          color: var(--text-primary); 
          border: 2px solid var(--border-primary); 
        }
        .btn-secondary:hover {
          background: var(--bg-secondary);
          border-color: var(--primary-500);
          color: var(--primary-500);
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
        }
        @media (max-width: 768px) { 
          .cis-card { 
            max-width: 100%; 
            padding: 1.5rem;
            margin: 0 1rem;
          }
          .customer-info-step h2 {
            font-size: 1.25rem;
            margin-bottom: 1rem;
          }
          .form-group {
            margin-bottom: 1.25rem;
          }
          .form-actions {
            flex-direction: column;
            gap: 1rem;
            margin-top: 2rem;
          }
          .btn-primary, .btn-secondary {
            width: 100%;
            min-width: auto;
            padding: 1rem 2rem;
          }
        }
      `}</style>
    </div>
  )
}

export default CustomerInfoStep