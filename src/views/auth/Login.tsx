import { useState, useCallback, useEffect, useRef } from "react";
import type { FormEvent } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { syncFromLocalStorage } from "@/store/authSlice";
import { AuthService, googleAuthService } from "@/services/authService";
import { LOADING_MESSAGES } from "@/config/ui";
import { handleApiError, showSuccessToast } from "@/utils/errorHandler";
import toast from "react-hot-toast";
import { Eye, EyeOff } from "lucide-react";
import "./LoginGlass.scss";

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
          
          // Check if email is verified - for customers, redirect to verification if not verified
          const user = result.data.user;
          const userRole = (user?.role || 'customer').toLowerCase();
          const isCustomer = userRole === 'customer';
          
          // If customer and email not verified, redirect to email verification
          if (isCustomer && user && !user.emailVerified) {
            const emailParam = user.email ? `?email=${encodeURIComponent(user.email)}` : '';
            const target = new URLSearchParams(location.search).get('redirect')
            // If redirecting from verification page, keep redirect param
            if (target && target.includes('/auth/verify-email')) {
              setTimeout(() => {
                navigate(target, { replace: true });
              }, 100);
            } else {
              setTimeout(() => {
                navigate(`/auth/verify-email${emailParam}`, { replace: true });
              }, 100);
            }
            return;
          }
          
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

    // Bỏ validation client-side, để server validate
    // Chỉ validate email/phone cơ bản
    if (!emailOrPhone.trim()) {
      toast.error('Vui lòng nhập email hoặc số điện thoại');
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

        // Check if email is verified - for customers, redirect to verification if not verified
        const user = result.data.user;
        const userRole = (user?.role || 'customer').toLowerCase();
        const isCustomer = userRole === 'customer';
        
        // If customer and email not verified, redirect to email verification
        if (isCustomer && user && !user.emailVerified) {
          const emailParam = user.email ? `?email=${encodeURIComponent(user.email)}` : '';
          setTimeout(() => {
            navigate(`/auth/verify-email${emailParam}`, { replace: true });
          }, 100);
          return;
        }
        
        // Navigate based on user role with small delay to ensure state sync
        const redirectPath = getRedirectPath(userRole);
        
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
    <div className="login-glass">
      {/* Background với Workshop Image */}
      <div className="login-glass__background" />

      {/* Glassmorphism Card */}
      <div className="login-glass__card">
        {/* Header */}
        <div className="login-glass__header">
          <h1 className="login-glass__title">Đăng nhập</h1>
          <p className="login-glass__subtitle">
            Chưa có tài khoản?{" "}
            <Link to="/auth/register">Đăng ký</Link>
          </p>
        </div>

        {/* Form */}
        <form className="login-glass__form" onSubmit={onSubmit}>
          {/* Server Error */}
          {serverError && !formError.password && !formError.emailOrPhone && (
            <div className="login-glass__server-error">
              {serverError}
            </div>
          )}

          {/* Email/Phone Field */}
          <div className="login-glass__form-group">
            <label className={fieldErrors.emailOrPhone ? 'error' : ''}>
              Email
            </label>
            <input
              type="text"
              className={`login-glass__input ${fieldErrors.emailOrPhone ? 'error' : ''}`}
              value={emailOrPhone}
              onChange={(e) => handleEmailOrPhoneChange(e.target.value)}
              placeholder="email@example.com"
              required
            />
            {fieldErrors.emailOrPhone && (
              <div className="login-glass__error">
                {fieldErrors.emailOrPhone}
              </div>
            )}
          </div>

          {/* Password Field */}
          <div className="login-glass__form-group login-glass__form-group--password">
            <label>Mật khẩu</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? "text" : "password"}
                className={`login-glass__input login-glass__input--password ${fieldErrors.password ? 'error' : ''}`}
                value={password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                className="login-glass__password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <Link to="/auth/forgot-password" className="login-glass__forgot-link">
              Quên mật khẩu?
            </Link>
          </div>

          {/* Submit Button */}
          <button type="submit" className="login-glass__button login-glass__button--submit">
            Tiếp tục
          </button>
        </form>

        {/* Divider */}
        <div className="login-glass__divider">hoặc</div>

        {/* Google Login */}
        <div className="login-glass__google-container">
          <div ref={googleBtnRef}></div>
        </div>

        {/* Footer */}
        <div className="login-glass__footer">
          <div>
            <a href="/terms">Điều khoản sử dụng</a>
            <span>•</span>
            <a href="/privacy">Chính sách bảo mật</a>
          </div>
        </div>
      </div>
    </div>
  );
}
