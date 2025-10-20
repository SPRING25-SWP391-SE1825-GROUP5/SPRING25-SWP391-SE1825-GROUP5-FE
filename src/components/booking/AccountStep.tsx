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
    </div>
  )
}

export default AccountStep