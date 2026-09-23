import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "./login.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const res = await axios.post('http://localhost:5000/api/auth/forgot-password', { email });
      setMessage(res.data.message);
      // Redirect to reset password page after 2 seconds
      setTimeout(() => {
        navigate('/reset-password', { state: { email } });
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send reset email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-form-wrapper">
        <div className="login-card">
          <h2 className="login-title">Forgot Password</h2>
          <p className="text-center mb-4">Enter your email address and we'll send you a 6-digit code to reset your password.</p>

          {error && <div className="error-alert">{error}</div>}
          {message && <div className="success-alert">{message}</div>}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label>Email address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="login-input"
              />
            </div>

            <div className="form-group">
              <button type="submit" className="login-button" disabled={loading}>
                {loading ? "Sending..." : "Send Reset Code"}
              </button>
            </div>
          </form>

          <div className="signup-link">
            <p>Remember your password? <Link to="/login">Back to Login</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
}
