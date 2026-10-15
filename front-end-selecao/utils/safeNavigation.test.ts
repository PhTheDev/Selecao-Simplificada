import { describe, expect, it } from 'vitest';
import { isSafeHttpUrl, safeInternalRedirect } from './safeNavigation';

describe('isSafeHttpUrl', () => {
  it('accepts http and https', () => {
    expect(isSafeHttpUrl('https://example.com/x')).toBe(true);
    expect(isSafeHttpUrl('http://example.com')).toBe(true);
  });

  it('rejects javascript and other schemes', () => {
    expect(isSafeHttpUrl('javascript:alert(1)')).toBe(false);
    expect(isSafeHttpUrl('data:text/html,hi')).toBe(false);
    expect(isSafeHttpUrl('')).toBe(false);
    expect(isSafeHttpUrl('not a url')).toBe(false);
  });
});

describe('safeInternalRedirect', () => {
  it('allows relative paths', () => {
    expect(safeInternalRedirect('/painel-admin/', '/fallback')).toBe('/painel-admin/');
    expect(safeInternalRedirect('/candidato', '/fallback')).toBe('/candidato');
  });

  it('rejects open redirects', () => {
    expect(safeInternalRedirect('https://evil.example', '/fallback')).toBe('/fallback');
    expect(safeInternalRedirect('//evil.example', '/fallback')).toBe('/fallback');
    expect(safeInternalRedirect('evil.example', '/fallback')).toBe('/fallback');
  });
});
