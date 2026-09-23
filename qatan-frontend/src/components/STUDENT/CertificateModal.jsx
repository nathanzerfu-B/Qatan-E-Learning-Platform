import React, { useRef } from "react";
import "./CertificateModal.css";

export default function CertificateModal({ studentName, courseTitle, instructorName, completionDate, onClose }) {
  const certId = useRef(`QTN-CERT-${Math.floor(100000 + Math.random() * 900000)}`);
  const formattedDate = completionDate ? new Date(completionDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }) : new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="cert-modal-overlay" onClick={onClose}>
      <div className="cert-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Actions Bar */}
        <div className="cert-modal-actions no-print">
          <button onClick={handlePrint} className="cert-btn cert-btn-primary">
            <span className="material-icons" style={{ fontSize: "1.1rem" }}>print</span>
            Print / Save as PDF
          </button>
          <button onClick={onClose} className="cert-btn cert-btn-close">
            <span className="material-icons" style={{ fontSize: "1.1rem" }}>close</span>
            Close
          </button>
        </div>

        {/* Certificate Printable Canvas */}
        <div className="cert-canvas" id="printable-certificate">
          <div className="cert-outer-border">
            <div className="cert-inner-border">
              {/* Header */}
              <div className="cert-header">
                <div className="cert-logo-mark">
                  <span className="material-icons" style={{ fontSize: "2.5rem", color: "#d97706" }}>school</span>
                </div>
                <h3 className="cert-academy-title">QATAN ONLINE ACADEMY</h3>
                <h1 className="cert-main-title">CERTIFICATE OF COMPLETION</h1>
                <p className="cert-subtitle">PROUDLY PRESENTED TO</p>
              </div>

              {/* Student Name */}
              <div className="cert-recipient-wrap">
                <h2 className="cert-recipient-name">{studentName || "Verified Student"}</h2>
                <div className="cert-name-underline" />
              </div>

              {/* Achievement Description */}
              <p className="cert-description">
                for successfully completing all curriculum modules, multimedia lectures, and formal examinations for the verified professional course:
              </p>

              {/* Course Title */}
              <div className="cert-course-badge">
                <h3 className="cert-course-name">{courseTitle || "Mastery Course"}</h3>
              </div>

              {/* Footer / Signatures */}
              <div className="cert-footer">
                <div className="cert-sig-block">
                  <div className="cert-sig-line">
                    <span className="cert-sig-script">{instructorName || "Academic Director"}</span>
                  </div>
                  <p className="cert-sig-label">Lead Instructor</p>
                </div>

                {/* Golden Seal */}
                <div className="cert-seal-wrap">
                  <div className="cert-gold-seal">
                    <span className="material-icons cert-seal-star">verified</span>
                    <span className="cert-seal-text">VERIFIED ACADEMIC</span>
                    <span className="cert-seal-year">{new Date().getFullYear()}</span>
                  </div>
                </div>

                <div className="cert-sig-block">
                  <div className="cert-sig-line">
                    <span className="cert-sig-date">{formattedDate}</span>
                  </div>
                  <p className="cert-sig-label">Date of Issuance</p>
                </div>
              </div>

              {/* Security ID Verification Code */}
              <div className="cert-meta-id">
                <span>Credential ID: <strong>{certId.current}</strong></span>
                <span>•</span>
                <span>Verified via Qatan E-Learning Platform</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
