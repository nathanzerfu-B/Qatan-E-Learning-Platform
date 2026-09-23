import axios from "axios";
import dns from "dns";

// Configure DNS resolver to use reliable public DNS servers
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch {
  // Ignore if custom servers cannot be set in restricted environments
}

const KNOWN_VALID_DOMAINS = new Set([
  "gmail.com",
  "yahoo.com",
  "hotmail.com",
  "outlook.com",
  "live.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "proton.me",
  "protonmail.com",
  "aol.com",
  "zoho.com",
  "yandex.com",
  "mail.com",
  "gmx.com",
]);

/**
 * Basic RFC-like email format validation
 */
function isFormatValid(email) {
  if (!email || typeof email !== "string") return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.trim());
}

/**
 * Resolve MX records for a given domain.
 */
async function hasMxRecords(domain) {
  try {
    const records = await dns.promises.resolveMx(domain);
    return Array.isArray(records) && records.length > 0;
  } catch (error) {
    // If the lookup was specifically ENOTFOUND or ENODATA, domain has no mail servers
    if (error.code === "ENOTFOUND" || error.code === "ENODATA") {
      return false;
    }
    // If it's a network resolver refusal or timeout (ECONNREFUSED, ETIMEOUT), don't block registration
    console.warn(`⚠️ DNS MX lookup for ${domain} returned ${error.code}. Allowing fallback.`);
    return true;
  }
}

/**
 * Provider: Abstract Email Validation API
 */
async function checkWithAbstract(email, apiKey) {
  const url = "https://emailvalidation.abstractapi.com/v1/";
  const params = { api_key: apiKey, email };
  const res = await axios.get(url, { params, timeout: 8000 });

  const data = res.data || {};
  const isValidFormat = data?.is_valid_format?.value === true;
  const isMxFound = data?.is_mx_found?.value === true;
  const isSmtpValid = data?.is_smtp_valid?.value === true;
  const deliverability = String(data?.deliverability || "").toUpperCase();

  const valid = isValidFormat && isMxFound && (isSmtpValid || deliverability === "DELIVERABLE");

  const reason = valid
    ? "OK"
    : `Abstract flags -> format:${isValidFormat} mx:${isMxFound} smtp:${isSmtpValid} deliverability:${deliverability}`;

  return { valid, reason, source: "abstract" };
}

/**
 * Provider: apilayer (MailboxLayer)
 */
async function checkWithApilayer(email, apiKey) {
  const url = "http://apilayer.net/api/check";
  const params = { access_key: apiKey, email, smtp: 1, format: 1 };
  const res = await axios.get(url, { params, timeout: 8000 });

  const data = res.data || {};
  const formatValid = data?.format_valid === true;
  const mxFound = data?.mx_found === true;
  const smtpCheck = data?.smtp_check === true;

  const valid = formatValid && mxFound && smtpCheck;
  const reason = valid ? "OK" : `MailboxLayer flags -> format:${formatValid} mx:${mxFound} smtp:${smtpCheck}`;

  return { valid, reason, source: "apilayer" };
}

/**
 * Fallback check (no provider configured)
 */
async function fallbackCheck(email) {
  if (!isFormatValid(email)) {
    return { valid: false, reason: "Invalid email format", source: "fallback" };
  }
  const domain = String(email.split("@")[1] || "").trim().toLowerCase();
  if (!domain) {
    return { valid: false, reason: "Missing domain part", source: "fallback" };
  }

  // Bypass DNS check for known high-reputation domains
  if (KNOWN_VALID_DOMAINS.has(domain)) {
    return { valid: true, reason: "OK", source: "known_domain" };
  }

  const mx = await hasMxRecords(domain);
  if (!mx) {
    return { valid: false, reason: "No MX records found for domain", source: "fallback" };
  }
  return { valid: true, reason: "OK", source: "fallback" };
}

/**
 * Validate email deliverability before user registration.
 */
export async function validateEmailDeliverability(email) {
  try {
    const provider = (process.env.EMAIL_VERIFICATION_PROVIDER || "").toLowerCase().trim();
    const apiKey = process.env.EMAIL_VERIFICATION_API_KEY;

    if (provider === "abstract" && apiKey) {
      return await checkWithAbstract(email, apiKey);
    }
    if (provider === "apilayer" && apiKey) {
      return await checkWithApilayer(email, apiKey);
    }
    // Fallback path
    return await fallbackCheck(email);
  } catch (err) {
    console.warn("⚠️ Email verification service error, falling back to RFC format validation:", err.message);
    return isFormatValid(email)
      ? { valid: true, reason: "Format valid (provider bypassed)", source: "format_rescue" }
      : { valid: false, reason: "Invalid email format", source: "format_rescue" };
  }
}

export default validateEmailDeliverability;
