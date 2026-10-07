export class MercyHttpError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(
    status: number,
    message: string,
    body: unknown,
  ) {
    super(message);
    this.name = "MercyHttpError";
    this.status = status;
    this.body = body;
  }
}