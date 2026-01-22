export const MAX_FILE_SIZE = 5 * 1024 * 1024;
export const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];

export function validateBeneficiaryFile(file) {
  if (!file) return { valid: false, reason: 'No file selected' };
  if (!ALLOWED_TYPES.includes(file.type)) return { valid: false, reason: 'Invalid file type' };
  if (file.size > MAX_FILE_SIZE) return { valid: false, reason: 'File too large (>5MB)' };
  return { valid: true };
}
