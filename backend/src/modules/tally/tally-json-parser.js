/**
 * Resiliently decode and parse Tally JSON content (handling BOM, control characters, UTF-16/UTF-8, trailing commas)
 */
export function parseTallyJsonBuffer(buffer) {
  if (!buffer || buffer.length === 0) {
    throw new Error("Uploaded file is empty.");
  }

  let text = "";

  // Detect UTF-16 LE BOM (0xFF, 0xFE)
  if (buffer[0] === 0xff && buffer[1] === 0xfe) {
    text = buffer.toString("utf16le");
  } else if (buffer[0] === 0xfe && buffer[1] === 0xff) {
    // UTF-16 BE
    text = buffer.swap16().toString("utf16le");
  } else {
    text = buffer.toString("utf8");
  }

  // Remove UTF-8 BOM if present
  if (text.charCodeAt(0) === 0xfeff) {
    text = text.slice(1);
  }

  text = text.trim();

  // Try standard JSON.parse first
  try {
    return JSON.parse(text);
  } catch (initialErr) {
    // If standard parse failed, clean common Tally JSON irregularities:
    // 1. Replace raw control characters (except valid escaped chars)
    // 2. Remove trailing commas before } or ]
    try {
      let sanitized = text
        // Replace raw unescaped tabs inside strings with space or \t
        .replace(/\t/g, "\\t")
        // Remove trailing commas
        .replace(/,\s*([}\]])/g, "$1");

      return JSON.parse(sanitized);
    } catch (secondErr) {
      // Try deeper sanitization: replace raw unescaped newlines/control characters
      try {
        let deepSanitized = text
          // Replace raw unescaped control chars in ascii 0-31 except \r, \n, \t
          .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "")
          .replace(/,\s*([}\]])/g, "$1");

        return JSON.parse(deepSanitized);
      } catch (finalErr) {
        console.error("Tally JSON Parse Error:", finalErr.message);
        throw new Error(
          `Failed to parse Tally JSON document: ${initialErr.message}. Please verify the file is not corrupted.`
        );
      }
    }
  }
}
