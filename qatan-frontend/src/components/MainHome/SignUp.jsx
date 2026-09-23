import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import "./signup.css";

export default function SignUp() {
  const [step, setStep] = useState(1);
  const [role, setRole] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [passKey, setPassKey] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(120); // 2 minutes in seconds
  const [attemptsLeft, setAttemptsLeft] = useState(3);
  const [resendEnabled, setResendEnabled] = useState(false);

  const navigate = useNavigate();

  // ✅ Proceed to next step
  const handleNext = async () => {
    if (step === 1) {
      // Validate step 1 fields
      if (!fullName.trim() || !email.trim() || !role || !password || !confirmPassword) {
        setError("Please fill in all required fields");
        return;
      }
      if (role === "instructor" && !passKey.trim()) {
        setError("Pass Key is required for instructors");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match");
        return;
      }
      if (password.length < 8) {
        setError("Password must be at least 8 characters long");
        return;
      }
      if (!/[a-zA-Z]/.test(password) || !/[0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        setError("Password must contain both letters and numbers/symbols");
        return;
      }

      // Validate instructor passkey upfront
      if (role === "instructor") {
        try {
          setLoading(true);
          const response = await axios.post("http://localhost:5000/api/instructor-applications/validate-passkey", {
            email,
            passkey: passKey,
          });
          if (!response.data.success) {
            setError(response.data.message);
            setLoading(false);
            return;
          }
        } catch (err) {
          console.error(err);
          setError(err.response?.data?.message || "Failed to validate passkey. Please try again.");
          setLoading(false);
          return;
        }
        setLoading(false);
      }

      setError(""); // Clear any previous errors
    }
    if (step < 3) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  // ✅ Discord Permission Request
  const handleDiscordPermission = async () => {
    setLoading(true);
    try {
      // First register the user
      const res = await axios.post("http://localhost:5000/api/auth/register", {
        name: fullName,
        email,
        password,
        role,
      });

      if (res.data.success) {
        // Then redirect to Discord OAuth
        window.location.href = `http://localhost:5000/api/auth/discord/login?email=${email}`;
      }
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message || "Failed to register. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // ✅ Register and send verification code
  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: fullName,
        email,
        password,
        role,
      };
      if (role === "instructor") {
        payload.passKey = passKey;
      }
      const res = await axios.post("http://localhost:5000/api/auth/register", payload);

      if (res.data.success) {
        // Initialize timer and attempts for verification step
        setTimer(120);
        setAttemptsLeft(3);
        setResendEnabled(false);
        // Proceed to verification step
        handleNext();
      }
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message || "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // ✅ Verify code and complete signup
  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setError("");

    if (!verificationCode || verificationCode.length !== 6) {
      setError("Please enter a valid 6-digit code");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(
        "http://localhost:5000/api/auth/verify-code",
        {
          email,
          code: verificationCode,
        }
      );

      if (res.data.success) {
        if (role === "student") {
          alert("🎉 Account verified successfully! You can now log in.");
          navigate("/login");
        } else if (role === "instructor") {
          // Redirect to Discord OAuth for instructors
          window.location.href = `http://localhost:5000/api/auth/discord/login?email=${email}`;
        }
      }
    } catch (err) {
      console.error(err);
      const errorMessage =
        err.response?.data?.message || "Verification failed. Please try again.";
      setError(errorMessage);

      // Update attempts left based on error
      if (errorMessage === "Incorrect code.") {
        setAttemptsLeft((prev) => prev - 1);
      } else if (
        errorMessage === "Code expired, please resend." ||
        errorMessage === "Maximum attempts reached, please resend."
      ) {
        setResendEnabled(true);
      }
    } finally {
      setLoading(false);
    }
  };

  // ✅ Handle resend code
  const handleResendCode = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.post(
        "http://localhost:5000/api/auth/resend-code",
        {
          email,
        }
      );

      if (res.data.success) {
        // Reset timer, attempts, disable resend
        setTimer(120);
        setAttemptsLeft(3);
        setResendEnabled(false);
        setVerificationCode("");
        alert("New verification code sent!");
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to resend code.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Timer effect
  useEffect(() => {
    let interval;
    if (step === 3 && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            setResendEnabled(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  // ✅ UI Steps
  return (
    <div className="signup-container">
      <header className="signup-header">
        <div className="container flex justify-between">
          <div className="signup-logo flex items-center gap-2">
            <svg
              fill="none"
              viewBox="0 0 48 48"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M4 4H17.3334V17.3334H30.6666V30.6666H44V44H4V4Z"
                fill="currentColor"
              ></path>
            </svg>
            <h1>Qatan</h1>
          </div>
          <Link to="/login" className="signup-login-btn">
            Log In
          </Link>
        </div>
      </header>

      <main className="signup-main">
        <div className="signup-form-container">
          <h2 className="signup-title">Create your account</h2>
          {error && <div className="error-alert">{error}</div>}

          {/* STEP 1 — Personal Info */}
          {step === 1 && (
            <div className="signup-form-card">
              <div className="signup-form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  required
                  className="signup-input"
                />
              </div>

              <div className="signup-form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="signup-input"
                />
              </div>

              <div className="signup-form-group">
                <label>Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="signup-select"
                  required
                >
                  <option value="" disabled>
                    Select your role
                  </option>
                  <option value="student">Student</option>
                  <option value="instructor">Instructor</option>
                </select>
              </div>

              {role === "instructor" && (
                <div className="signup-form-group">
                  <label>Pass Key</label>
                  <input
                    type="text"
                    value={passKey}
                    onChange={(e) => setPassKey(e.target.value)}
                    placeholder="Enter instructor pass key"
                    required
                    className="signup-input"
                  />
                </div>
              )}

              <div className="signup-form-group">
                <label>Password</label>
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="signup-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="password-toggle-btn"
                  >
                    👁
                  </button>
                </div>
              </div>

              <div className="signup-form-group">
                <label>Confirm Password</label>
                <div className="password-input-wrapper">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    required
                    className="signup-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="password-toggle-btn"
                  >
                    👁
                  </button>
                </div>
              </div>

              <div className="signup-btn-row">
                <button onClick={handleNext} className="signup-btn">
                  Next
                </button>
              </div>
            </div>
          )}

          {/* STEP 2 — Register and Send Code */}
          {step === 2 && (
            <div className="signup-form-card">
              <h3 className="signup-title">Complete Registration</h3>
              <p className="signup-subtitle">
                We'll send a verification code to your email address.
              </p>

              <button
                onClick={handleRegister}
                disabled={loading}
                className="signup-btn"
              >
                {loading ? "Sending..." : "Send Verification Code"}
              </button>

              <div className="signup-btn-row">
                <button onClick={handleBack} className="signup-btn-secondary">
                  Back
                </button>
              </div>
            </div>
          )}

          {/* STEP 3 — Email Verification */}
          {step === 3 && (
            <div className="signup-form-card">
              <h3 className="signup-title">Verify Your Email</h3>
              <p className="signup-subtitle">
                We've sent a 6-digit verification code to {email}
              </p>

              <div className="signup-form-group">
                <label>Verification Code</label>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) =>
                    setVerificationCode(
                      e.target.value.replace(/\D/g, "").slice(0, 6)
                    )
                  }
                  placeholder="Enter 6-digit code"
                  maxLength="6"
                  className="signup-input"
                  style={{
                    textAlign: "center",
                    fontSize: "18px",
                    letterSpacing: "2px",
                  }}
                />
              </div>

              {/* Timer and Attempts Display */}
              <div className="verification-info">
                <p>
                  Time remaining: {Math.floor(timer / 60)}:
                  {(timer % 60).toString().padStart(2, "0")}
                </p>
                <p>Attempts left: {attemptsLeft}</p>
              </div>

              <button
                onClick={handleVerifyCode}
                disabled={loading || verificationCode.length !== 6}
                className="signup-btn"
              >
                {loading ? "Verifying..." : "Verify & Complete"}
              </button>

              {/* Resend Code Button */}
              <button
                onClick={handleResendCode}
                disabled={!resendEnabled || loading}
                className={`signup-btn-secondary ${
                  !resendEnabled ? "disabled" : ""
                }`}
                style={{ marginTop: "10px" }}
              >
                {loading ? "Sending..." : "Resend Code"}
              </button>

              <div className="signup-btn-row">
                <button onClick={handleBack} className="signup-btn-secondary">
                  Back
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
