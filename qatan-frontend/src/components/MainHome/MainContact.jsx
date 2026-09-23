import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext.jsx";

export default function Contact() {
  const { user } = useAuth();
  const token = useMemo(() => localStorage.getItem("token"), []);
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [message, setMessage] = useState("");
  const [useGmail, setUseGmail] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [gmailLinkedBanner, setGmailLinkedBanner] = useState(false);

  useEffect(() => {
    // If user logs in later
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
    }
  }, [user]);

  useEffect(() => {
    // Show banner if redirected from Gmail OAuth
    const params = new URLSearchParams(window.location.search);
    if (params.get("gmailLinked") === "1") {
      setGmailLinkedBanner(true);
      // Clean URL
      const url = new URL(window.location.href);
      url.searchParams.delete("gmailLinked");
      window.history.replaceState({}, "", url.toString());
    }
  }, []);

  const isLoggedIn = !!user;
  const backendBase = "http://localhost:5000"; // consider env if you have one

  const validateEmail = (val) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(val || "").trim());

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg("");
    setErrorMsg("");

    if (!message.trim()) {
      setErrorMsg("Message is required.");
      return;
    }

    const url = `${backendBase}/api/contact/send`;
    const headers = {};
    let payload = {};

    try {
      setSubmitting(true);

      if (isLoggedIn) {
        if (token) headers["Authorization"] = `Bearer ${token}`;
        payload = { message, useGmail };
      } else {
        if (!name.trim()) {
          setErrorMsg("Name is required.");
          setSubmitting(false);
          return;
        }
        if (!validateEmail(email)) {
          setErrorMsg("Please enter a valid email address.");
          setSubmitting(false);
          return;
        }
        payload = { name: name.trim(), email: email.trim().toLowerCase(), message };
      }

      const res = await axios.post(url, payload, { headers });

      // If server requests Gmail authorization
      if (res.data?.requiresAuth && res.data?.authUrl) {
        window.location.href = res.data.authUrl;
        return;
      }

      if (res.data?.success) {
        setSuccessMsg(
          res.data?.via === "gmail"
            ? "Your message has been sent via your Gmail account!"
            : "Your message has been sent successfully!"
        );
        // Reset message (and fields for guests)
        setMessage("");
        if (!isLoggedIn) {
          setName("");
          setEmail("");
        }
        setUseGmail(false);
      } else {
        setErrorMsg(res.data?.message || "Failed to send message.");
      }
    } catch (err) {
      const m =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to send message.";
      setErrorMsg(m);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-12">
      <header className="text-center">
        <h1 className="text-4xl font-bold mb-4 text-secondary">Contact Us</h1>
        <p className="text-lg text-neutral leading-relaxed max-w-2xl mx-auto">
          Have questions? Get in touch with us.
        </p>
      </header>

      {gmailLinkedBanner && (
        <div className="max-w-2xl mx-auto mb-4 p-3 rounded bg-green-50 text-green-700 border border-green-200">
          Gmail connected successfully. You can now resend your message via your Gmail account.
        </div>
      )}

      <section className="grid md:grid-cols-2 gap-8">
        <div className="card">
          <h3 className="font-semibold mb-3 text-secondary text-xl">
            Get in Touch
          </h3>
          <p className="text-neutral leading-relaxed mb-4">
            We'd love to hear from you. Send us a message and we'll respond as
            soon as possible.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLoggedIn && (
              <>
                <div>
                  <label className="block text-secondary font-medium mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    className="w-full p-3 border rounded-lg"
                    placeholder="Your Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={submitting}
                  />
                </div>
                <div>
                  <label className="block text-secondary font-medium mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    className="w-full p-3 border rounded-lg"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={submitting}
                  />
                </div>
              </>
            )}

            {isLoggedIn && (
              <>
                <div>
                  <label className="block text-secondary font-medium mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    className="w-full p-3 border rounded-lg bg-gray-100"
                    value={name}
                    disabled
                  />
                </div>
                <div>
                  <label className="block text-secondary font-medium mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    className="w-full p-3 border rounded-lg bg-gray-100"
                    value={email}
                    disabled
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    id="use-gmail"
                    type="checkbox"
                    className="h-4 w-4"
                    checked={useGmail}
                    onChange={(e) => setUseGmail(e.target.checked)}
                    disabled={submitting}
                  />
                  <label htmlFor="use-gmail" className="text-sm text-neutral">
                    Send using my Gmail
                  </label>
                </div>
              </>
            )}

            <div>
              <label className="block text-secondary font-medium mb-1">
                Message
              </label>
              <textarea
                className="w-full p-3 border rounded-lg h-32"
                placeholder="Your message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={submitting}
              ></textarea>
            </div>

            {errorMsg && (
              <div className="p-3 rounded bg-red-50 text-red-700 border border-red-200">
                {errorMsg}
              </div>
            )}
            {successMsg && (
              <div className="p-3 rounded bg-green-50 text-green-700 border border-green-200">
                {successMsg}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-primary text-white py-3 rounded-lg font-semibold disabled:opacity-60"
              disabled={submitting}
            >
              {submitting ? "Sending..." : "Send Message"}
            </button>
          </form>
        </div>

        <div className="card">
          <h3 className="font-semibold mb-3 text-secondary text-xl">
            Contact Information
          </h3>
          <div className="space-y-4">
            <div className="flex items-center">
              <span className="text-primary mr-3">📧</span>
              <span className="text-neutral">info@qatan.com</span>
            </div>
            <div className="flex items-center">
              <span className="text-primary mr-3">📞</span>
              <span className="text-neutral">+1 (555) 123-4567</span>
            </div>
            <div className="flex items-center">
              <span className="text-primary mr-3">📍</span>
              <span className="text-neutral">
                123 Learning Street, Education City
              </span>
            </div>
          </div>
          <div className="mt-4">
            <p>
              If you wish to become an instructor, please send your CV and a brief application to:
            </p>
            <p>
              <b>Email:</b> instructors@qatan.com
            </p>
            <p>
              After review, approved applicants will receive a unique passkey to complete instructor signup.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
