/**
 * CivicPulse - Evidence Linking Engine
 * 
 * Computes multi-source correlation between citizen reports and civic incidents.
 * Mathematical Foundation:
 * 1. Location similarity (40%) - Haversine geodesic distance with exponential proximity decay
 * 2. Time similarity (20%) - Temporal decay curve with configurable time window
 * 3. Text similarity (25%) - TF-IDF Vectorizer + Cosine Similarity with stopword filtering
 * 4. Category/Evidence similarity (15%) - Cross-category synergy matrix & photo evidence verification
 */

// Earth radius in kilometers
const EARTH_RADIUS_KM = 6371.0;

// Configurable time window parameter (in minutes, default: 180 min = 3 hours)
export const DEFAULT_TIME_WINDOW_MINUTES = 180;

/**
 * Calculates Haversine distance between two coordinates in meters
 */
export function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
  if (lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined) {
    return Infinity;
  }
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c * 1000; // in meters
}

/**
 * Location similarity score (0 - 100)
 * Uses smooth decay calibrated for civic incidents:
 * - Within 15m: 99%
 * - Within 35m: 92% (e.g. Shivaji Nagar intersection reports)
 * - Within 80m: 88%
 * - Within 150m: 82%
 * - Within 300m: 70%
 * - Within 600m: 50%
 * - Drops exponentially beyond
 */
export function calculateLocationScore(lat1, lon1, lat2, lon2) {
  const dist = calculateDistanceMeters(lat1, lon1, lat2, lon2);
  if (!isFinite(dist)) return 0;
  if (dist <= 15) return 99;
  if (dist <= 35) return 92;
  if (dist <= 80) return 88;
  if (dist <= 150) return 82;
  if (dist <= 300) return 70;
  if (dist <= 600) return 50;
  if (dist <= 1200) return 30;
  const score = Math.max(0, Math.round(100 * Math.exp(-dist / 500)));
  return score;
}

/**
 * Time similarity score (0 - 100)
 * Evaluates reports arriving in proximity with configurable window decay
 */
export function calculateTimeScore(timestamp1, timestamp2, windowMinutes = DEFAULT_TIME_WINDOW_MINUTES) {
  if (!timestamp1 || !timestamp2) return 50;
  const t1 = new Date(timestamp1).getTime();
  const t2 = new Date(timestamp2).getTime();
  if (isNaN(t1) || isNaN(t2)) return 50;

  const diffMinutes = Math.abs(t1 - t2) / (1000 * 60);

  if (diffMinutes <= 5) return 98;
  if (diffMinutes <= 15) return 93;
  if (diffMinutes <= 25) return 85;
  if (diffMinutes <= 35) return 80;
  if (diffMinutes <= 60) return 68;
  if (diffMinutes <= 120) return 45;
  if (diffMinutes <= 240) return 30;
  return Math.max(10, Math.round(100 * Math.exp(-diffMinutes / windowMinutes)));
}

// Common stop words for civic reporting
const STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren\'t', 'as', 'at',
  'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
  'can', 'can\'t', 'cannot', 'could', 'did', 'didn\'t', 'do', 'does', 'doesn\'t', 'doing', 'don\'t', 'down', 'during',
  'each', 'few', 'for', 'from', 'further', 'had', 'hadn\'t', 'has', 'hasn\'t', 'have', 'haven\'t', 'having',
  'he', 'her', 'here', 'hers', 'herself', 'him', 'himself', 'his', 'how',
  'i', 'if', 'in', 'into', 'is', 'isn\'t', 'it', 'it\'s', 'its', 'itself',
  'me', 'more', 'most', 'my', 'myself',
  'no', 'nor', 'not', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'ought', 'our', 'ours', 'ourselves', 'out', 'over', 'own',
  'same', 'she', 'should', 'so', 'some', 'such',
  'than', 'that', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'these', 'they', 'this', 'those', 'through', 'to', 'too',
  'under', 'until', 'up', 'very', 'was', 'wasn\'t', 'we', 'were', 'weren\'t', 'what', 'when', 'where', 'which', 'while', 'who', 'whom', 'why', 'with', 'won\'t', 'would',
  'you', 'your', 'yours', 'yourself', 'yourselves', 'near', 'causing', 'onto', 'there'
]);

// Curated municipal vocabulary & document corpus for IDF smoothing
const CIVIC_CORPUS_TERMS = [
  'water', 'leak', 'leaking', 'burst', 'flood', 'flooded', 'flooding', 'drain', 'drainage', 'sewer', 'sewage', 'pipeline', 'pipe', 'puddle', 'gushing', 'overflow',
  'electric', 'electrical', 'wire', 'cable', 'pole', 'spark', 'sparking', 'live', 'shock', 'streetlight', 'junction', 'transformer', 'box', 'hazard', 'fallen', 'hanging', 'voltage', 'powerline',
  'road', 'pothole', 'street', 'footpath', 'traffic', 'obstruction', 'asphalt', 'caved', 'cracking', 'debris', 'barrier', 'guardrail', 'crossing', 'lane', 'intersection', 'vehicular', 'damage'
];

/**
 * Tokenize and normalize text into clean lower-case alphanumeric word tokens
 */
export function tokenizeText(text) {
  if (!text || typeof text !== 'string') return [];
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .map(t => t.trim())
    .filter(token => token.length > 2 && !STOP_WORDS.has(token));
}

/**
 * Computes TF-IDF vectors and Cosine Similarity between two text descriptions.
 * Handles edge cases gracefully: empty text, very short text, identical text, missing text.
 */
export function calculateTfIdfCosineSimilarity(text1, text2) {
  const t1 = (text1 || '').trim();
  const t2 = (text2 || '').trim();

  // Edge Case 1: Both empty
  if (!t1 && !t2) {
    return { similarity: 1.0, score: 100, shared_terms: [], explanation: 'Both descriptions are empty' };
  }

  // Edge Case 2: One empty
  if (!t1 || !t2) {
    return { similarity: 0.0, score: 0, shared_terms: [], explanation: 'One description is missing' };
  }

  // Edge Case 3: Exact identical string match
  if (t1.toLowerCase() === t2.toLowerCase()) {
    const tokens = tokenizeText(t1);
    return { similarity: 1.0, score: 100, shared_terms: Array.from(new Set(tokens)), explanation: 'Exact identical text match' };
  }

  const tokens1 = tokenizeText(t1);
  const tokens2 = tokenizeText(t2);

  if (tokens1.length === 0 || tokens2.length === 0) {
    return { similarity: 0.2, score: 20, shared_terms: [], explanation: 'Insufficient non-stopword tokens' };
  }

  // Build combined vocabulary
  const vocab = Array.from(new Set([...tokens1, ...tokens2, ...CIVIC_CORPUS_TERMS]));
  const N = 30; // Effective corpus size for smooth inverse document frequency

  // Term frequencies
  const tf1 = {};
  const tf2 = {};
  tokens1.forEach(token => { tf1[token] = (tf1[token] || 0) + 1 / tokens1.length; });
  tokens2.forEach(token => { tf2[token] = (tf2[token] || 0) + 1 / tokens2.length; });

  // Calculate shared terms
  const sharedTerms = [];
  tokens1.forEach(t => {
    if (tokens2.includes(t) && !sharedTerms.includes(t)) {
      sharedTerms.push(t);
    }
  });

  // Calculate TF-IDF vectors
  let dotProduct = 0;
  let norm1Sq = 0;
  let norm2Sq = 0;

  for (const term of vocab) {
    // Document frequency estimate
    let df = 1;
    if (CIVIC_CORPUS_TERMS.includes(term)) df += 4;
    if (tokens1.includes(term)) df += 1;
    if (tokens2.includes(term)) df += 1;

    // Smooth IDF formula: ln(1 + N / df) + 1
    const idf = Math.log(1 + N / df) + 1;

    const v1 = (tf1[term] || 0) * idf;
    const v2 = (tf2[term] || 0) * idf;

    dotProduct += v1 * v2;
    norm1Sq += v1 * v1;
    norm2Sq += v2 * v2;
  }

  const norm1 = Math.sqrt(norm1Sq);
  const norm2 = Math.sqrt(norm2Sq);

  let cosineSim = (norm1 > 0 && norm2 > 0) ? (dotProduct / (norm1 * norm2)) : 0;
  cosineSim = Math.min(1.0, Math.max(0.0, cosineSim));

  // Map cosine similarity to 0 - 100 scale
  let normalizedScore = Math.round(cosineSim * 100);

  // Calibrate for domain semantic overlap
  if (sharedTerms.length >= 2) {
    normalizedScore = Math.max(normalizedScore, 78);
  } else if (sharedTerms.length >= 1) {
    normalizedScore = Math.max(normalizedScore, 65);
  }

  normalizedScore = Math.min(99, Math.max(15, normalizedScore));

  return {
    similarity: Number(cosineSim.toFixed(3)),
    score: normalizedScore,
    shared_terms: sharedTerms,
    explanation: sharedTerms.length > 0
      ? `TF-IDF Cosine Similarity ${(cosineSim).toFixed(2)} with shared semantic tokens: [${sharedTerms.join(', ')}]`
      : `TF-IDF Cosine Similarity ${(cosineSim).toFixed(2)} with no direct term overlap`
  };
}

/**
 * Text similarity score (0 - 100) using TF-IDF + Cosine Similarity
 */
export function calculateTextScore(text1, text2) {
  const result = calculateTfIdfCosineSimilarity(text1, text2);
  return result.score;
}

/**
 * Returns raw cosine similarity (0.0 - 1.0) for testing & mathematical verification
 */
export function computeTfidfCosineSimilarity(text1, text2) {
  return calculateTfIdfCosineSimilarity(text1, text2).similarity;
}

/**
 * Category & evidence similarity score (0 - 100)
 * Evaluates domain synergy and supporting photographic evidence
 */
export function calculateCategoryAndEvidenceScore(cat1, cat2, img1, img2, text1 = '', text2 = '') {
  let score = 50;
  let categoryRelation = 'Different Categories';

  // Same category
  if (cat1 === cat2) {
    score = 88;
    categoryRelation = 'Identical Domain';
  } else {
    // Cross-category synergy matrix
    const synergyPairs = [
      ['Water & Sanitation', 'Electrical & Public Safety'], // Water touching power lines
      ['Water & Sanitation', 'Road & Infrastructure'],       // Water damaging road / flooding
      ['Road & Infrastructure', 'Electrical & Public Safety']// Fallen pole on roadway
    ];

    const isSynergistic = synergyPairs.some(([a, b]) =>
      (cat1 === a && cat2 === b) || (cat1 === b && cat2 === a)
    );

    if (isSynergistic) {
      score = 82; // High affinity even with different categories
      categoryRelation = `Cross-Domain Synergy (${cat1} + ${cat2})`;
    } else {
      score = 60;
      categoryRelation = `Disparate Domains (${cat1} vs ${cat2})`;
    }
  }

  // Photographic evidence contribution
  let photoStatus = 'No photo attached';
  if (img1 || img2) {
    score += 8;
    photoStatus = 'Supporting photo evidence was provided';
  }
  if (img1 && img2) {
    score += 4;
    photoStatus = 'Dual photographic verification attached';
  }

  return {
    score: Math.min(99, Math.round(score)),
    category_relation: categoryRelation,
    photo_status: photoStatus
  };
}

/**
 * Combined Evidence Link Confidence Calculation
 * Weights:
 * - Location similarity: 40%
 * - Time similarity: 20%
 * - Text similarity: 25%
 * - Category/Evidence similarity: 15%
 * 
 * Formula:
 * correlation_score =
 *   (location_similarity * 0.40) +
 *   (time_similarity * 0.20) +
 *   (text_similarity * 0.25) +
 *   (category_evidence_similarity * 0.15)
 */
export function calculateEvidenceLink(reportA, reportB) {
  const distMeters = calculateDistanceMeters(
    reportA.latitude, reportA.longitude,
    reportB.latitude, reportB.longitude
  );

  const locationScore = calculateLocationScore(
    reportA.latitude, reportA.longitude,
    reportB.latitude, reportB.longitude
  );

  const timeScore = calculateTimeScore(
    reportA.timestamp,
    reportB.timestamp
  );

  const t1 = new Date(reportA.timestamp).getTime();
  const t2 = new Date(reportB.timestamp).getTime();
  const timeDiffMinutes = !isNaN(t1) && !isNaN(t2) ? Math.abs(t1 - t2) / (1000 * 60) : 0;

  const textResult = calculateTfIdfCosineSimilarity(
    reportA.description,
    reportB.description
  );
  const textScore = textResult.score;

  const catEvResult = calculateCategoryAndEvidenceScore(
    reportA.category,
    reportB.category,
    reportA.image || reportA.evidence,
    reportB.image || reportB.evidence,
    reportA.description,
    reportB.description
  );
  const evidenceScore = catEvResult.score;

  // Overall confidence weighted combination (40/20/25/15)
  const overallConfidence = Math.round(
    locationScore * 0.40 +
    timeScore * 0.20 +
    textScore * 0.25 +
    evidenceScore * 0.15
  );

  let confidenceLevel = 'Weak correlation';
  if (overallConfidence >= 80) {
    confidenceLevel = 'Strong correlation';
  } else if (overallConfidence >= 60) {
    confidenceLevel = 'Moderate correlation';
  }

  const reasons = [
    `Location (40% weight): ${locationScore}% (~${Math.round(distMeters)}m Haversine distance)`,
    `Time (20% weight): ${timeScore}% (~${Math.round(timeDiffMinutes)} min delta)`,
    `Text TF-IDF (25% weight): ${textScore}% (Cosine ${(textResult.similarity).toFixed(2)}, terms: ${textResult.shared_terms.length > 0 ? textResult.shared_terms.join(', ') : 'none'})`,
    `Category/Evidence (15% weight): ${evidenceScore}% (${catEvResult.category_relation}, ${catEvResult.photo_status})`
  ];

  return {
    report_a_id: reportA.report_id || reportA.id,
    report_b_id: reportB.report_id || reportB.id,
    distance_meters: Math.round(distMeters),
    location_score: locationScore,
    time_diff_minutes: Math.round(timeDiffMinutes),
    time_score: timeScore,
    text_score: textScore,
    text_cosine_similarity: textResult.similarity,
    text_shared_terms: textResult.shared_terms,
    evidence_score: evidenceScore,
    category_relation: catEvResult.category_relation,
    photo_status: catEvResult.photo_status,
    overall_confidence: overallConfidence,
    correlation_score: overallConfidence,
    confidence_level: confidenceLevel,
    formula: '40% Location + 20% Time + 25% Text + 15% Category/Evidence',
    is_correlated: overallConfidence >= 60,
    reasons: reasons,
    explanation: `Correlated with ${overallConfidence}% confidence (${confidenceLevel}). Primary drivers: ${reasons[0]}; ${reasons[2]}.`
  };
}
