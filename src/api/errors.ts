
import { isAxiosError } from 'axios';

export class HttpError extends Error {
  constructor(public status: number, message?: string) {
    super(message ?? `HTTP ${status}`);
  }
}

export type ErrorFace = {
  kind: 'offline' | 'notFound' | 'auth' | 'server' | 'client' | 'unknown';
  title: string;
  message: string;
  canRetry: boolean;
};

function statusOf(error: unknown): number | null {
  if (error instanceof HttpError) return error.status;
  if (isAxiosError(error)) return error.response?.status ?? null;
  return null;
}

function isNetworkFailure(error: unknown) {
  if (isAxiosError(error)) return !error.response;
  return error instanceof TypeError;
}

function serverMessage(error: unknown): string | null {
  if (isAxiosError(error)) {
    const data = error.response?.data as
      | { message?: unknown }
      | undefined;

    return typeof data?.message === 'string'
      ? data.message
      : null;
  }

  return null;
}

export function errorToFace(error: unknown): ErrorFace {
  if (isNetworkFailure(error)) {
    return {
      kind: 'offline',
      title: "You're offline",
      message: 'Check your mobile data or Wi-Fi, then try again.',
      canRetry: true,
    };
  }

  const status = statusOf(error);

  if (status === 404) {
    return {
      kind: 'notFound',
      title: 'Not found',
      message: 'We could not find that item.',
      canRetry: false,
    };
  }

  if (status === 401 || status === 403) {
    return {
      kind: 'auth',
      title: 'Please log in again',
      message: 'Your session has expired.',
      canRetry: false,
    };
  }

  if (status && status >= 500) {
    return {
      kind: 'server',
      title: 'Sorry, our server had a problem',
      message: 'It is not your fault. Please try again in a moment.',
      canRetry: true,
    };
  }

  if (status && status >= 400) {
    return {
      kind: 'client',
      title: 'Something was not right',
      message:
        serverMessage(error) ??
        'Please check what you entered and try again.',
      canRetry: false,
    };
  }

  return {
    kind: 'unknown',
    title: 'Something went wrong',
    message: 'Please try again.',
    canRetry: true,
  };
}
