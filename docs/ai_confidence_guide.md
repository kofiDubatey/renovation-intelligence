# AI Confidence Signaling Guide

## Overview
This guide describes the confidence signaling required for the RIN AI output schema, ensuring both the backend and frontend receive trustworthy predictions.

## Confidence Scores
- `confidence` must be a number between `0.0` and `1.0`.
- Values:
  - `0.0-0.3`: Very Low
  - `0.31-0.6`: Low
  - `0.61-0.8`: Medium
  - `0.81-0.95`: High
  - `0.96-1.0`: Very High

## Behavior
- If a response has confidence < 0.7, flag it for human review.
- If confidence < 0.4, produce a warning and optionally decline auto-approval.
- Inconsistencies between output fields should lower confidence.

## Integration
- `API` layer should store `_metadata.confidence` from the AI response.
- `UI` should display a confidence badge and ensure low confidence prompts review.

## Retries
- If `confidence` is below threshold, retry with clearer prompt and more constraints.
