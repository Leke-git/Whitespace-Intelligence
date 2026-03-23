const { execSync } = require('child_process');
const fs = require('fs');

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

if (!ANTHROPIC_API_KEY) {
  console.error('Error: ANTHROPIC_API_KEY environment variable is not set.');
  process.exit(1);
}

async function runReview() {
  try {
    // 1. Get git diff of changed files (excluding node_modules, package-lock.json, .env*, and binary files)
    // We compare against the previous commit (HEAD~1) or the base branch (main)
    // In GitHub Actions on push to main, we can compare HEAD^ to HEAD
    let diff;
    try {
      diff = execSync('git diff HEAD^ HEAD -- . ":(exclude)node_modules/*" ":(exclude)package-lock.json" ":(exclude).env*"').toString();
    } catch (e) {
      // Fallback for first commit or if HEAD^ doesn't exist
      console.log('Could not get diff from HEAD^, trying HEAD...');
      diff = execSync('git diff HEAD -- . ":(exclude)node_modules/*" ":(exclude)package-lock.json" ":(exclude).env*"').toString();
    }

    if (!diff || diff.trim() === '') {
      console.log('No changes detected in relevant files.');
      process.exit(0);
    }

    // 2. Prepare the prompt for Claude
    const prompt = `
You are a senior software architect and security auditor. Review the following git diff and score the changes across five dimensions:
1. Security
2. Maintainability
3. Redundancy/Cleanliness
4. Simplicity
5. Documentation

For each dimension, provide a score from 1 to 10 and a list of specific findings.
A score below 6 on any dimension is considered a failure.

Return ONLY structured JSON in the following format:
{
  "scores": {
    "security": number,
    "maintainability": number,
    "redundancy": number,
    "simplicity": number,
    "documentation": number
  },
  "findings": {
    "security": ["finding 1", "finding 2"],
    "maintainability": [],
    "redundancy": [],
    "simplicity": [],
    "documentation": []
  },
  "summary": "Overall summary of the review",
  "passed": boolean
}

The "passed" field should be true only if all scores are 6 or higher.

Git Diff:
${diff}
    `;

    // 3. Call Anthropic API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20240620',
        max_tokens: 4000,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Anthropic API error: ${response.status} ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    const resultText = data.content[0].text;
    
    let result;
    try {
      // Extract JSON from the response (in case Claude adds preamble)
      const jsonMatch = resultText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found in response');
      result = JSON.parse(jsonMatch[0]);
    } catch (e) {
      console.error('Error parsing Claude response:', resultText);
      throw new Error('Failed to parse Claude response as JSON');
    }

    // 4. Generate Markdown Report
    const report = `
# Code Review Report

## Summary
${result.summary}

## Scores
| Dimension | Score | Status |
|-----------|-------|--------|
| Security | ${result.scores.security}/10 | ${result.scores.security >= 6 ? '✅' : '❌'} |
| Maintainability | ${result.scores.maintainability}/10 | ${result.scores.maintainability >= 6 ? '✅' : '❌'} |
| Redundancy/Cleanliness | ${result.scores.redundancy}/10 | ${result.scores.redundancy >= 6 ? '✅' : '❌'} |
| Simplicity | ${result.scores.simplicity}/10 | ${result.scores.simplicity >= 6 ? '✅' : '❌'} |
| Documentation | ${result.scores.documentation}/10 | ${result.scores.documentation >= 6 ? '✅' : '❌'} |

## Findings

### 🛡️ Security
${result.findings.security.length > 0 ? result.findings.security.map(f => `- ${f}`).join('\n') : '- No issues found.'}

### 🛠️ Maintainability
${result.findings.maintainability.length > 0 ? result.findings.maintainability.map(f => `- ${f}`).join('\n') : '- No issues found.'}

### 🧹 Redundancy/Cleanliness
${result.findings.redundancy.length > 0 ? result.findings.redundancy.map(f => `- ${f}`).join('\n') : '- No issues found.'}

### 🧩 Simplicity
${result.findings.simplicity.length > 0 ? result.findings.simplicity.map(f => `- ${f}`).join('\n') : '- No issues found.'}

### 📝 Documentation
${result.findings.documentation.length > 0 ? result.findings.documentation.map(f => `- ${f}`).join('\n') : '- No issues found.'}

---
**Status: ${result.passed ? 'PASS' : 'FAIL'}**
    `;

    fs.writeFileSync('review-report.md', report);

    // 5. Log Summary and Exit
    console.log('--- Code Review Summary ---');
    console.log(result.summary);
    console.log('---------------------------');
    console.log(`Status: ${result.passed ? 'PASSED' : 'FAILED'}`);

    if (!result.passed) {
      process.exit(1);
    } else {
      process.exit(0);
    }

  } catch (error) {
    console.error('Review script failed:', error.message);
    process.exit(1);
  }
}

runReview();
