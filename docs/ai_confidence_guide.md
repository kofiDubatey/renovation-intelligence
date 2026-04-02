# RIN AI Confidence & Reliability Guide (KAN-9)

## 1. Reliability Indicators
Every AI output now contains a `reliability_score` (0.0 to 1.0) and a `reliability_flag`.

### Scoring Rules:
- **High (0.8 - 1.0):** AI identified the room and multiple specific features (e.g., countertops, flooring).
- **Medium (0.5 - 0.7):** AI identified the room but lacks specific detail on materials.
- **Low (< 0.5):** Image is blurry, room is "Other," or AI self-reports low certainty.

## 2. Downstream Reactions
- **Rahul (Backend):** If `reliability_flag` is "LOW", use the widest cost-band (most conservative estimate).
- **K (Frontend):** If `reliability_flag` is "LOW", display a ⚠️ icon next to the score to prompt user verification.

## Technical Contract
The output now includes:
- `reliability_score`: Float (0.0 - 1.0)
- `reliability_flag`: String (HIGH/MEDIUM/LOW)