/**
 * Custom error classes for social media integrations
 */

export class RefreshToken extends Error {
  constructor(
    public identifier: string,
    public json: string,
    public body: any,
    message = 'Token refresh required'
  ) {
    super(message);
    this.name = 'RefreshToken';
  }
}

export class BadBody extends Error {
  constructor(
    public identifier: string,
    public json: string,
    public body: any,
    message = 'Bad request body'
  ) {
    super(message);
    this.name = 'BadBody';
  }
}

export class NotEnoughScopes extends Error {
  constructor(message = 'Not enough scopes granted') {
    super(message);
    this.name = 'NotEnoughScopes';
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class UnauthorizedError extends Error {
  constructor(message = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class NotFoundError extends Error {
  constructor(message = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}
