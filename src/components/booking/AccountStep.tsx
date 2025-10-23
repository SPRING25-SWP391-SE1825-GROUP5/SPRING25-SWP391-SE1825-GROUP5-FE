import React from 'react'

interface AccountInfo {
  username: string
  password: string
  confirmPassword: string
}

interface AccountStepProps {
  data: AccountInfo
  onUpdate: (data: Partial<AccountInfo>) => void
  onNext: () => void
  onPrev: () => void
}

const AccountStep: React.FC<AccountStepProps> = ({ data, onUpdate, onNext, onPrev }) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (data.username && data.password && data.confirmPassword && data.password === data.confirmPassword) {
      onNext()
    }
  }

  return (
    <div className="account-step">
      <h2>Tạo tài khoản</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Tên đăng nhập *</label>
          <input
            type="text"
            value={data.username}
            onChange={(e) => onUpdate({ username: e.target.value })}
            required
          />
        </div>
        <div className="form-group">
          <label>Mật khẩu *</label>
          <input
            type="password"
            value={data.password}
            onChange={(e) => onUpdate({ password: e.target.value })}
            required
          />
        </div>
        <div className="form-group">
          <label>Xác nhận mật khẩu *</label>
          <input
            type="password"
            value={data.confirmPassword}
            onChange={(e) => onUpdate({ confirmPassword: e.target.value })}
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
        .account-step { 
          background: var(--bg-card); 
          border: 1px solid var(--border-primary); 
          border-radius: 12px; 
          padding: 1.25rem; 
          box-shadow: 0 2px 8px rgba(0,0,0,.04);
        }
        .account-step h2 { 
          font-size: 1.5rem; 
          font-weight: 700; 
          color: var(--text-primary); 
          margin: 0 0 1rem 0; 
        }
        .form-group { 
          display: flex; 
          flex-direction: column; 
          gap: .5rem; 
          margin-bottom: 1rem; 
        }
        .form-group label { 
          color: var(--text-primary); 
          font-weight: 600; 
          font-size: .95rem; 
        }
        .form-group input[type="text"],
        .form-group input[type="password"] { 
          width: 100%; 
          box-sizing: border-box; 
          background: #fff; 
          border: 1px solid var(--border-primary); 
          color: var(--text-primary); 
          border-radius: 8px; 
          padding: .6rem .75rem; 
          max-width: 420px;
        }
        .form-actions { 
          display: flex; 
          gap: .75rem; 
          justify-content: flex-start; 
          margin-top: .5rem; 
        }
        .btn-primary { 
          background: var(--progress-current); 
          color: #fff; 
          border: 1px solid var(--progress-current); 
          border-radius: 8px; 
          padding: .6rem 1rem; 
          cursor: pointer; 
          transition: filter .15s ease, transform .05s ease; 
        }
        .btn-primary:hover { filter: brightness(0.95); }
        .btn-primary:active { transform: translateY(1px); }
        .btn-secondary { 
          background: #fff; 
          color: var(--text-primary); 
          border: 1px solid var(--border-primary); 
          border-radius: 8px; 
          padding: .6rem 1rem; 
          cursor: pointer; 
          transition: background .15s ease; 
        }
        .btn-secondary:hover { background: var(--primary-50); }
        @media (max-width: 768px) {
          .form-group input[type="text"],
          .form-group input[type="password"] { max-width: 100%; }
          .form-actions { justify-content: stretch; }
        }
      `}</style>
    </div>
  )
}

export default AccountStep