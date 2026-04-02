/**
 * AI Logic Gate Service for RIN Property Analysis
 * Handles Gemini AI response validation, reliability checks, and processing
 */

const fs = require('fs').promises;
const path = require('path');

class AILogicGate {
  constructor() {
    this.schemaPath = path.join(__dirname, '../schemas/ai_output.json');
    this.minConfidenceThreshold = 0.7;
    this.maxRetries = 3;
  }

  /**
   * Validates AI response against the output schema
   * @param {Object} response - AI response object
   * @returns {Object} - { isValid: boolean, errors: string[] }
   */
  async validateResponse(response) {
    try {
      const schema = JSON.parse(await fs.readFile(this.schemaPath, 'utf8'));
      const errors = [];

      // Check required fields
      const requiredFields = schema.required || [];
      for (const field of requiredFields) {
        if (!(field in response)) {
          errors.push(`Missing required field: ${field}`);
        }
      }

      // Validate field types and values
      if (response.room_type && !schema.properties.room_type.enum.includes(response.room_type)) {
        errors.push(`Invalid room_type: ${response.room_type}`);
      }

      if (response.condition_score !== undefined) {
        const score = response.condition_score;
        if (!Number.isInteger(score) || score < 1 || score > 5) {
          errors.push(`Invalid condition_score: ${score} (must be integer 1-5)`);
        }
      }

      if (response.confidence !== undefined) {
        const conf = response.confidence;
        if (typeof conf !== 'number' || conf < 0 || conf > 1) {
          errors.push(`Invalid confidence: ${conf} (must be number 0.0-1.0)`);
        }
      }

      if (response.detected_issues && !Array.isArray(response.detected_issues)) {
        errors.push('detected_issues must be an array');
      }

      if (response.renovation_action && !schema.properties.renovation_action.enum.includes(response.renovation_action)) {
        errors.push(`Invalid renovation_action: ${response.renovation_action}`);
      }

      if (response.material_grade && !schema.properties.material_grade.enum.includes(response.material_grade)) {
        errors.push(`Invalid material_grade: ${response.material_grade}`);
      }

      return {
        isValid: errors.length === 0,
        errors
      };
    } catch (error) {
      return {
        isValid: false,
        errors: [`Schema validation error: ${error.message}`]
      };
    }
  }

  /**
   * Checks if AI response meets reliability standards
   * @param {Object} response - AI response object
   * @returns {Object} - { isReliable: boolean, issues: string[], score: number }
   */
  checkReliability(response) {
    const issues = [];
    let reliabilityScore = 1.0;

    // Confidence threshold check
    if (response.confidence < this.minConfidenceThreshold) {
      issues.push(`Low confidence score: ${response.confidence}`);
      reliabilityScore *= 0.8;
    }

    // Logic consistency checks
    if (response.condition_score === 5 && response.detected_issues && response.detected_issues.length > 0) {
      issues.push('Perfect condition score but issues detected - potential inconsistency');
      reliabilityScore *= 0.9;
    }

    if (response.condition_score === 1 && response.renovation_action === 'Patch_and_Repair') {
      issues.push('Distressed condition but minimal renovation recommended - potential inconsistency');
      reliabilityScore *= 0.9;
    }

    // Issue severity correlation
    const severeIssues = ['water_damage', 'mold', 'structural_cracks', 'foundation_issues'];
    const hasSevereIssues = response.detected_issues &&
      response.detected_issues.some(issue => severeIssues.includes(issue));

    if (hasSevereIssues && response.condition_score > 3) {
      issues.push('Severe issues detected but high condition score - potential inconsistency');
      reliabilityScore *= 0.85;
    }

    return {
      isReliable: reliabilityScore >= 0.8,
      issues,
      score: reliabilityScore
    };
  }

  /**
   * Processes AI response with validation and reliability checks
   * @param {Object} response - Raw AI response
   * @param {number} retryCount - Current retry attempt
   * @returns {Object} - Processed response with validation results
   */
  async processResponse(response, retryCount = 0) {
    const validation = await this.validateResponse(response);
    const reliability = this.checkReliability(response);

    const result = {
      ...response,
      _metadata: {
        validation,
        reliability,
        processedAt: new Date().toISOString(),
        retryCount
      }
    };

    // Flag for human review if needed
    result._metadata.needsReview = !validation.isValid || !reliability.isReliable;

    return result;
  }

  /**
   * Determines if a response should be retried
   * @param {Object} processedResponse - Response from processResponse
   * @returns {boolean} - Whether to retry the analysis
   */
  shouldRetry(processedResponse) {
    const { validation, reliability, retryCount } = processedResponse._metadata;

    // Retry if validation failed or reliability is very low
    const shouldRetryValidation = !validation.isValid;
    const shouldRetryReliability = reliability.score < 0.6;
    const withinRetryLimit = retryCount < this.maxRetries;

    return (shouldRetryValidation || shouldRetryReliability) && withinRetryLimit;
  }

  /**
   * Generates improved prompts for retry attempts
   * @param {Object} previousResponse - The failed response
   * @param {string[]} issues - Issues identified
   * @returns {string} - Improved prompt instructions
   */
  generateRetryPrompt(previousResponse, issues) {
    let prompt = "Please re-analyze this image. Previous analysis had issues:\n";

    issues.forEach(issue => {
      prompt += `- ${issue}\n`;
    });

    prompt += "\nPlease ensure:\n";
    prompt += "- All required fields are present and valid\n";
    prompt += "- Assessments are consistent with visible evidence\n";
    prompt += "- Confidence scores reflect actual certainty\n";
    prompt += "- Only report clearly visible issues\n";

    return prompt;
  }
}

module.exports = AILogicGate;