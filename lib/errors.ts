/**
 * Error whose `message` is safe to return to clients (business-logic errors
 * like "Not enough personal points"). Anything that is NOT an AppError must be
 * treated as an internal error and hidden behind a generic message so Prisma /
 * runtime details never leak to the client.
 */
export class AppError extends Error {
  constructor(
    message: string,
    public readonly status: number = 400,
  ) {
    super(message)
    this.name = 'AppError'
  }
}
