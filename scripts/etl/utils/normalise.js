/**
 * Shared normalisation utilities for Whitespace ETL pipeline
 */

/**
 * Min-max normalise an array of values to [0, 1]
 * Missing values (null/undefined/NaN) are replaced with the state mean
 * and flagged in the returned quality map.
 */
function minMaxNormalise(values, ids) {
  const valid = values.filter(v => v != null && !isNaN(v));
  const min = Math.min(...valid);
  const max = Math.max(...valid);
  const mean = valid.reduce((a, b) => a + b, 0) / valid.length;
  const range = max - min || 1;

  const quality = {};
  const normalised = values.map((v, i) => {
    const id = ids ? ids[i] : i;
    if (v == null || isNaN(v)) {
      quality[id] = 'imputed_state_mean';
      return (mean - min) / range;
    }
    quality[id] = 'observed';
    return (v - min) / range;
  });

  return { normalised, quality, min, max, mean };
}

/**
 * Inverse a normalised value (higher raw = lower need)
 * e.g. facility access — more facilities = lower gap
 */
function inverse(normValue) {
  return 1 - normValue;
}

/**
 * Weighted sum of normalised indicators
 * weights must sum to 1.0
 */
function weightedSum(indicators, weights) {
  if (indicators.length !== weights.length) {
    throw new Error('indicators and weights must have equal length');
  }
  const total = weights.reduce((a, b) => a + b, 0);
  if (Math.abs(total - 1.0) > 0.001) {
    throw new Error(`weights must sum to 1.0, got ${total}`);
  }
  return indicators.reduce((sum, val, i) => sum + val * weights[i], 0);
}

/**
 * Clamp a value between 0 and 1
 */
function clamp(val) {
  return Math.max(0, Math.min(1, val));
}

/**
 * Compute gap score from need and coverage scores
 * needWeight + coverageWeight should sum to 1.0
 */
function computeGapScore(needScore, coverageScore, needWeight = 0.5) {
  const coverageWeight = 1 - needWeight;
  return clamp(
    (needWeight * needScore) + (coverageWeight * (1 - coverageScore))
  );
}

module.exports = { minMaxNormalise, inverse, weightedSum, clamp, computeGapScore };
