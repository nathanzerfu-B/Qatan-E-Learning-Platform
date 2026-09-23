import { useEffect, useState } from "react";
import axios from "axios";
import ThemedText from "./ThemedText";

export default function AdminSettings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const res = await axios.get("http://localhost:5000/api/admin/platform-settings");
        setSettings(res.data);
      } catch (err) {
        console.error("Failed to fetch settings:", err);
        setError("Failed to load settings. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  if (loading) return <p>Loading platform settings...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (!settings) return <p>No settings found.</p>;

  return (
    <div className="admin-page-content">
      <h1>Platform Settings</h1>

      <div className="admin-settings-section">
        <ThemedText as="h3" variant="heading">Platform Details</ThemedText>

        <div className="admin-setting-item">
          <ThemedText as="h4" variant="value">Site Name:</ThemedText>
          <ThemedText as="span" variant="muted">{settings.siteName}</ThemedText>
        </div>

        <div className="admin-setting-item">
          <ThemedText as="h4" variant="value">Default Language:</ThemedText>
          <ThemedText as="span" variant="muted">{settings.defaultLanguage}</ThemedText>
        </div>

        <div className="admin-setting-item">
          <ThemedText as="h4" variant="value">Support Email:</ThemedText>
          <ThemedText as="span" variant="muted">{settings.supportEmail}</ThemedText>
        </div>

        <div className="admin-setting-item">
          <ThemedText as="h4" variant="value">Payment Gateway:</ThemedText>
          <ThemedText as="span" variant="muted">
            {settings.paymentGateway || "configured"} (Chapa)
          </ThemedText>
        </div>
      </div>
    </div>
  );
}
