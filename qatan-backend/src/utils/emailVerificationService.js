import axios from "axios";
import { promises as dns } from "dns";

/**
 * Basic RFC-like email format validation
 */
function isFormatValid(email) {
  if (!email || typeof email !== "string") return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.trim());
}

/**
 * Resolve MX records for a given domain. Returns true if at least one MX exists.
 */
async function hasMxRecords(domain) {
  try {
    const records = await dns.resolveMx(domain);
    return Array.isArray(records) && records.length > 0;
  } catch {
    return false;
  }
}

/**
 * Provider: Abstract Email Validation API
 * https://www.abstractapi.com/api/email-verification-validation-api
 */
async function checkWithAbstract(email, apiKey) {
  const url = "https://emailvalidation.abstractapi.com/v1/";
  const params = { api_key: apiKey, email };
  const res = await axios.get(url, { params, timeout: 8000 });

  const data = res.data || {};
  // Prefer explicit boolean fields; some tenants also return "deliverability"
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
 * https://apilayer.com/marketplace/mailboxlayer-api
 */
async function checkWithApilayer(email, apiKey) {
  const url = "http://apilayer.net/api/check";
  const params = { access_key: apiKey, email, smtp: 1, format: 1 };
  const res = await axios.get(url, { params, timeout: 8000 });

  const data = res.data || {};
  // mailboxlayer returns booleans flags
  const formatValid = data?.format_valid === true;
  const mxFound = data?.mx_found === true;
  const smtpCheck = data?.smtp_check === true;

  const valid = formatValid && mxFound && smtpCheck;
  const reason = valid ? "OK" : `MailboxLayer flags -> format:${formatValid} mx:${mxFound} smtp:${smtpCheck}`;

  return { valid, reason, source: "apilayer" };
}

/**
 * Fallback check (no provider configured):
 * - RFC-like regex
 * - Domain MX record presence
 */
async function fallbackCheck(email) {
  if (!isFormatValid(email)) {
    return { valid: false, reason: "Invalid email format", source: "fallback" };
  }
  const domain = String(email.split("@")[1] || "").trim().toLowerCase();
  if (!domain) {
    return { valid: false, reason: "Missing domain part", source: "fallback" };
  }
  const mx = await hasMxRecords(domain);
  if (!mx) {
    return { valid: false, reason: "No MX records for domain", source: "fallback" };
  }
  return { valid: true, reason: "OK", source: "fallback" };
}

/**
 * Validate email deliverability before user registration.
 * Decides provider by env:
 * - EMAIL_VERIFICATION_PROVIDER=abstract | apilayer
 * - EMAIL_VERIFICATION_API_KEY=...
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
    // Do not allow proceeding on provider errors; better to block than send to non-existent mailboxes
    const msg = err?.response?.data?.error?.message || err?.message || "Unknown provider error";
    return { valid: false, reason: `Provider error: ${msg}`, source: "provider_error" };
  }
}

export default validateEmailDeliverability;
