import { NextRequest } from 'next/server'

export function makeRequest(
  method: string,
  url: string,
  body?: unknown,
  headers?: Record<string, string>
): NextRequest {
  return new NextRequest(url, {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
}

export function makeParams<T extends Record<string, string>>(params: T): Promise<T> {
  return Promise.resolve(params)
}
