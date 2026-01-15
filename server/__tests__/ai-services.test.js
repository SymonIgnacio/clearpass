const AIAnalysisService = require('../services/AIAnalysisService');

describe('AI Analysis Service', () => {
  let mockDb;
  let service;

  beforeEach(() => {
    mockDb = {
      execute: jest.fn()
    };
    service = new AIAnalysisService(mockDb);
  });

  describe('calculateConfidence', () => {
    test('returns low confidence for small sample size', () => {
      const score = service.calculateConfidence(1);
      expect(score).toBeLessThan(0.5);
    });

    test('returns high confidence for large sample size', () => {
      const score = service.calculateConfidence(100);
      expect(score).toBeGreaterThan(0.9);
    });

    test('penalizes high variance', () => {
      const base = service.calculateConfidence(50, 0); // Variance 0
      const penalized = service.calculateConfidence(50, 1.0); // Variance 1.0
      expect(penalized).toBeLessThan(base);
    });
  });

  describe('validateSitio', () => {
    test('returns true if sitio exists', async () => {
      mockDb.execute.mockResolvedValue([[{ 1: 1 }]]);
      const isValid = await service.validateSitio('Northville 5');
      expect(isValid).toBe(true);
      expect(mockDb.execute).toHaveBeenCalledWith(expect.stringContaining('SELECT 1'), ['Northville 5']);
    });

    test('returns false if sitio does not exist', async () => {
      mockDb.execute.mockResolvedValue([[]]);
      const isValid = await service.validateSitio('Invalid Place');
      expect(isValid).toBe(false);
    });
  });

  describe('logAnalysis', () => {
    test('inserts run and facts into database', async () => {
      mockDb.execute.mockResolvedValue([{ insertId: 1 }]);
      
      const params = {
        analysisType: 'TEST_ANALYSIS',
        parameters: { foo: 'bar' },
        results: { outcome: 'success' },
        confidenceScore: 0.85,
        userId: 'user-123',
        facts: [{ fact_type: 'TEST_FACT', fact_value: 'value' }]
      };

      const runId = await service.logAnalysis(params);
      
      expect(runId).toBeTruthy();
      expect(mockDb.execute).toHaveBeenCalledTimes(2); // 1 for run, 1 for fact
      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO ai_analysis_runs'),
        expect.arrayContaining(['TEST_ANALYSIS', 0.85])
      );
    });

    test('handles db errors gracefully', async () => {
      mockDb.execute.mockRejectedValue(new Error('DB Error'));
      const runId = await service.logAnalysis({ analysisType: 'TEST' });
      expect(runId).toBeNull();
    });
  });
});
