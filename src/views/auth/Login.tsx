import { useState, useCallback, useEffect, useRef } from "react";
import type { FormEvent } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { syncFromLocalStorage } from "@/store/authSlice";
import { AuthService, googleAuthService } from "@/services/authService";
import { validateLoginFormV2 } from "@/utils/validation";
import { LOADING_MESSAGES } from "@/config/ui";
import { handleApiError, showSuccessToast } from "@/utils/errorHandler";
import toast from "react-hot-toast";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const authState = useAppSelector((state) => state.auth);

  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const googleBtnRef = useRef<HTMLDivElement | null>(null);


  const handleEmailOrPhoneChange = useCallback(
    (value: string) => {
      setEmailOrPhone(value);
      if (formError.emailOrPhone) {
        setFormError((prev) => ({ ...prev, emailOrPhone: "" }));
      }
      if (fieldErrors.emailOrPhone) {
        setFieldErrors((prev) => ({ ...prev, emailOrPhone: "" }));
      }
      if (serverError) setServerError(null);
    },
    [formError.emailOrPhone, fieldErrors.emailOrPhone, serverError]
  );

  const handlePasswordChange = useCallback(
    (value: string) => {
      setPassword(value);
      if (formError.password) {
        setFormError((prev) => ({ ...prev, password: "" }));
      }
      if (fieldErrors.password) {
        setFieldErrors((prev) => ({ ...prev, password: "" }));
      }
      if (serverError) setServerError(null);
    },
    [formError.password, fieldErrors.password, serverError]
  );

  const redirect = new URLSearchParams(location.search).get("redirect");
  // Prevent redirect loop back to login
  const safeRedirect =
    redirect && !redirect.startsWith("/auth/login") ? redirect : null;

  // Function to determine redirect path based on user role
  const getRedirectPath = useCallback(
    (userRole: string | undefined) => {
      if (safeRedirect) return safeRedirect;

      // Default to customer if role is undefined or null
      const role = (userRole || "customer").toLowerCase();

      switch (role) {
        case "admin":
          return "/admin";
        case "staff":
          return "/staff";
        case "technician":
          return "/technician";
        case "manager":
          return "/manager";
        case "customer":
        default:
          return "/";
      }
    },
    [safeRedirect]
  );


  // Callback khi Google trả về ID token
  const handleGoogleCredential = useCallback(
    async (response: { credential: string }) => {
      const idToken = response?.credential
      if (!idToken) return

      const loadingId = toast.loading("Đang xác thực Google...")
      try {
        const result = await AuthService.loginWithGoogle({ token: idToken })
        if (result.success) {
          toast.success("Đăng nhập Google thành công!")
          localStorage.setItem("token", result.data.token)
          localStorage.setItem("user", JSON.stringify(result.data.user))
          dispatch(syncFromLocalStorage())
          const userRole = result.data.user?.role || "customer"
          const redirectPath = getRedirectPath(userRole)
          
          // Small delay to ensure state is fully synced
          setTimeout(() => {
            navigate(redirectPath, { replace: true });
          }, 100);
        } else {
          toast.error(result.message || "Đăng nhập Google thất bại!")
        }
      } catch (error) {
        toast.error("Đăng nhập Google thất bại. Vui lòng thử lại.")
      } finally {
        toast.dismiss(loadingId)
      }
    },
    [dispatch, getRedirectPath, navigate]
  )

  // Check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user && user.role) {
          // Sync Redux state with localStorage
          dispatch(syncFromLocalStorage());

          const redirectPath = getRedirectPath(user.role);
          navigate(redirectPath, { replace: true });
        }
      } catch (error) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }
  }, [navigate, getRedirectPath, dispatch]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setServerError(null);
    setFormError({});
    setFieldErrors({});

    const validation = validateLoginFormV2({ emailOrPhone, password });
    if (!validation.isValid) {
      setFormError(validation.errors);
      setFieldErrors(validation.errors);
      return;
    }

    const loadingId = toast.loading(LOADING_MESSAGES.loggingIn);

    try {
      const result = await AuthService.login({ emailOrPhone, password });

      if (result.success) {
        showSuccessToast("Đăng nhập thành công!");

        // Store token and user data in localStorage
        localStorage.setItem("token", result.data.token);
        localStorage.setItem("user", JSON.stringify(result.data.user));

        // Sync Redux state with localStorage
        dispatch(syncFromLocalStorage());

        // Navigate based on user role with small delay to ensure state sync
        const redirectPath = getRedirectPath(result.data.user?.role);
        
        // Small delay to ensure state is fully synced
        setTimeout(() => {
          navigate(redirectPath, { replace: true });
        }, 100);
      } else {
        // Xử lý lỗi từ AuthService response
        if (result.errors && Array.isArray(result.errors)) {
          // Hiển thị lỗi đầu tiên dưới dạng toast
          handleApiError({ message: result.errors[0] });
          setServerError(result.errors[0]);
          
          // Xử lý field-specific errors
          const nextFormError: Record<string, string> = {};
          const nextFieldErrors: Record<string, string> = {};
          
          result.errors.forEach((msg: string) => {
            const m = msg.toLowerCase();
            if (m.includes("email") || m.includes("phone")) {
              nextFormError.emailOrPhone = msg;
              nextFieldErrors.emailOrPhone = msg;
            }
            if (m.includes("password")) {
              nextFormError.password = msg;
              nextFieldErrors.password = msg;
            }
          });
          
          // Cập nhật form errors nếu có
          if (Object.keys(nextFormError).length > 0) {
            setFormError(nextFormError);
          }
          if (Object.keys(nextFieldErrors).length > 0) {
            setFieldErrors(nextFieldErrors);
          }
        } else {
          handleApiError({ message: result.message });
          setServerError(result.message || "Đăng nhập thất bại!");
        }
      }
    } catch (error: unknown) {
      handleApiError(error);
      setServerError("Đăng nhập thất bại!");

      // Handle field-specific errors
      if ((error as any)?.response?.data?.errors) {
        const apiFieldErrors = (error as any).response.data.errors;
        const nextFormError: Record<string, string> = {};
        const nextFieldErrors: Record<string, string> = {};
        
        // Handle both array and object formats
        if (Array.isArray(apiFieldErrors)) {
          apiFieldErrors.forEach((msg: string) => {
            const m = msg.toLowerCase();
            if (m.includes("email") || m.includes("phone")) {
              nextFormError.emailOrPhone = msg;
              nextFieldErrors.emailOrPhone = msg;
            }
            if (m.includes("password")) {
              nextFormError.password = msg;
              nextFieldErrors.password = msg;
            }
          });
        } else if (typeof apiFieldErrors === 'object') {
          // Handle object format like { Email: ["Error message"] }
          Object.entries(apiFieldErrors).forEach(([field, messages]) => {
            const fieldName = field.toLowerCase();
            const errorMsg = Array.isArray(messages) ? messages[0] : messages;
            
            if (fieldName.includes("email") || fieldName.includes("phone")) {
              nextFormError.emailOrPhone = errorMsg;
              nextFieldErrors.emailOrPhone = errorMsg;
            }
            if (fieldName.includes("password")) {
              nextFormError.password = errorMsg;
              nextFieldErrors.password = errorMsg;
            }
          });
        }
        
        setFormError(nextFormError);
        setFieldErrors(nextFieldErrors);
      }
    } finally {
      toast.dismiss(loadingId);
    }
  };

  const onGoogleButtonClick = useCallback(async () => {
    try {
      // Khởi tạo GIS nếu chưa sẵn sàng
      const inited = await googleAuthService.initialize(handleGoogleCredential)
      if (!inited) {
        toast.error("Không thể khởi tạo Google. Vui lòng tải lại trang.")
        return
      }
      const shown = await googleAuthService.prompt()
      if (!shown) {
        toast.error("Không thể hiển thị Google Sign In. Vui lòng thử lại.")
      }
    } catch (error) {
      toast.error("Lỗi xác thực Google. Vui lòng thử lại.")
    }
  }, [handleGoogleCredential]);

  // Initialize Google Identity Services and render the button
  useEffect(() => {
    let mounted = true
    ;(async () => {
      const inited = await googleAuthService.initialize(handleGoogleCredential)
      if (!mounted) return
      if (inited && googleBtnRef.current) {
        googleAuthService.renderButton(googleBtnRef.current)
      }
    })()
    return () => {
      mounted = false
    }
  }, [handleGoogleCredential])

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      {/* Overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'white',
        animation: 'fadeIn 0.3s ease-out'
      }} />

      {/* Modal Container */}
      <div className="modal-container" style={{
        position: 'relative',
        background: 'white',
        borderRadius: '16px',
        width: '1000px',
        height: '650px',
        maxHeight: '90vh',
        overflow: 'hidden',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
        animation: 'slideUp 0.3s ease-out',
        color: '#2d3748',
        display: 'flex'
      }}>
        {/* Left Side - Visual Area (500px) */}
        <div style={{
          width: '500px',
          background: 'linear-gradient(135deg, #10b981, #059669)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative'
        }}>
          {/* Visual Content */}
          <div style={{
            color: 'white',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '64px',
              marginBottom: '24px'
            }}>
              🚗
            </div>
            <div style={{
              fontSize: '32px',
              fontWeight: '700',
              color: 'white',
              marginBottom: '8px'
            }}>
              EV Service
            </div>
            <div style={{
              fontSize: '18px',
              color: 'rgba(255, 255, 255, 0.8)',
              marginBottom: '24px'
            }}>
              Center
            </div>
            <div style={{
              fontSize: '16px',
              color: 'rgba(255, 255, 255, 0.9)',
              lineHeight: '1.6',
              maxWidth: '300px'
            }}>
              Dịch vụ bảo dưỡng và sửa chữa chuyên nghiệp cho xe điện của bạn
            </div>
          </div>
        </div>

        {/* Right Side - Form (500px) */}
        <div style={{
          width: '500px',
          padding: '80px 60px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          background: 'white'
        }}>
          {/* Title */}
          <h1 style={{
            fontSize: '32px',
            fontWeight: '700',
            color: '#2d3748',
            margin: '0 0 12px 0',
            textAlign: 'left',
            lineHeight: '1.2'
          }}>
            Đăng nhập
          </h1>
          
          {/* Subtitle */}
          <p style={{
            fontSize: '16px',
            color: '#4a5568',
            margin: '0 0 32px 0',
            textAlign: 'left',
            lineHeight: '1.5'
          }}>
            Chưa có tài khoản?{" "}
            <Link 
              to="/auth/register" 
              style={{
                color: '#10b981',
                textDecoration: 'none',
                fontWeight: '500'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#059669'
                e.currentTarget.style.textDecoration = 'underline'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#10b981'
                e.currentTarget.style.textDecoration = 'none'
              }}
            >
              Đăng ký
            </Link>
          </p>

        {/* Form */}
        <form onSubmit={onSubmit}>
          {/* Email/Phone Field */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '16px',
              color: fieldErrors.emailOrPhone ? '#f87171' : '#2d3748',
              marginBottom: '8px',
              fontWeight: '500',
              transition: 'color 0.3s ease'
            }}>
              Email
            </label>
            <input
              type="text"
              value={emailOrPhone}
              onChange={(e) => handleEmailOrPhoneChange(e.target.value)}
              placeholder=" "
              required
              style={{
                width: '100%',
                padding: '16px 20px',
                border: `1.5px solid ${fieldErrors.emailOrPhone ? '#f87171' : '#e2e8f0'}`,
                borderRadius: '12px',
                background: 'white',
                color: '#2d3748',
                fontSize: '16px',
                transition: 'all 0.3s ease',
                boxSizing: 'border-box',
                outline: 'none',
                height: '56px'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#10b981'
                e.currentTarget.style.background = 'white'
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.2)'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = fieldErrors.emailOrPhone ? '#f87171' : '#e2e8f0'
                e.currentTarget.style.background = 'white'
                e.currentTarget.style.boxShadow = 'none'
              }}
            />
            {fieldErrors.emailOrPhone && (
              <div style={{
                color: '#f87171',
                fontSize: '12px',
                marginTop: '8px',
                animation: 'slideDown 0.3s ease-out'
              }}>
                {fieldErrors.emailOrPhone}
              </div>
            )}
          </div>

          {/* Password Field */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '16px',
              color: fieldErrors.password ? '#f87171' : '#2d3748',
              marginBottom: '8px',
              fontWeight: '500',
              transition: 'color 0.3s ease'
            }}>
              Mật khẩu
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                placeholder=" "
                required
                style={{
                  width: '100%',
                  padding: '16px 50px 16px 20px',
                  border: `1.5px solid ${fieldErrors.password ? '#f87171' : '#e2e8f0'}`,
                  borderRadius: '12px',
                  background: 'white',
                  color: '#2d3748',
                  fontSize: '16px',
                  transition: 'all 0.3s ease',
                  boxSizing: 'border-box',
                  outline: 'none',
                  height: '56px'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#10b981'
                  e.currentTarget.style.background = 'white'
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.2)'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = fieldErrors.password ? '#f87171' : '#e2e8f0'
                  e.currentTarget.style.background = 'white'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#6b7280',
                  transition: 'color 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#10b981'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#6b7280'
                }}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <Link 
              to="/auth/forgot-password" 
              style={{
                display: 'inline-block',
                marginTop: '6px',
                fontSize: '14px',
                color: '#10b981',
                textDecoration: 'none',
                fontWeight: '500'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.textDecoration = 'underline'
                e.currentTarget.style.color = '#059669'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.textDecoration = 'none'
                e.currentTarget.style.color = '#10b981'
              }}
            >
              Quên mật khẩu?
            </Link>
            {fieldErrors.password && (
              <div style={{
                color: '#f87171',
                fontSize: '12px',
                marginTop: '8px',
                animation: 'slideDown 0.3s ease-out'
              }}>
                {fieldErrors.password}
              </div>
            )}
          </div>

          {/* Server Error */}
          {serverError && !formError.password && !formError.emailOrPhone && (
            <div style={{
              color: '#f87171',
              fontSize: '14px',
              marginBottom: '16px',
              textAlign: 'left',
              fontWeight: '500'
            }}>
              {serverError}
            </div>
          )}

          {/* Submit Button */}
          <button 
            type="submit" 
            style={{
              width: '100%',
              padding: '18px 24px',
              background: 'linear-gradient(90deg, #10b981, #059669)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
              marginBottom: '20px',
              height: '56px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(90deg, #059669, #047857)'
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.4)'
              e.currentTarget.style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(90deg, #10b981, #059669)'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            Tiếp tục
          </button>
        </form>

        {/* Divider */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'rgba(255, 255, 255, 0.6)',
          fontSize: '14px',
          margin: '20px 0',
          opacity: 0.9
        }}>
          <div style={{
            flex: 1,
            height: '1px',
            background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
            margin: '0 12px'
          }}></div>
          <span>hoặc</span>
          <div style={{
            flex: 1,
            height: '1px',
            background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
            margin: '0 12px'
          }}></div>
        </div>

        {/* Google Login */}
        <div style={{ marginBottom: '20px' }}>
          <div ref={googleBtnRef} style={{ display: 'flex', justifyContent: 'center' }}></div>
        </div>

        {/* Footer */}
        <div style={{
          fontSize: '13px',
          color: 'rgba(255, 255, 255, 0.6)',
          lineHeight: '1.6',
          textAlign: 'center'
        }}>
          <div style={{ marginBottom: '8px' }}>
            <a href="/terms" style={{
              color: '#60a5fa',
              textDecoration: 'none',
              fontWeight: '500'
            }}>
              Điều khoản sử dụng
            </a>
            <span style={{ margin: '0 8px' }}>•</span>
            <a href="/privacy" style={{
              color: '#60a5fa',
              textDecoration: 'none',
              fontWeight: '500'
            }}>
              Chính sách bảo mật
            </a>
          </div>
        </div>
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
            max-height: 0;
          }
          to {
            opacity: 1;
            transform: translateY(0);
            max-height: 100px;
          }
        }
        
        input::placeholder {
          color: rgba(255, 255, 255, 0.6);
        }
        
        @media (max-width: 1000px) {
          .modal-container {
            width: 90% !important;
            max-width: 700px !important;
            height: auto !important;
            flex-direction: column !important;
          }
          
          .modal-container > div:first-child {
            width: 100% !important;
            height: 280px !important;
          }
          
          .modal-container > div:last-child {
            width: 100% !important;
            padding: 50px 40px !important;
          }
        }
        
        @media (max-width: 480px) {
          .modal-container {
            padding: 24px !important;
            margin: 16px !important;
          }
        }
      `}</style>
    </div>
  );
}
