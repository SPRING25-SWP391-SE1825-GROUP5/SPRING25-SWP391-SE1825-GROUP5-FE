import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { login } from '@/store/authSlice'
import './login.scss'

export default function Login() {
  const dispatch = useAppDispatch()
  const { loading, error, token } = useAppSelector((s) => s.auth)
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const redirect = new URLSearchParams(location.search).get('redirect') || '/dashboard'

  const googleAuthUrl = useMemo(() => {
    const base = import.meta.env.VITE_API_BASE_URL || '/api'
    return `${base}/auth/google`
  }, [])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const result = await dispatch(login({ email, password }))
    if ((result as any).meta.requestStatus === 'fulfilled') {
      navigate(redirect, { replace: true })
    }
  }

  function loginWithGoogle() {
    window.location.href = googleAuthUrl + (redirect ? `?redirect=${encodeURIComponent(redirect)}` : '')
  }

  if (token) {
    navigate(redirect, { replace: true })
    return null
  }

  return (
    <section className="container py-4 auth-page" style={{ minHeight: 'calc(100vh - 80px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="login-container" style={{ width: '100%', maxWidth: 960, display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 24 }}>
        {/* Left promo panel */}
        <div className="auth-left" style={{ background: 'linear-gradient(135deg, var(--primary-500), var(--secondary-500))', borderRadius: 16, padding: '2rem', color: 'var(--text-inverse)', boxShadow: '0 10px 30px var(--shadow-medium)' }}>
          <h2 style={{ color : 'white',fontSize: '2rem', fontWeight: 800, marginBottom: '0.75rem' }}>Chào mừng quay lại!</h2>
          <p style={{ color : 'white',opacity: 0.9, lineHeight: 1.6 }}>Đăng nhập để đặt lịch bảo dưỡng, theo dõi tiến độ và quản lý hồ sơ xe điện của bạn.</p>
          <ul className="features-list" style={{ marginTop: '1.25rem', paddingLeft: '1.25rem' }}>
            <li>• Đặt lịch online nhanh chóng</li>
            <li>• Theo dõi trạng thái thời gian thực</li>
            <li>• Ưu đãi dành riêng cho thành viên</li>
          </ul>
        </div>

        {/* Right card form */}
        <div className="auth-card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: 16, padding: '2rem', boxShadow: '0 10px 25px var(--shadow-light)' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>Đăng nhập</h1>

          <button type="button" className="google-btn" onClick={loginWithGoogle} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 8, padding: '0.75rem 1rem', border: '1px solid var(--border-primary)', background: '#fff', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <img alt="Google" src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" style={{ width: 20, height: 20 }} />
            <span>Đăng nhập bằng Google</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '1rem 0 1.25rem' }}>
            <div style={{ height: 1, background: 'var(--border-primary)', flex: 1 }} />
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>hoặc</span>
            <div style={{ height: 1, background: 'var(--border-primary)', flex: 1 }} />
          </div>

          <form className="space-y-4" onSubmit={onSubmit}>
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

            {error && (
              <p style={{ color: 'var(--error-500)', fontSize: 14, marginTop: 4 }}>{error}</p>
            )}

            <button type="submit" className="btn-primary login-btn" style={{ width: '100%', padding: '0.85rem 1rem', borderRadius: 8 }} disabled={loading}>
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </form>

          <p style={{ marginTop: 16, fontSize: 14, color: 'var(--text-secondary)' }}>
            Chưa có tài khoản? <Link to={`/register${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''}`} style={{ color: 'var(--text-link)' }}>Đăng ký ngay</Link>
          </p>
        </div>
      </div>
    </section>
  )
}
