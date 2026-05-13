
export function extractJSON(text: string): any {
  if (!text) return [];
  let cleaned = text.trim();
  
  // Strip markdown code blocks
  if (cleaned.includes('```')) {
    const matchesArray = Array.from(cleaned.matchAll(/```(?:json)?\s*([\s\S]*?)\s*```/g));
    if (matchesArray.length > 0) {
       // Take the last match that looks like a JSON array or object
       const innerMatch = matchesArray[matchesArray.length - 1][1];
       cleaned = innerMatch.trim();
    } else {
       // Handle cases where the closing backticks might be missing
       const startMatch = cleaned.match(/```(?:json)?\s*([\s\S]*)/);
       if (startMatch) cleaned = startMatch[1].trim();
    }
  }

  // Final sanitization: find the first { or [ and the last } or ]
  const firstBrace = cleaned.indexOf('{');
  const firstBracket = cleaned.indexOf('[');
  
  let startIdx = -1;
  if (firstBrace !== -1 && (firstBracket === -1 || (firstBracket !== -1 && firstBrace < firstBracket))) {
    startIdx = firstBrace;
  } else if (firstBracket !== -1) {
    startIdx = firstBracket;
  }

  if (startIdx !== -1) {
    const lastBrace = cleaned.lastIndexOf('}');
    const lastBracket = cleaned.lastIndexOf(']');
    const endIdx = Math.max(lastBrace, lastBracket);
    
    if (endIdx !== -1 && endIdx > startIdx) {
      cleaned = cleaned.substring(startIdx, endIdx + 1);
    }
  }

  try {
    let result = JSON.parse(cleaned);
    // If it's an object with an 'actions' or 'suggestions' key, extract the array
    if (result && !Array.isArray(result)) {
      if (Array.isArray(result.actions)) return result.actions;
      if (Array.isArray(result.suggestions)) return result.suggestions;
      if (Array.isArray(result.data)) return result.data;
    }
    return result;
  } catch (e) {
    console.error("Failed to parse JSON. Content:", cleaned);
    throw new Error(`Invalid JSON response from AI: ${e instanceof Error ? e.message : String(e)}`);
  }
}
