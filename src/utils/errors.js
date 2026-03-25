export class ValidationError extends Error {
  constructor(message, details = undefined) {
    super(message);
    this.name = 'ValidationError';
    this.details = details;
  }
}

export class ConfigError extends Error {
  constructor(message, details = undefined) {
    super(message);
    this.name = 'ConfigError';
    this.details = details;
  }
}

export function toErrorMessage(err) {
  return err?.message || String(err);
}
