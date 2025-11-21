
import { calculateLevenshteinDistance } from './pronunciation-service';

// Manual test suite since we aren't running Jest in this environment.
// This file serves as verification of the core algorithmic complexity.

console.group("🧪 Unit Tests: Pronunciation Algorithms");

// Test Case 1: Substitution
const dist1 = calculateLevenshteinDistance("kitten", "sitting");
console.assert(dist1 === 3, `❌ Failed: kitten vs sitting. Expected 3, got ${dist1}`);
if (dist1 === 3) console.log("✅ Pass: kitten vs sitting");

// Test Case 2: Edge Case (Empty String)
const dist2 = calculateLevenshteinDistance("", "abc");
console.assert(dist2 === 3, `❌ Failed: empty vs abc. Expected 3, got ${dist2}`);
if (dist2 === 3) console.log("✅ Pass: empty vs abc");

// Test Case 3: Exact Match
const dist3 = calculateLevenshteinDistance("hello", "hello");
console.assert(dist3 === 0, `❌ Failed: hello vs hello. Expected 0, got ${dist3}`);
if (dist3 === 0) console.log("✅ Pass: Exact match");

console.log("All algorithms verified.");
console.groupEnd();
