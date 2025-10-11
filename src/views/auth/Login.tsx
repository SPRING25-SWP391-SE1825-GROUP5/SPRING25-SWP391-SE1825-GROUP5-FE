import { useState, useCallback, useEffect, useRef } from "react";
import type { FormEvent } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { syncFromLocalStorage } from "@/store/authSlice";
import { AuthService, googleAuthService } from "@/services/authService";
import { validateLoginFormV2 } from "@/utils/validation";
import { LOADING_MESSAGES } from "@/config/ui";
import logo from "@/assets/images/logo-black.webp";
import "./LoginPage.scss";
import toast from "react-hot-toast";

export default function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const authState = useAppSelector((state) => state.auth);

  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const googleBtnRef = useRef<HTMLDivElement | null>(null);


  const handleEmailOrPhoneChange = useCallback(
    (value: string) => {
      setEmailOrPhone(value);
      if (formError.emailOrPhone) {
        setFormError((prev) => ({ ...prev, emailOrPhone: "" }));
      }
      if (serverError) setServerError(null);
    },
    [formError.emailOrPhone, serverError]
  );

  const handlePasswordChange = useCallback(
    (value: string) => {
      setPassword(value);
      if (formError.password) {
        setFormError((prev) => ({ ...prev, password: "" }));
      }
      if (serverError) setServerError(null);
    },
    [formError.password, serverError]
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

    const validation = validateLoginFormV2({ emailOrPhone, password });
    if (!validation.isValid) {
      setFormError(validation.errors);
      return;
    }

    const loadingId = toast.loading(LOADING_MESSAGES.loggingIn);

    try {
      const result = await AuthService.login({ emailOrPhone, password });

      if (result.success) {
        toast.success("Đăng nhập thành công!");

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
        toast.error(result.message || "Đăng nhập thất bại!");
        setServerError(result.message || "Đăng nhập thất bại!");
      }
    } catch (error: unknown) {
      const errorMessage =
        (error as any)?.response?.data?.message ||
        (error as any)?.message ||
        "Đăng nhập thất bại";
      toast.error(errorMessage);
      setServerError(errorMessage);

      // Handle field-specific errors
      if ((error as any)?.response?.data?.errors) {
        const fieldErrors = (error as any).response.data.errors;
        const nextFormError: Record<string, string> = {};
        fieldErrors.forEach((msg: string) => {
          const m = msg.toLowerCase();
          if (m.includes("email") || m.includes("phone"))
            nextFormError.emailOrPhone = msg;
          if (m.includes("password")) nextFormError.password = msg;
        });
        setFormError(nextFormError);
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
    <div className="login">
      <div className="login__container">
        {/* Left side - Image/Visual */}
        <div className="login__visual">
          <div className="login__image-container">
            <img 
              src="/src/assets/images/ev-charging.svg" 
              alt="EV Service Center" 
              className="login__hero-image"
            />
            <div className="login__hero-content">
              <h2>Chào mừng đến EV Service Center</h2>
              <p>Dịch vụ bảo dưỡng và sửa chữa chuyên nghiệp cho xe điện của bạn</p>
            </div>
          </div>
        </div>

        {/* Right side - Login Form */}
        <div className="login__form-container">
        <h1 className="login__title">Đăng Nhập</h1>
        <p className="login__subtitle">
          Chưa có tài khoản?{" "}
          <Link to="/auth/register" className="login__signup-link">
            Đăng Ký
          </Link>
        </p>

        <div className="login__grid">
          {/* Left Column - Form */}
          <div className="login__form">
            <form onSubmit={onSubmit}>
              <div className="form-group">
                <label htmlFor="emailOrPhone" className="form-group__label">
                  Email hoặc Số điện thoại
                </label>
                <input
                  id="emailOrPhone"
                  type="text"
                  value={emailOrPhone}
                  onChange={(e) => handleEmailOrPhoneChange(e.target.value)}
                  className="form-group__input"
                  placeholder=" "
                  aria-invalid={!!formError.emailOrPhone}
                  required
                />

                {formError.emailOrPhone && (
                  <p className="login__error">{formError.emailOrPhone}</p>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="password" className="form-group__label">
                  Mật khẩu
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  className="form-group__input"
                  placeholder=" "
                  required
                />

                <Link to="/auth/forgot-password" className="form-group__forgot-link">
                  Quên mật khẩu?
                </Link>
                {formError.password && (
                  <p className="login__error">{formError.password}</p>
                )}
              </div>

              {serverError &&
                !formError.password &&
                !formError.emailOrPhone && (
                  <p className="login__error">{serverError}</p>
                )}

              <button type="submit" className="btn btn--primary">
                Tiếp tục
              </button>
            </form>
          </div>

          {/* Divider */}
          <div className="login__divider">
            <div className="login__divider-line"></div>
            <span className="login__divider-text">hoặc</span>
          </div>

          {/* Right Column - Social Login */}
          <div className="login__social">
            {/* Google Identity Services Button */}
            <div ref={googleBtnRef} className="google-button-container"></div>

            {/* Fallback button if Google button couldn't render */}
            <button
              type="button"
              className="btn btn--google btn--google-enhanced"
              onClick={onGoogleButtonClick}
              style={{ display: 'none' }}
            >
              <div className="btn__icon">
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              </div>
              <span className="btn__text">Tiếp tục với Google</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="login__footer">
          <div className="login__footer-links">
            <a href="/terms" className="login__footer-link">
              Điều khoản sử dụng
            </a>
            <span className="login__footer-separator">•</span>
            <a href="/privacy" className="login__footer-link">
              Chính sách bảo mật
            </a>
          </div>
          <p className="login__recaptcha">
            Trang web này được bảo vệ bởi reCAPTCHA Enterprise.{" "}
            <a
              href="https://policies.google.com/privacy"
              className="login__recaptcha-link"
            >
              Chính sách bảo mật của Google
            </a>{" "}
            và{" "}
            <a
              href="https://policies.google.com/terms"
              className="login__recaptcha-link"
            >
              Điều khoản dịch vụ
            </a>{" "}
            áp dụng.
          </p>
        </div>
        </div>
      </div>
    </div>
  );
}
