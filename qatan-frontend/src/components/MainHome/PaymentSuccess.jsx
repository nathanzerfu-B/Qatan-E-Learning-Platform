import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./MainIndex.css";

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [verifying, setVerifying] = useState(true);
  const [status, setStatus] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const verifyPayment = async () => {
      const tx_ref = searchParams.get("tx_ref");
      if (!tx_ref) {
        setStatus("error");
        setMessage("Invalid payment reference");
        setVerifying(false);
        return;
      }

      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          `http://localhost:5000/api/payments/verify/${tx_ref}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (response.data.success) {
          setStatus("success");
          setMessage("Payment verified successfully!");
        } else {
          setStatus("error");
          setMessage(response.data.error || "Payment verification failed");
        }
      } catch (error) {
        console.error("Payment verification error:", error);
        setStatus("error");
        setMessage(error.response?.data?.error || "Failed to verify payment");
      } finally {
        setVerifying(false);
      }
    };

    verifyPayment();
  }, [searchParams]);

  // ✅ Remove automatic redirect
  const handleContinue = () => {
    if (status === "success") {
      navigate("/student/home", { replace: true });
    } else {
      navigate("/courses", { replace: true });
    }
  };

  if (verifying) {
    return (
      <div className="Main-payment-success-container">
        <div className="Main-payment-success-card">
          <div className="Main-loading-spinner"></div>
          <h2 className="Main-payment-success-title">Verifying Payment</h2>
          <p className="Main-payment-success-message">
            Please wait while we verify your payment...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="Main-payment-success-container">
      <div className="Main-payment-success-card">
        <div className={`Main-payment-status-icon ${status}`}>
          {status === "success" ? (
            <svg
              className="Main-success-icon"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4"></path>
            </svg>
          ) : (
            <svg
              className="Main-error-icon"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          )}
        </div>

        <h2 className="Main-payment-success-title">
          {status === "success" ? "Payment Successful!" : "Payment Failed"}
        </h2>

        <p className="Main-payment-success-message">{message}</p>

        {/* ✅ Keep the Continue button */}
        <button onClick={handleContinue} className="Main-payment-continue-btn">
          {status === "success" ? "Continue to Dashboard" : "Back to Courses"}
        </button>

        {/* Optional: Add a receipt button or link */}
        {status === "success" && (
          <a
            href={`http://localhost:5000/api/payments/receipt/${searchParams.get("tx_ref")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="Main-payment-receipt-btn"
          >
            View Receipt
          </a>
        )}
      </div>
    </div>
  );
}
