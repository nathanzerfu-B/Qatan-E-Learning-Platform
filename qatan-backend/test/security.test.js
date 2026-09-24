import test from "node:test";
import assert from "node:assert/strict";
import { validatePasswordStrength } from "../src/middleware/securityMiddleware.js";
import { validateEmailDeliverability } from "../src/utils/emailVerificationService.js";

test("Password Complexity Validator", async (t) => {
  await t.test("rejects empty or null password", () => {
    assert.equal(validatePasswordStrength("").valid, false);
    assert.equal(validatePasswordStrength(null).valid, false);
  });

  await t.test("rejects password shorter than 8 characters", () => {
    const result = validatePasswordStrength("Pass1!");
    assert.equal(result.valid, false);
    assert.match(result.message, /at least 8 characters/i);
  });

  await t.test("rejects password with only letters", () => {
    const result = validatePasswordStrength("PasswordOnly");
    assert.equal(result.valid, false);
    assert.match(result.message, /both letters and numbers/i);
  });

  await t.test("rejects password with only digits", () => {
    const result = validatePasswordStrength("123456789");
    assert.equal(result.valid, false);
    assert.match(result.message, /both letters and numbers/i);
  });

  await t.test("accepts valid complex password", () => {
    assert.equal(validatePasswordStrength("Pass1234!").valid, true);
    assert.equal(validatePasswordStrength("SecureAcademy2026").valid, true);
    assert.equal(validatePasswordStrength("helloWorld#99").valid, true);
  });
});

test("Email Deliverability & Format Validator", async (t) => {
  await t.test("rejects invalid email formats", async () => {
    const res1 = await validateEmailDeliverability("invalid-email");
    assert.equal(res1.valid, false);

    const res2 = await validateEmailDeliverability("user@");
    assert.equal(res2.valid, false);

    const res3 = await validateEmailDeliverability("@domain.com");
    assert.equal(res3.valid, false);
  });

  await t.test("verifies known high-reputation email providers instantaneously", async () => {
    const gmailCheck = await validateEmailDeliverability("student@gmail.com");
    assert.equal(gmailCheck.valid, true);
    assert.equal(gmailCheck.source, "known_domain");

    const outlookCheck = await validateEmailDeliverability("instructor@outlook.com");
    assert.equal(outlookCheck.valid, true);
    assert.equal(outlookCheck.source, "known_domain");

    const icloudCheck = await validateEmailDeliverability("admin@icloud.com");
    assert.equal(icloudCheck.valid, true);
    assert.equal(icloudCheck.source, "known_domain");
  });
});
