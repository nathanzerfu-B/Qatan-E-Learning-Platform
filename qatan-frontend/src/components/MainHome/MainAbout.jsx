import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext.jsx";
import "./MainIndex.css";
import "./MainAbout.css";

export default function About() {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const [useGmail, setUseGmail] = useState(false);
  const [gmailLinkedBanner, setGmailLinkedBanner] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
    } else {
      setName("");
      setEmail("");
    }
  }, [user]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("gmailLinked") === "1") {
      setGmailLinkedBanner(true);
      const url = new URL(window.location.href);
      url.searchParams.delete("gmailLinked");
      window.history.replaceState({}, "", url.toString());
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess(null);
    setError(null);

    if (!user) {
      if (!name.trim() || !email.trim() || !message.trim()) {
        setError("Please fill in all fields.");
        return;
      }
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!re.test(email.trim())) {
        setError("Please enter a valid email address.");
        return;
      }
    } else {
      if (!message.trim()) {
        setError("Message is required.");
        return;
      }
    }

    setSubmitting(true);
    try {
      const url = "http://localhost:5000/api/contact/send";
      let headers = {};
      let payload = {};
      if (user) {
        const token = localStorage.getItem("token");
        if (token) headers["Authorization"] = `Bearer ${token}`;
        payload = { message, useGmail };
      } else {
        payload = { name, email, message };
      }
      const res = await axios.post(url, payload, { headers });

      if (res.data?.requiresAuth && res.data?.authUrl) {
        window.location.href = res.data.authUrl;
        return;
      }

      if (res.data?.success) {
        setSuccess(
          res.data?.via === "gmail"
            ? "Your message has been sent via your Gmail account!"
            : "Your message has been sent successfully!"
        );
        setMessage("");
        if (!user) {
          setName("");
          setEmail("");
        }
        setUseGmail(false);
      } else {
        setError(res.data?.message || "Failed to send message.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send message.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="Main-space-y-12 about-page">
      <header className="Main-text-center">
        <h1 className="Main-text-3xl Main-sm:text-4xl Main-md:text-5xl Main-font-bold Main-mb-4 Main-text-black">
          About Qatan.
        </h1>
        <p className="Main-text-base Main-sm:text-lg Main-text-black Main-leading-relaxed Main-max-w-2xl Main-mx-auto">
          We provide practical courses and hands-on projects to help learners
          reach their goals.
        </p>
      </header>

      {gmailLinkedBanner && (
        <div className="Main-max-w-2xl Main-mx-auto Main-mb-4 Main-p-3 Main-rounded Main-bg-green-50 Main-text-green-700 Main-border Main-border-green-200">
          Gmail connected successfully. You can now resend your message via your Gmail account.
        </div>
      )}

      <section className="Main-flex Main-flex-col Main-md:grid Main-md:grid-cols-2 Main-gap-8">
        <div className="Main-card">
          <h3 className="Main-font-semibold Main-mb-3 Main-text-black Main-text-lg Main-sm:text-xl">
            Our Mission
          </h3>
          <p className="Main-text-black Main-leading-relaxed">
            Democratize education by offering high-quality, accessible courses
            for everyone.
          </p>
        </div>
        <div className="Main-card">
          <h3 className="Main-font-semibold Main-mb-3 Main-text-black Main-text-lg Main-sm:text-xl">
            Our Values
          </h3>
          <ul className="Main-text-black Main-space-y-3">
            <li className="Main-flex Main-items-start">
              <span className="Main-font-semibold Main-text-primary Main-mr-2">•</span>
              <span>
                <strong>Accessibility:</strong> Opportunities for all learners.
              </span>
            </li>
            <li className="Main-flex Main-items-start">
              <span className="Main-font-semibold Main-text-primary Main-mr-2">•</span>
              <span>
                <strong>Practicality:</strong> Project-based learning.
              </span>
            </li>
            <li className="Main-flex Main-items-start">
              <span className="Main-font-semibold Main-text-primary Main-mr-2">•</span>
              <span>
                <strong>Support:</strong> Mentors and community.
              </span>
            </li>
          </ul>
        </div>
      </section>

      <section className="Main-text-center">
        <h2 className="Main-text-2xl Main-sm:text-3xl Main-font-bold Main-mb-4 Main-text-black">
          Our Team
        </h2>
        <p className="Main-text-black Main-max-w-2xl Main-mx-auto">
          Meet the passionate educators and developers behind Qatan.
        </p>
        <div className="Main-grid Main-grid-cols-1 Main-md:grid-cols-3 Main-gap-6 Main-mt-8 Main-max-w-3xl Main-mx-auto">
          <div className="Main-card Main-text-center">
            <img
              src="/img/1.png"
              alt="John Doe"
              className="Main-w-20 Main-h-20 Main-rounded-full Main-mx-auto Main-mb-4 Main-object-cover"
            />
            <h4 className="Main-font-semibold Main-text-secondary">John Doe</h4>
            <p className="Main-text-black">Lead Instructor</p>
          </div>
          <div className="Main-card Main-text-center">
            <img
              src="/img/2.png"
              alt="Jane Smith"
              className="Main-w-20 Main-h-20 Main-rounded-full Main-mx-auto Main-mb-4 Main-object-cover"
            />
            <h4 className="Main-font-semibold Main-text-secondary">Jane Smith</h4>
            <p className="Main-text-black">Curriculum Developer</p>
          </div>
          <div className="Main-card Main-text-center">
            <img
              src="/img/3.png"
              alt="Emily White"
              className="Main-w-20 Main-h-20 Main-rounded-full Main-mx-auto Main-mb-4 Main-object-cover"
            />
            <h4 className="Main-font-semibold Main-text-secondary">Emily White</h4>
            <p className="Main-text-black">Community Manager</p>
          </div>
        </div>
      </section>

      <section className="Main-grid Main-grid-cols-1 Main-md:grid-cols-2 Main-gap-8">
        <div className="Main-card Main-bg-gray-900 Main-dark:bg-white">
          <h3 className="Main-font-semibold Main-mb-3 Main-text-secondary Main-text-lg Main-sm:text-xl">
            Contact Us
          </h3>
          <p className="Main-text-neutral Main-leading-relaxed Main-mb-4">
            We'd love to hear from you. Send us a message and we'll respond as
            soon as possible.
          </p>
          <form onSubmit={handleSubmit} className="Main-space-y-4">
            <div>
              <label className="Main-block Main-text-black Main-dark:text-white Main-font-medium Main-mb-1">
                Name
              </label>
              <input
                type="text"
                className="Main-w-full Main-p-3 Main-border Main-rounded-lg Main-bg-white Main-dark:bg-gray-700 Main-dark:text-white"
                placeholder="Your Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!!user}
              />
            </div>
            <div>
              <label className="Main-block Main-text-black Main-dark:text-white Main-font-medium Main-mb-1">
                Email
              </label>
              <input
                type="email"
                className="Main-w-full Main-p-3 Main-border Main-rounded-lg Main-bg-white Main-dark:bg-gray-700 Main-dark:text-white"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={!!user}
              />
            </div>

            {user && (
              <div className="Main-flex Main-items-center Main-gap-2">
                <input
                  id="use-gmail"
                  type="checkbox"
                  className="Main-h-4 Main-w-4"
                  checked={useGmail}
                  onChange={(e) => setUseGmail(e.target.checked)}
                  disabled={submitting}
                />
                <label htmlFor="use-gmail" className="Main-text-black">
                  Send using my Gmail
                </label>
              </div>
            )}

            <div>
              <label className="Main-block Main-text-black Main-dark:text-white Main-font-medium Main-mb-1">
                Message
              </label>
              <textarea
                className="Main-w-full Main-p-3 Main-border Main-rounded-lg Main-h-32 Main-bg-white Main-dark:bg-gray-700 Main-dark:text-white"
                placeholder="Your message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              ></textarea>
            </div>
            <button type="submit" className="Main-w-full Main-bg-primary Main-text-white Main-py-3 Main-rounded-lg Main-font-semibold" disabled={submitting}>
              {submitting ? "Sending..." : "Send Message"}
            </button>
            {success && <div style={{ color: '#16a34a', marginTop: '0.5rem' }}>{success}</div>}
            {error && <div style={{ color: '#dc2626', marginTop: '0.5rem' }}>{error}</div>}
          </form>
        </div>
        <div className="Main-card">
          <h3 className="Main-font-semibold Main-mb-3 Main-text-secondary Main-text-lg Main-sm:text-xl">
            Contact Information
          </h3>
          <div className="Main-space-y-4">
            <div className="Main-flex Main-items-center">
              <span className="Main-text-primary Main-mr-3">📧</span>
              <span className="Main-text-black">info@qatan.com</span>
            </div>
            <div className="Main-flex Main-items-center">
              <span className="Main-text-primary Main-mr-3">📞</span>
              <span className="Main-text-black">+1 (555) 123-4567</span>
            </div>
            <div className="Main-flex Main-items-center">
              <span className="Main-text-primary Main-mr-3">📍</span>
              <span className="Main-text-black">
                123 Learning Street, Education City
              </span>
            </div>
          </div>
          <div className="Main-mt-4">
            <p className="Main-text-black">Interested in becoming an instructor?</p>
            <p className="Main-text-black">Send your CV and application to <a href="mailto:instructorqatan@gmail.com">instructorqatan@gmail.com</a>.</p>
            <p className="Main-text-black">If your application meets our criteria, you’ll receive a unique instructor passkey by email.</p>
            <p className="Main-text-black">This passkey allows you to sign up as an instructor on the platform.</p>
            <p className="Main-text-black">The passkey will expire after a certain time (for example, within 1–10 hours).</p>
          </div>
        </div>
      </section>
    </div>
  );
}
