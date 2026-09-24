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
    <div className="about-page max-w-6xl mx-auto space-y-16 sm:space-y-20 py-4 px-2 sm:px-4">
      {/* 1. Header / Hero Section */}
      <header className="text-center max-w-3xl mx-auto pt-4">
        <span className="inline-block px-3.5 py-1 rounded-full bg-[#1c6048]/10 text-[#1c6048] dark:text-[#60a5fa] dark:bg-[#60a5fa]/10 text-xs font-semibold uppercase tracking-wider mb-4 border border-[#1c6048]/20 dark:border-[#60a5fa]/20">
          Our Story & Vision
        </span>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-foreground tracking-tight mb-4">
          About Qatan
        </h1>
        <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
          We provide practical, project-based courses and hands-on modules to empower
          learners and creators around the world.
        </p>
      </header>

      {gmailLinkedBanner && (
        <div className="max-w-2xl mx-auto p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-sm font-medium">
          ✓ Gmail connected successfully. You can now send your message directly via your linked Gmail account.
        </div>
      )}

      {/* 2. Mission & Values Section */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
        <div className="Main-card p-7 sm:p-9 flex flex-col justify-between rounded-2xl">
          <div>
            <div className="w-10 h-10 rounded-xl bg-[#1c6048]/10 dark:bg-[#60a5fa]/10 text-[#1c6048] dark:text-[#60a5fa] flex items-center justify-center text-lg mb-4 font-bold">
              🎯
            </div>
            <h3 className="font-bold text-xl sm:text-2xl text-foreground mb-3">
              Our Mission
            </h3>
            <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
              To democratize technical and professional education by offering high-quality,
              affordable, and project-centered learning experiences that directly bridge the gap
              between theory and career execution.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-[#a8b2d2]/40 dark:border-[#4b5563]/40 flex items-center gap-2 text-xs font-semibold text-[#1c6048] dark:text-[#60a5fa]">
            <span>Empowering learners globally</span>
            <span>→</span>
          </div>
        </div>

        <div className="Main-card p-7 sm:p-9 flex flex-col justify-between rounded-2xl">
          <div>
            <div className="w-10 h-10 rounded-xl bg-[#1c6048]/10 dark:bg-[#60a5fa]/10 text-[#1c6048] dark:text-[#60a5fa] flex items-center justify-center text-lg mb-4 font-bold">
              💎
            </div>
            <h3 className="font-bold text-xl sm:text-2xl text-foreground mb-4">
              Our Values
            </h3>
            <ul className="space-y-4 text-sm sm:text-base text-foreground">
              <li className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-[#1c6048]/10 text-[#1c6048] dark:text-[#60a5fa] flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  ✓
                </span>
                <div>
                  <strong className="text-foreground">Accessibility:</strong> Providing high-grade learning opportunities for all learners, regardless of background.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-[#1c6048]/10 text-[#1c6048] dark:text-[#60a5fa] flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  ✓
                </span>
                <div>
                  <strong className="text-foreground">Practicality:</strong> Focus on real-world projects, verifiable skills, and interactive quizzes.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-[#1c6048]/10 text-[#1c6048] dark:text-[#60a5fa] flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  ✓
                </span>
                <div>
                  <strong className="text-foreground">Support & Community:</strong> Direct access to verified instructors, peer groups, and community channels.
                </div>
              </li>
            </ul>
          </div>
          <div className="mt-6 pt-4 border-t border-[#a8b2d2]/40 dark:border-[#4b5563]/40 flex items-center gap-2 text-xs font-semibold text-[#1c6048] dark:text-[#60a5fa]">
            <span>Guided by excellence & integrity</span>
            <span>→</span>
          </div>
        </div>
      </section>

      {/* 3. Team Section */}
      <section className="text-center pt-2">
        <span className="inline-block px-3 py-1 rounded-full bg-muted text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-3">
          Behind The Platform
        </span>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-foreground mb-3">
          Meet Our Team
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto mb-10 leading-relaxed">
          Passionate educators, curriculum engineers, and platform designers committed to your learning growth.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 max-w-4xl mx-auto">
          <div className="Main-card p-6 sm:p-7 text-center rounded-2xl flex flex-col items-center">
            <div className="relative mb-4">
              <img
                src="/img/1.png"
                alt="John Doe"
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover shadow-sm border-2 border-[#a8b2d2] dark:border-[#4b5563]"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "/img/student/student photo.png";
                }}
              />
            </div>
            <h4 className="font-bold text-base sm:text-lg text-foreground mb-1">John Doe</h4>
            <p className="text-xs sm:text-sm font-semibold text-[#1c6048] dark:text-[#60a5fa] mb-2">Lead Instructor</p>
            <p className="text-xs text-muted-foreground leading-relaxed">10+ years specializing in full-stack architecture and interactive student curriculum.</p>
          </div>

          <div className="Main-card p-6 sm:p-7 text-center rounded-2xl flex flex-col items-center">
            <div className="relative mb-4">
              <img
                src="/img/2.png"
                alt="Jane Smith"
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover shadow-sm border-2 border-[#a8b2d2] dark:border-[#4b5563]"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "/img/student/student photo.png";
                }}
              />
            </div>
            <h4 className="font-bold text-base sm:text-lg text-foreground mb-1">Jane Smith</h4>
            <p className="text-xs sm:text-sm font-semibold text-[#1c6048] dark:text-[#60a5fa] mb-2">Curriculum Developer</p>
            <p className="text-xs text-muted-foreground leading-relaxed">Designs modular course learning progressions, practical milestones, and quiz benchmarks.</p>
          </div>

          <div className="Main-card p-6 sm:p-7 text-center rounded-2xl flex flex-col items-center sm:col-span-2 md:col-span-1">
            <div className="relative mb-4">
              <img
                src="/img/3.png"
                alt="Emily White"
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover shadow-sm border-2 border-[#a8b2d2] dark:border-[#4b5563]"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "/img/student/student photo.png";
                }}
              />
            </div>
            <h4 className="font-bold text-base sm:text-lg text-foreground mb-1">Emily White</h4>
            <p className="text-xs sm:text-sm font-semibold text-[#1c6048] dark:text-[#60a5fa] mb-2">Community Manager</p>
            <p className="text-xs text-muted-foreground leading-relaxed">Leads student support engagement, discussion hubs, and discord workshop sessions.</p>
          </div>
        </div>
      </section>

      {/* 4. Contact Us & Information Section */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start pt-2">
        {/* Contact Form Card */}
        <div className="Main-card p-7 sm:p-9 rounded-2xl">
          <h3 className="font-bold text-xl sm:text-2xl text-foreground mb-2">
            Send Us a Message
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-6">
            Have questions about courses, certifications, or enterprise enrollment?
            Drop us a message and our team will get back to you shortly.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wider">
                Your Name
              </label>
              <input
                type="text"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#a8b2d2] dark:border-[#4b5563] bg-white dark:bg-[#111827] text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-[#1c6048] transition-all"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!!user}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wider">
                Email Address
              </label>
              <input
                type="email"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#a8b2d2] dark:border-[#4b5563] bg-white dark:bg-[#111827] text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-[#1c6048] transition-all"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={!!user}
              />
            </div>

            {user && (
              <div className="flex items-center gap-2 py-1">
                <input
                  id="use-gmail"
                  type="checkbox"
                  className="h-4 w-4 rounded accent-[#1c6048] cursor-pointer"
                  checked={useGmail}
                  onChange={(e) => setUseGmail(e.target.checked)}
                  disabled={submitting}
                />
                <label htmlFor="use-gmail" className="text-xs font-medium text-foreground cursor-pointer">
                  Send using my connected Gmail account
                </label>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wider">
                Your Message
              </label>
              <textarea
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#a8b2d2] dark:border-[#4b5563] bg-white dark:bg-[#111827] text-foreground text-sm h-32 focus:outline-none focus:ring-2 focus:ring-[#1c6048] transition-all"
                placeholder="How can we assist you with your learning journey?"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 px-6 rounded-xl bg-[#1c6048] hover:bg-[#164e3a] text-white font-semibold text-sm transition-colors cursor-pointer shadow-sm disabled:opacity-50"
              disabled={submitting}
            >
              {submitting ? "Sending..." : "Send Message"}
            </button>

            {success && (
              <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-semibold border border-emerald-200 dark:border-emerald-800">
                ✓ {success}
              </div>
            )}
            {error && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 text-xs font-semibold border border-red-200 dark:border-red-800">
                ✕ {error}
              </div>
            )}
          </form>
        </div>

        {/* Contact Information & Instructor Application Card */}
        <div className="Main-card p-7 sm:p-9 rounded-2xl flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-xl sm:text-2xl text-foreground mb-2">
              Contact Information
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-6">
              Reach out directly to our team or explore teaching opportunities.
            </p>

            <div className="space-y-4 pb-6 border-b border-[#a8b2d2]/40 dark:border-[#4b5563]/40">
              <div className="flex items-center gap-3 text-sm">
                <span className="w-8 h-8 rounded-lg bg-[#1c6048]/10 text-[#1c6048] dark:text-[#60a5fa] flex items-center justify-center font-bold">
                  ✉️
                </span>
                <span className="text-foreground font-medium">info@qatan.com</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="w-8 h-8 rounded-lg bg-[#1c6048]/10 text-[#1c6048] dark:text-[#60a5fa] flex items-center justify-center font-bold">
                  📞
                </span>
                <span className="text-foreground font-medium">+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="w-8 h-8 rounded-lg bg-[#1c6048]/10 text-[#1c6048] dark:text-[#60a5fa] flex items-center justify-center font-bold">
                  📍
                </span>
                <span className="text-foreground font-medium">123 Learning Street, Education City</span>
              </div>
            </div>

            {/* Instructor Opportunity Callout */}
            <div className="pt-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2.5 py-0.5 rounded-full bg-[#1c6048]/15 text-[#1c6048] dark:text-[#60a5fa] font-bold text-[11px] uppercase tracking-wider">
                  Teach on Qatan
                </span>
                <h4 className="font-bold text-sm text-foreground">Become an Instructor</h4>
              </div>

              <ul className="space-y-2.5 text-xs text-muted-foreground leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="text-[#1c6048] dark:text-[#60a5fa] font-bold mt-0.5">•</span>
                  <span>
                    Send your CV and course portfolio to{" "}
                    <a
                      href="mailto:instructorqatan@gmail.com"
                      className="font-semibold text-[#1c6048] dark:text-[#60a5fa] underline"
                    >
                      instructorqatan@gmail.com
                    </a>.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#1c6048] dark:text-[#60a5fa] font-bold mt-0.5">•</span>
                  <span>If approved, our academic review committee will issue you a single-use instructor invitation passkey.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#1c6048] dark:text-[#60a5fa] font-bold mt-0.5">•</span>
                  <span>Use your passkey on the signup portal to create your instructor dashboard and author courses.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#1c6048] dark:text-[#60a5fa] font-bold mt-0.5">•</span>
                  <span>Passkeys remain valid for 10 hours from delivery for security compliance.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
