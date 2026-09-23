import { useState, useEffect } from "react";
import { useNavigate, useLocation, useSearchParams, Link } from "react-router-dom";
import axios from "axios";
import "./login.css";

export default function ResetPassword() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Extract email from location state or query param
  const initialEmail = location.state?.email || searchParams.get("email") || "";
  const initialCode = searchParams.get("code") || "";

  const [step, setStep] = useState(1); // 1 = Enter Code, 2 = Set New Password
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState(initialCode);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Countdown timer for resend button
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // Step 1: Verify 6-digit code
  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!email.trim()) {
      setError("Please provide your email address.");
      return;
    }

    const cleanCode = code.trim();
    if (!cleanCode || cleanCode.length !== 6) {
      setError("Please enter the complete 6-digit code sent to your email.");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post("http://localhost:5000/api/auth/verify-reset-code", {
        email: email.trim(),
        code: cleanCode,
      });

      if (res.data.success) {
        setStep(2);
        setMessage("Code verified! Please create your new password.");
      } else {
        setError(res.data.message || "Invalid or expired code.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Invalid or expired reset code. Please check and try again.");
    } finally {
      setLoading(false);
    }
  };

  // Resend reset code
  const handleResendCode = async () => {
    if (resendCooldown > 0 || !email.trim()) return;
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const res = await axios.post("http://localhost:5000/api/auth/forgot-password", {
        email: email.trim(),
      });
      setMessage(res.data.message || "A new 6-digit reset code has been sent to your email.");
      setResendCooldown(60);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resend code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Submit new password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (!/[a-zA-Z]/.test(password) || !/[0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      setError("Password must contain both letters and numbers/symbols.");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post("http://localhost:5000/api/auth/reset-password", {
        email: email.trim(),
        code: code.trim(),
        newPassword: password,
      });

      setMessage(res.data.message || "Password reset successful! Redirecting to login...");
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-form-wrapper">
        <div className="login-card">
          <div style={{ textAlign: "center" }}>
            <span className="step-badge">
              Step {step} of 2: {step === 1 ? "Verify Code" : "New Password"}
            </span>
            <h2 className="login-title" style={{ marginBottom: "0.5rem" }}>
              {step === 1 ? "Enter Verification Code" : "Reset Your Password"}
            </h2>
            <p className="text-center" style={{ color: "#6b7280", fontSize: "0.875rem", marginBottom: "1.25rem" }}>
              {step === 1 ? (
                <>
                  Enter the 6-digit code sent to{" "}
                  <strong style={{ color: "#111827" }}>{email || "your email"}</strong>
                </>
              ) : (
                "Choose a strong password of at least 6 characters."
              )}
            </p>
          </div>

          {error && <div className="error-alert">{error}</div>}
          {message && <div className="success-alert">{message}</div>}

          {step === 1 ? (
            /* STEP 1: VERIFY CODE */
            <form onSubmit={handleVerifyCode} className="login-form">
              {!initialEmail && (
                <div className="form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="login-input"
                  />
                </div>
              )}

              <div className="form-group">
                <label>6-Digit Reset Code</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                  className="login-input otp-input"
                  autoFocus
                />
                <div className="otp-resend-wrapper">
                  <span>Didn't receive the code?</span>
                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={resendCooldown > 0 || loading}
                    className="otp-resend-btn"
                  >
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Code"}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <button
                  type="submit"
                  className="login-button"
                  disabled={loading || code.trim().length !== 6}
                >
                  {loading ? "Verifying..." : "Verify Code"}
                </button>
              </div>

              <div className="signup-link" style={{ marginTop: "1rem" }}>
                <p>
                  Need to change email?{" "}
                  <Link to="/forgot-password">Back to Forgot Password</Link>
                </p>
              </div>
            </form>
          ) : (
            /* STEP 2: ENTER NEW PASSWORD */
            <form onSubmit={handleResetPassword} className="login-form">
              <div className="form-group">
                <label>New Password</label>
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="login-input"
                    minLength={6}
                    autoFocus
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex="-1"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>Confirm New Password</label>
                <div className="password-input-wrapper">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="login-input"
                    minLength={6}
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    tabIndex="-1"
                  >
                    {showConfirmPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <button
                  type="submit"
                  className="login-button"
                  disabled={loading}
                >
                  {loading ? "Resetting Password..." : "Reset Password"}
                </button>
              </div>

              <div style={{ textAlign: "center", marginTop: "0.5rem" }}>
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setError("");
                    setMessage("");
                  }}
                  className="otp-resend-btn"
                  style={{ fontSize: "0.875rem" }}
                >
                  &larr; Back to verification code
                </button>
              </div>
            </form>
          )}

          <div className="signup-link">
            <p>
              Remember your password? <Link to="/login">Back to Login</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
