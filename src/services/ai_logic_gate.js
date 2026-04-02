/**
 * KAN-9: AI Reliability & Confidence Signaling Service
 * This service evaluates Gemini's response and assigns a Trust Level.
 */

const RELIABILITY_LEVELS = {
    HIGH: "HIGH",
    MEDIUM: "MEDIUM",
    LOW: "LOW"
};

/**
 * Logic to calculate reliability based on detail density.
 */
function calculateReliability(data) {
    let score = data.confidence || 0.5; 

    // Rule: Boost score if AI provides more than 3 specific observations
    const detailCount = (data.detected_issues?.length || 0) + (data.observations?.length || 0);
    if (detailCount > 3) score += 0.2;
    
    // Rule: Penalize if the room is unidentified
    if (data.room_type === "Other") score = 0.1;

    const finalScore = Math.min(Math.max(score, 0), 1); // Keep between 0 and 1

    let flag = RELIABILITY_LEVELS.LOW;
    if (finalScore >= 0.8) flag = RELIABILITY_LEVELS.HIGH;
    else if (finalScore >= 0.5) flag = RELIABILITY_LEVELS.MEDIUM;

    return { finalScore, flag };
}

/**
 * Main function to parse AI output and add Confidence Signals.
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
            analyzed_at: new Date().toISOString()
        };
    } catch (error) {
        // Fallback if parsing fails
        return {
            room_type: "Other",
            reliability_score: 0,
            reliability_flag: "LOW",
            is_fallback: true
        };
    }
}

module.exports = { parseWithConfidence };