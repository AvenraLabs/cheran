import AppError from "../appError.js";

export const validate = (schema) => (req, res, next) => {
  try {
    const parsed = schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (parsed.body !== undefined) {
      req.body = parsed.body;
    }

    if (parsed.query !== undefined) {
      try {
        req.query = parsed.query;
      } catch {
        Object.defineProperty(req, "query", {
          value: parsed.query,
          writable: true,
          configurable: true,
        });
      }
    }

    if (parsed.params !== undefined) {
      try {
        req.params = parsed.params;
      } catch {
        Object.defineProperty(req, "params", {
          value: parsed.params,
          writable: true,
          configurable: true,
        });
      }
    }

    next();
  } catch (err) {
    const issues = err.issues || err.errors;
    if (issues && Array.isArray(issues)) {
      const errorDetails = issues.map((e) => ({
        field: e.path ? e.path.join(".") : "field",
        message: e.message,
      }));
      const messageStr = errorDetails.map((e) => `${e.field}: ${e.message}`).join(", ");
      return next(new AppError(`Validation failed: ${messageStr}`, 400, errorDetails));
    }
    next(err);
  }
};

export default validate;
