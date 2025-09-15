import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useLocation } from 'react-router-dom'
import './register.scss'

export default function Register() {
  const location = useLocation()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const redirect = new URLSearchParams(location.search).get('redirect') || '/dashboard'

  const googleAuthUrl = useMemo(() => {
    const base = import.meta.env.VITE_API_BASE_URL || '/api'
    return `${base}/auth/google`
  }, [])

  function loginWithGoogle() {
    window.location.href = googleAuthUrl + (redirect ? `?redirect=${encodeURIComponent(redirect)}` : '')
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    // TODO: wire to real register API when backend is ready
    // For now just basic client validate
    if (password !== confirm) {
      alert('Mật khẩu xác nhận không khớp')
      return
    }
    alert('Đăng ký thành công (mock). Vui lòng đăng nhập!')
  }

  return (
    <section className="container py-4 register-page" style={{ minHeight: 'calc(100vh + 60px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="login-container" style={{ width: '100%', maxWidth: 960, display: 'grid', gridTemplateColumns: '0.9fr 1.1fr', gap: 24 }}>
        {/* Left card form */}
        <div className="auth-card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: 16, padding: '2rem', boxShadow: '0 10px 25px var(--shadow-light)' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>Tạo tài khoản</h1>

          <button type="button" onClick={loginWithGoogle} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 8, padding: '0.75rem 1rem', border: '1px solid var(--border-primary)', background: '#fff', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <img alt="Google" src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" style={{ width: 20, height: 20 }} />
            <span>Đăng ký bằng Google</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '1rem 0 1.25rem' }}>
            <div style={{ height: 1, background: 'var(--border-primary)', flex: 1 }} />
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>hoặc</span>
            <div style={{ height: 1, background: 'var(--border-primary)', flex: 1 }} />
          </div>

          <form className="space-y-4" onSubmit={onSubmit}>
            <div style={{ marginBottom: 12 }}>
              <label className="form-label" style={{ display: 'block', marginBottom: 6, fontSize: 14 }}>Họ và tên</label>
              <input
                className="form-input"
                style={{ width: '100%', borderRadius: 8, padding: '0.75rem 0.9rem' }}
                type="text"
                placeholder="Nguyễn Văn A"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label className="form-label" style={{ display: 'block', marginBottom: 6, fontSize: 14 }}>Email</label>
              <input
                className="form-input"
                style={{ width: '100%', borderRadius: 8, padding: '0.75rem 0.9rem' }}
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div style={{ marginBottom: 6 }}>
              <label className="form-label" style={{ display: 'block', marginBottom: 6, fontSize: 14 }}>Mật khẩu</label>
              <div style={{ position: 'relative' }}>
                <input
                  className="form-input"
                  style={{ width: '100%', borderRadius: 8, padding: '0.75rem 2.75rem 0.75rem 0.9rem' }}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button type="button" onClick={() => setShowPassword((v) => !v)} aria-label="Toggle password" style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                  {showPassword ? 'Ẩn' : 'Hiện'}
                </button>
              </div>
            </div>

            <div style={{ marginBottom: 6 }}>
              <label className="form-label" style={{ display: 'block', marginBottom: 6, fontSize: 14 }}>Xác nhận mật khẩu</label>
              <input
                className="form-input"
                style={{ width: '100%', borderRadius: 8, padding: '0.75rem 0.9rem' }}
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn-primary" style={{ width: '100%', padding: '0.85rem 1rem', borderRadius: 8 }}>
              Tạo tài khoản
            </button>
          </form>

          <p style={{ marginTop: 16, fontSize: 14, color: 'var(--text-secondary)' }}>
            Đã có tài khoản? <Link to={`/login${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''}`} style={{ color: 'var(--text-link)' }}>Đăng nhập</Link>
          </p>
        </div>

        {/* Right promo panel */}
        <div className="auth-left" style={{ background: 'linear-gradient(135deg, var(--primary-500), var(--secondary-500))', borderRadius: 16, padding: '2rem', color: 'var(--text-inverse)', boxShadow: '0 10px 30px var(--shadow-medium)' }}>
          <h2 style={{ color : 'white', fontSize: '2rem', fontWeight: 800, marginBottom: '0.75rem' }}>Gia nhập cộng đồng EV</h2>
          <p style={{ color : 'white',opacity: 0.9, lineHeight: 1.6 }}>Tạo tài khoản để nhận ưu đãi, lưu lịch sử bảo dưỡng và quản lý phương tiện của bạn.</p>
          <ul style={{ marginTop: '1.25rem', paddingLeft: '1.25rem' }}>
            <li>• Lưu thông tin xe và hồ sơ</li>
            <li>• Nhắc lịch bảo dưỡng định kỳ</li>
            <li>• Nhận tin khuyến mãi sớm</li>
          </ul>
        </div>
      </div>
    </section>
  )
}
