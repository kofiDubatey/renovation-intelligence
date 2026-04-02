/**
 * KAN-9: AI Reliability & Confidence Signaling Service
 */

const RELIABILITY_LEVELS = {
    HIGH: "HIGH",
    MEDIUM: "MEDIUM",
    LOW: "LOW"
};

/**
 * Calculates a reliability score based on attribute density and AI self-reporting.
 * @param {object} data - The parsed JSON from Gemini.
 */
function calculateReliability(data) {
    let score = data.confidence || 0.5; // Start with AI's self-reported confidence

    // Rule 1: Attribute Density (If AI sees more issues/features, it's more reliable)
    const detailCount = (data.detected_issues?.length || 0) + (data.observations?.length || 0);
    if (detailCount > 4) score += 0.2;
    if (detailCount < 2) score -= 0.2;

    // Rule 2: Identification Safety
    if (data.room_type === "Other" || !data.is_identifiable) {
        score = 0.2;
    }

    // Cap score between 0 and 1
    const finalScore = Math.min(Math.max(score, 0), 1);

    // Determine Flag
    let flag = RELIABILITY_LEVELS.LOW;
    if (finalScore >= 0.8) flag = RELIABILITY_LEVELS.HIGH;
    else if (finalScore >= 0.5) flag = RELIABILITY_LEVELS.MEDIUM;

    return { finalScore, flag };
}

/**
 * Enhanced Parser for KAN-9
 */
function parseWithConfidence(rawResponse) {
    try {
        const cleanJson = rawResponse.replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(cleanJson);

        const reliability = calculateReliability(parsed);

        return {
            ...parsed,
            reliability_score: reliability.finalScore,
            reliability_flag: reliability.flag,
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        return {
            room_type: "Other",
            reliability_score: 0,
            reliability_flag: "LOW",
            is_fallback: true
        };
    }
}

module.exports = { parseWithConfidence };