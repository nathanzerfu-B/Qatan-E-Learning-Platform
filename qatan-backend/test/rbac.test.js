import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { authMiddleware, requireRole } from "../src/middleware/authMiddleware.js";

const TEST_SECRET = "test_jwt_secret_key_for_unit_tests";
process.env.JWT_SECRET = TEST_SECRET;

const createMockReqRes = (headers = {}, user = null) => {
  const req = {
    headers,
    user,
  };

  let capturedStatus = 200;
  let capturedJson = null;

  const res = {
    status(code) {
      capturedStatus = code;
      return this;
    },
    json(data) {
      capturedJson = data;
      return this;
    },
  };

  let nextCalled = false;
  const next = () => {
    nextCalled = true;
  };

  return {
    req,
    res,
    next,
    wasNextCalled: () => nextCalled,
    getResult: () => ({ status: capturedStatus, body: capturedJson }),
  };
};

test("RBAC & Authentication Guard Suite", async (t) => {
  await t.test("authMiddleware blocks request without Authorization header", () => {
    const { req, res, next, wasNextCalled, getResult } = createMockReqRes({});

    authMiddleware(req, res, next);
    const { status, body } = getResult();

    assert.equal(wasNextCalled(), false);
    assert.equal(status, 401);
    assert.equal(body.success, false);
    assert.match(body.message, /access token required/i);
  });

  await t.test("authMiddleware blocks request without Bearer prefix", () => {
    const { req, res, next, wasNextCalled, getResult } = createMockReqRes({
      authorization: "Basic dXNlcjpwYXNz",
    });

    authMiddleware(req, res, next);
    const { status, body } = getResult();

    assert.equal(wasNextCalled(), false);
    assert.equal(status, 401);
    assert.match(body.message, /access token required/i);
  });

  await t.test("authMiddleware rejects invalid or tampered JWT signature", () => {
    const { req, res, next, wasNextCalled, getResult } = createMockReqRes({
      authorization: "Bearer invalid.token.payload",
    });

    authMiddleware(req, res, next);
    const { status, body } = getResult();

    assert.equal(wasNextCalled(), false);
    assert.equal(status, 401);
    assert.match(body.message, /invalid or expired token/i);
  });

  await t.test("authMiddleware accepts valid JWT and attaches decoded user to req", () => {
    const tokenPayload = { id: 101, email: "student@qatan.edu", role: "student" };
    const validToken = jwt.sign(tokenPayload, TEST_SECRET, { expiresIn: "1h" });

    const { req, res, next, wasNextCalled } = createMockReqRes({
      authorization: `Bearer ${validToken}`,
    });

    authMiddleware(req, res, next);

    assert.equal(wasNextCalled(), true);
    assert.ok(req.user);
    assert.equal(req.user.id, 101);
    assert.equal(req.user.email, "student@qatan.edu");
    assert.equal(req.user.role, "student");
  });

  await t.test("requireRole blocks unauthenticated requests", () => {
    const { req, res, next, wasNextCalled, getResult } = createMockReqRes({}, null);
    const guard = requireRole("admin");

    guard(req, res, next);
    const { status, body } = getResult();

    assert.equal(wasNextCalled(), false);
    assert.equal(status, 401);
    assert.match(body.message, /authentication required/i);
  });

  await t.test("requireRole blocks unauthorized roles with 403 Forbidden", () => {
    const studentUser = { id: 202, email: "student@qatan.edu", role: "student" };
    const { req, res, next, wasNextCalled, getResult } = createMockReqRes({}, studentUser);
    const adminGuard = requireRole("admin");

    adminGuard(req, res, next);
    const { status, body } = getResult();

    assert.equal(wasNextCalled(), false);
    assert.equal(status, 403);
    assert.equal(body.success, false);
    assert.match(body.message, /forbidden.*access requires one of/i);
  });

  await t.test("requireRole permits authorized matching role", () => {
    const adminUser = { id: 1, email: "admin@qatan.edu", role: "admin" };
    const { req, res, next, wasNextCalled } = createMockReqRes({}, adminUser);
    const adminGuard = requireRole("admin");

    adminGuard(req, res, next);

    assert.equal(wasNextCalled(), true);
  });

  await t.test("requireRole supports multiple allowed roles", () => {
    const instructorUser = { id: 303, email: "teacher@qatan.edu", role: "instructor" };
    const { req, res, next, wasNextCalled } = createMockReqRes({}, instructorUser);
    const contentGuard = requireRole("admin", "instructor");

    contentGuard(req, res, next);

    assert.equal(wasNextCalled(), true);
  });
});
