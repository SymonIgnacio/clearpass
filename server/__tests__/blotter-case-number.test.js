const { formatCaseNumber, isValidBlotCaseNumber } = require('../utils/blotterCaseNumber');

describe('Blotter Case Number Utility', () => {
  test('formats case number correctly', () => {
    const cn = formatCaseNumber(2026, '01', 42);
    expect(cn).toBe('BLOT-2026-01-0042');
    expect(isValidBlotCaseNumber(cn)).toBe(true);
  });
});
