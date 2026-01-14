const crypto = require('crypto');

class AIAnalysisService {
  constructor(db) {
    this.db = db;
  }

  /**
   * Calculate confidence score based on data volume and variance
   * @param {number} sampleSize - Number of data points used
   * @param {number} variance - Calculated variance (lower is better) or null
   * @param {number} dataQualityScore - 0-1 score based on missing fields
   * @returns {number} Confidence score 0.0-1.0
   */
  calculateConfidence(sampleSize, variance = null, dataQualityScore = 1.0) {
    // Base confidence from sample size (sigmoid-like curve)
    // 0 items -> 0.0
    // 10 items -> 0.5
    // 50+ items -> 0.9
    let sizeScore = 1 / (1 + Math.exp(-0.1 * (sampleSize - 10)));
    
    // Adjust by variance if provided (high variance reduces confidence)
    let varianceFactor = 1.0;
    if (variance !== null) {
      // Assuming variance is normalized or typical range
      // This is a heuristic: high variance = lower confidence
      varianceFactor = 1 / (1 + variance); 
    }

    return parseFloat((sizeScore * varianceFactor * dataQualityScore).toFixed(2));
  }

  /**
   * Validate if a sitio exists in the database
   * @param {string} sitioName 
   * @returns {Promise<boolean>}
   */
  async validateSitio(sitioName) {
    if (!sitioName) return false;
    const [rows] = await this.db.execute('SELECT 1 FROM sitios WHERE name = ?', [sitioName]);
    return rows.length > 0;
  }

  /**
   * Audit an AI analysis run
   * @param {Object} params
   * @param {string} params.analysisType - e.g., 'PATROL_SUGGESTION', 'RISK_ASSESSMENT'
   * @param {Object} params.parameters - Input parameters used for analysis
   * @param {Object} params.results - The AI output
   * @param {number} params.confidenceScore - 0.0 to 1.0
   * @param {string} params.userId - User who triggered it (optional)
   * @param {Array<Object>} params.facts - Key facts derived/used { fact_type, fact_value, source, confidence }
   */
  async logAnalysis({ analysisType, parameters, results, confidenceScore, userId = null, facts = [] }) {
    try {
      const runId = crypto.randomUUID();
      
      // 1. Insert Run
      await this.db.execute(`
        INSERT INTO ai_analysis_runs (
          id, analysis_type, parameters, results, 
          confidence_score, triggered_by, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, NOW())
      `, [
        runId,
        analysisType,
        JSON.stringify(parameters),
        JSON.stringify(results),
        confidenceScore,
        userId
      ]);

      // 2. Insert Facts (if any)
      if (facts.length > 0) {
        for (const fact of facts) {
          await this.db.execute(`
            INSERT INTO ai_analysis_facts (
              run_id, fact_type, fact_value, 
              source, confidence_score
            ) VALUES (?, ?, ?, ?, ?)
          `, [
            runId,
            fact.fact_type,
            JSON.stringify(fact.fact_value),
            fact.source || 'internal_db',
            fact.confidence || confidenceScore
          ]);
        }
      }

      return runId;
    } catch (error) {
      console.error('Failed to log AI analysis:', error);
      // Don't throw, just return null so we don't break the main flow
      return null; 
    }
  }

  /**
   * Cross-reference AI outputs with authoritative data
   * @param {Array<string>} sitiosMentioned 
   * @returns {Promise<Object>} Verification results
   */
  async crossReferenceSitios(sitiosMentioned) {
    const verification = {};
    for (const sitio of sitiosMentioned) {
      verification[sitio] = await this.validateSitio(sitio);
    }
    return verification;
  }
}

module.exports = AIAnalysisService;
