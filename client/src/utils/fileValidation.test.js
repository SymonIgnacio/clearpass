import { describe, it, expect } from 'vitest';
import { validateBeneficiaryFile, MAX_FILE_SIZE } from './fileValidation';

function makeFile({ type = 'image/jpeg', size = 1000 } = {}) {
  return { type, size };
}

describe('validateBeneficiaryFile', () => {
  it('fails when no file provided', () => {
    expect(validateBeneficiaryFile(null)).toEqual({ valid: false, reason: 'No file selected' });
  });

  it('fails for invalid file type', () => {
    const file = makeFile({ type: 'text/plain' });
    expect(validateBeneficiaryFile(file)).toEqual({ valid: false, reason: 'Invalid file type' });
  });

  it('fails for file too large', () => {
    const file = makeFile({ size: MAX_FILE_SIZE + 1 });
    expect(validateBeneficiaryFile(file)).toEqual({
      valid: false,
      reason: 'File too large (>5MB)',
    });
  });

  it('passes for valid image file', () => {
    const file = makeFile({ type: 'image/png', size: 1024 });
    expect(validateBeneficiaryFile(file)).toEqual({ valid: true });
  });

  it('passes for valid pdf file', () => {
    const file = makeFile({ type: 'application/pdf', size: 4096 });
    expect(validateBeneficiaryFile(file)).toEqual({ valid: true });
  });
});
