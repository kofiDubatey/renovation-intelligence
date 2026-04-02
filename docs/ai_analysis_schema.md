# RIN Project: AI Analysis Output Contract (v1.0)

## Objective
To ensure that the Gemini AI analysis is predictable and structured for the Backend (Rahul) and Frontend (K).

## 1. Required Output Fields
Every image analysis MUST return these fields:

| Field | Type | Values | Description |
| :--- | :--- | :--- | :--- |
| `room_type` | String | `Kitchen`, `Bathroom`, `Bedroom`, `Living_Room`, `Exterior`, `Other` | Identifies the space. |
| `condition_score` | Integer | `1` to `5` | 1=Distressed, 5=New/Excellent. |
| `detected_issues` | Array | e.g., `["water_damage", "mold"]` | List of visible problems. |
| `renovation_action`| String | `Patch_and_Repair`, `Partial_Renovation`, `Full_Gut` | The recommended work level. |
| `material_grade` | String | `Builder_Grade`, `Standard`, `Luxury` | Quality of existing finishes. |
| `confidence` | Float | `0.0` to `1.0` | How sure the AI is about this result. |

## 2. Integration Expectations
- **Backend (Rahul):** Use the `condition_score` and `material_grade` to calculate the estimated cost range.
- **Frontend (K):** Display the `renovation_action` and `detected_issues` on the property dashboard.