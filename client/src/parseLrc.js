/**
 * parseLrc(lrcText)
 * Converts raw LRC string into a sorted array of { time, text } objects.
 * time is in seconds (float), text is the lyric line.
 *
 * Supports both formats:
 *   [00:16.90]Text here
 *   [00:16.90] Text here
 */
function parseLrc(lrcText) {
  const lines = lrcText.split('\n');
  const result = [];

  for (let line of lines) {
    // Match [mm:ss.xx] or [mm:ss.xxx]
    const match = line.match(/\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/);
    if (match) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const fractional = parseInt(match[3], 10);
      // Normalize to seconds regardless of 2 or 3 decimal digits
      const fractionalSecs = match[3].length === 3 ? fractional / 1000 : fractional / 100;
      const time = minutes * 60 + seconds + fractionalSecs;
      const text = match[4].trim();
      if (text) result.push({ time, text });
    }
  }

  // Sort by time in case lines are out of order
  result.sort((a, b) => a.time - b.time);
  return result;
}

export default parseLrc;
