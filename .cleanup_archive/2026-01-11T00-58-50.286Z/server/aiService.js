const { spawn } = require('child_process');
const path = require('path');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5000';

/**
 * Call the Python AI service to calculate social aid priority
 * @param {Object} residentData - Resident data for priority calculation
 * @returns {Promise<Object>} Priority result from AI service
 */
async function callPythonAI(residentData) {
  const axios = require('axios');
  try {
    const response = await axios.post(`${AI_SERVICE_URL}/api/calculate-priority`, residentData, {
      timeout: 10000, // 10 second timeout
      headers: {
        'Content-Type': 'application/json'
      }
    });

    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Error calling Python AI service:', error.message);

    // Return fallback priority calculation if AI service is unavailable
    const fallbackResult = calculateFallbackPriority(residentData);

    return {
      success: false,
      error: error.message,
      fallback: true,
      data: fallbackResult
    };
  }
}

/**
 * STABILITY FIX: Spawn Python AI service with proper error handling
 * @returns {Promise<Object>} Spawned process or error
 */
function spawnAIService() {
  return new Promise((resolve, reject) => {
    try {
      // Fix path to point to sibling ai_service folder
      const aiServicePath = path.join(__dirname, '..', 'ai_service', 'smart_suggestions.py');
      
      const pythonProcess = spawn('python', [aiServicePath]);

      // Add error listener to prevent crashes
      pythonProcess.on('error', (error) => {
        console.error('❌ Failed to start Python AI service:', error.message);
        reject(new Error(`Python service failed to start: ${error.message}`));
      });

      pythonProcess.on('spawn', () => {
        console.log('✅ Python AI service spawned successfully');
        resolve(pythonProcess);
      });

      pythonProcess.stderr.on('data', (data) => {
        console.error('Python AI service error:', data.toString());
      });

    } catch (error) {
      console.error('❌ Error spawning AI service:', error.message);
      reject(error);
    }
  });
}

/**
 * Fallback priority calculation when AI service is unavailable
 * @param {Object} residentData - Resident data
 * @returns {Object} Fallback priority result
 */
function calculateFallbackPriority(residentData) {
  const { monthly_income = 0, is_senior = false, is_pwd = false, occupation = '' } = residentData;

  let priority = 'MEDIUM';
  let score = 50;
  const reasons = [];

  // Simple fallback logic
  if (monthly_income < 10000 || is_senior || is_pwd) {
    priority = 'HIGH';
    score = 85;
    reasons.push('Fallback: Basic criteria met');
  } else if (monthly_income > 20000 && occupation && occupation.toLowerCase() !== 'unemployed') {
    priority = 'LOW';
    score = 15;
    reasons.push('Fallback: High income and employed');
  }

  return {
    priority,
    score,
    reasons
  };
}

/**
 * Generate a narrative summary (placeholder implementation)
 * @param {Object} data - Data for narrative generation
 * @returns {Promise<Object>} Narrative result
 */
async function generateNarrative(data) {
  try {
    // Placeholder implementation - returns dummy narrative
    // TODO: Integrate with actual AI service when ready
    const dummyNarrative = {
      summary: "This is a placeholder narrative generated for demonstration purposes. The AI service integration is not yet implemented.",
      key_points: [
        "Resident information processed",
        "Narrative generation initiated",
        "Placeholder content returned"
      ],
      timestamp: new Date().toISOString(),
      status: "success"
    };

    return {
      success: true,
      data: dummyNarrative
    };
  } catch (error) {
    console.error('Error generating narrative:', error.message);
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
}

/**
 * Health check for Python AI service
 * @returns {Promise<boolean>} True if service is healthy
 */
async function checkAIServiceHealth() {
  const axios = require('axios');
  try {
    const response = await axios.get(`${AI_SERVICE_URL}/health`, {
      timeout: 5000
    });
    return response.status === 200 && response.data.status === 'healthy';
  } catch (error) {
    return false;
  }
}

module.exports = {
  callPythonAI,
  checkAIServiceHealth,
  calculateFallbackPriority,
  generateNarrative,
  spawnAIService
};
