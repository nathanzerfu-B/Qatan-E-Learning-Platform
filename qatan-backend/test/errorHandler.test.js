import test from "node:test";
import assert from "node:assert/strict";
import { errorHandler, ApiError, asyncHandler } from "../src/middleware/errorHandler.js";

// Helper to mock express req, res, next
const createMockContext = () => {
  const req = {
    originalUrl: "/api/test",
    method: "POST",
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

  const next = () => {};

  return { req, res, next, getResult: () => ({ status: capturedStatus, body: capturedJson }) };
};

test("Safe Centralized Error Handler", async (t) => {
  await t.test("handles custom ApiError with accurate status code and message", () => {
    const { req, res, next, getResult } = createMockContext();
    const error = new ApiError(403, "Forbidden access to student records");

    errorHandler(error, req, res, next);
    const { status, body } = getResult();

    assert.equal(status, 403);
    assert.equal(body.success, false);
    assert.equal(body.message, "Forbidden access to student records");
  });

  await t.test("handles JsonWebTokenError as 401 Unauthorized", () => {
    const { req, res, next, getResult } = createMockContext();
    const error = new Error("jwt malformed");
    error.name = "JsonWebTokenError";

    errorHandler(error, req, res, next);
    const { status, body } = getResult();

    assert.equal(status, 401);
    assert.equal(body.success, false);
    assert.match(body.message, /invalid authentication token/i);
  });

  await t.test("handles TokenExpiredError as 401 Unauthorized", () => {
    const { req, res, next, getResult } = createMockContext();
    const error = new Error("jwt expired");
    error.name = "TokenExpiredError";

    errorHandler(error, req, res, next);
    const { status, body } = getResult();

    assert.equal(status, 401);
    assert.equal(body.success, false);
    assert.match(body.message, /token has expired/i);
  });

  await t.test("handles MulterError LIMIT_FILE_SIZE as 413 Payload Too Large", () => {
    const { req, res, next, getResult } = createMockContext();
    const error = new Error("File too large");
    error.name = "MulterError";
    error.code = "LIMIT_FILE_SIZE";

    errorHandler(error, req, res, next);
    const { status, body } = getResult();

    assert.equal(status, 413);
    assert.equal(body.success, false);
    assert.match(body.message, /maximum allowed size/i);
  });

  await t.test("handles Prisma P2002 unique constraint conflict as 409 Conflict", () => {
    const { req, res, next, getResult } = createMockContext();
    const error = new Error("Unique constraint failed");
    error.code = "P2002";
    error.meta = { target: "email" };

    errorHandler(error, req, res, next);
    const { status, body } = getResult();

    assert.equal(status, 409);
    assert.equal(body.success, false);
    assert.match(body.message, /already exists/i);
  });

  await t.test("handles Prisma P2025 record not found as 404 Not Found", () => {
    const { req, res, next, getResult } = createMockContext();
    const error = new Error("An operation failed because it depends on one or more records that were required but not found.");
    error.code = "P2025";

    errorHandler(error, req, res, next);
    const { status, body } = getResult();

    assert.equal(status, 404);
    assert.equal(body.success, false);
    assert.match(body.message, /could not be found/i);
  });

  await t.test("handles Prisma P1001 database connection refusal as 503 Service Unavailable", () => {
    const { req, res, next, getResult } = createMockContext();
    const error = new Error("Can't reach database server at localhost:5432");
    error.code = "P1001";

    errorHandler(error, req, res, next);
    const { status, body } = getResult();

    assert.equal(status, 503);
    assert.equal(body.success, false);
    assert.match(body.message, /database service is temporarily unavailable/i);
  });

  await t.test("handles Express SyntaxError malformed JSON as 400 Bad Request", () => {
    const { req, res, next, getResult } = createMockContext();
    const error = new SyntaxError("Unexpected token in JSON at position 12");
    error.status = 400;
    error.body = "{ invalid_json: ";

    errorHandler(error, req, res, next);
    const { status, body } = getResult();

    assert.equal(status, 400);
    assert.equal(body.success, false);
    assert.match(body.message, /malformed json payload/i);
  });

  await t.test("masks generic internal 500 error messages when in production", () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";

    try {
      const { req, res, next, getResult } = createMockContext();
      const rawError = new Error("Raw SQL SELECT * FROM secret_table crashed with memory error");

      errorHandler(rawError, req, res, next);
      const { status, body } = getResult();

      assert.equal(status, 500);
      assert.equal(body.success, false);
      assert.equal(body.message, "Internal server error. Please try again later.");
      assert.equal(body.stack, undefined);
    } finally {
      process.env.NODE_ENV = originalEnv;
    }
  });

  await t.test("asyncHandler cleanly catches rejected promises and routes to next(err)", async () => {
    let capturedError = null;
    const mockNext = (err) => {
      capturedError = err;
    };

    const failingAsyncFn = async () => {
      throw new Error("Async failure occurred");
    };

    const wrapped = asyncHandler(failingAsyncFn);
    await wrapped({}, {}, mockNext);

    assert.ok(capturedError);
    assert.equal(capturedError.message, "Async failure occurred");
  });
});
