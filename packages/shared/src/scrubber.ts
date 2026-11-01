import type { BodyShape } from './types.ts';

// Regex patterns for sensitive identifiers
const EMAIL_REGEX = /[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/g;
const PHONE_REGEX = /(\+?\d{1,3}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}/g;
const JWT_REGEX = /eyJ[a-zA-Z0-9_-]{10,}\.eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}/g;
const BEARER_REGEX = /Bearer\s+[a-zA-Z0-9_.~+/-]+=*/gi;
const API_KEY_REGEX = /(?:api[_-]?key|secret|token|password|auth)[\s:=]+['"]?([a-zA-Z0-9_-]{16,})['"]?/gi;
const PAN_REGEX = /[A-Z]{5}[0-9]{4}[A-Z]{1}/g;
const AADHAAR_REGEX = /\b[2-9]{1}[0-9]{3}\s?[0-9]{4}\s?[0-9]{4}\b/g;

/**
 * Validates a credit card number using Luhn algorithm
 */
export function isValidLuhn(str: string): boolean {
  const digits = str.replace(/\D/g, '');
  if (digits.length < 13 || digits.length > 19) return false;

  let sum = 0;
  let shouldDouble = false;

  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits.charAt(i), 10);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
}

/**
 * Scrubs free-form text string of all identifiable PII
 */
export function scrubText(input: string): string {
  if (!input || typeof input !== 'string') return '';

  let scrubbed = input
    .replace(EMAIL_REGEX, '[EMAIL_REDACTED]')
    .replace(JWT_REGEX, '[JWT_REDACTED]')
    .replace(BEARER_REGEX, 'Bearer [TOKEN_REDACTED]')
    .replace(PAN_REGEX, '[PAN_REDACTED]')
    .replace(AADHAAR_REGEX, '[AADHAAR_REDACTED]')
    .replace(API_KEY_REGEX, '$1=[REDACTED]');

  // Check potential credit cards with Luhn
  scrubbed = scrubbed.replace(/\b(?:\d[ -]*?){13,19}\b/g, (match) => {
    if (isValidLuhn(match)) {
      return '[CARD_REDACTED]';
    }
    return match;
  });

  // Phone numbers (after credit cards to avoid false positives)
  scrubbed = scrubbed.replace(PHONE_REGEX, '[PHONE_REDACTED]');

  return scrubbed;
}

/**
 * Converts a raw JSON payload into a safe BodyShape (keys and data types only)
 */
export function extractBodyShape(payload: unknown, depth = 0): BodyShape {
  if (depth > 5) return '[MAX_DEPTH]';
  if (payload === null) return 'null';
  if (payload === undefined) return 'undefined';

  const type = typeof payload;
  if (type === 'string' || type === 'number' || type === 'boolean') {
    return type;
  }

  if (Array.isArray(payload)) {
    if (payload.length === 0) return [];
    return [extractBodyShape(payload[0], depth + 1)];
  }

  if (type === 'object') {
    const shape: Record<string, any> = {};
    for (const [key, value] of Object.entries(payload as Record<string, unknown>)) {
      // Lowercase check for secret key names
      const lowerKey = key.toLowerCase();
      if (
        lowerKey.includes('password') ||
        lowerKey.includes('secret') ||
        lowerKey.includes('token') ||
        lowerKey.includes('auth') ||
        lowerKey.includes('card') ||
        lowerKey.includes('cvv') ||
        lowerKey.includes('ssn') ||
        lowerKey.includes('key')
      ) {
        shape[key] = '[MASKED_KEY]';
      } else {
        shape[key] = extractBodyShape(value, depth + 1);
      }
    }
    return shape;
  }

  return 'unknown';
}
