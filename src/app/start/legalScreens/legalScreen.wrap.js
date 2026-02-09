const EMPTY_LINE_RATIO = 0.6;

/**
 * Creates line entry.
 * Used to set up required data for camera-relative placement.
 * Uses text, height to compute the result.
 * @param {string} text Text.
 * @param {number} height Height.
 * @returns {*} Line entry.
 */
const createLineEntry = (text, height) => ({ text, height });

/**
 * Adds empty line.
 * Used to support camera-relative placement.
 * Uses wrappedLines, lineHeight to perform the operation.
 * @param {*} wrappedLines Wrapped lines.
 * @param {number} lineHeight Line height.
 * @returns {*} Result value.
 */
const addEmptyLine = (wrappedLines, lineHeight) =>
  wrappedLines.push(createLineEntry("", lineHeight * EMPTY_LINE_RATIO));

/**
 * Append line.
 * Used to support camera-relative placement.
 * Uses wrappedLines, currentLine, lineHeight to perform the operation.
 * @param {*} wrappedLines Wrapped lines.
 * @param {*} currentLine Current line.
 * @param {number} lineHeight Line height.
 * @returns {*} Result value.
 */
const appendLine = (wrappedLines, currentLine, lineHeight) =>
  wrappedLines.push(createLineEntry(currentLine, lineHeight));

/**
 * Returns test line.
 * Used to provide test line for camera-relative placement.
 * Uses currentLine, word to compute the result.
 * @param {*} currentLine Current line.
 * @param {*} word Word.
 * @returns {string} Test line.
 */
const getTestLine = (currentLine, word) => (currentLine ? `${currentLine} ${word}` : word);

/**
 * Should wrap line.
 * Used to decide camera placement.
 * Renders to the canvas context.
 * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
 * @param {number} innerWidth Inner width.
 * @param {*} testLine Test line.
 * @returns {boolean} Whether wrap line.
 */
const shouldWrapLine = (ctx, innerWidth, testLine) => ctx.measureText(testLine).width > innerWidth;

/**
 * Wrap words into lines.
 * Used to support camera-relative placement.
 * Uses options to perform the operation.
 * @param {Object} options Configuration options.
 * @param {CanvasRenderingContext2D} [options.ctx] Canvas rendering context.
 * @param {number} [options.innerWidth] Inner width.
 * @param {number} [options.lineHeight] Line height.
 * @param {*} [options.words] Words.
 * @param {*} [options.wrappedLines] Wrapped lines.
 */
const wrapWordsIntoLines = ({ ctx, innerWidth, lineHeight, words, wrappedLines }) => {
  let currentLine = "";
  words.forEach((word, wordIndex) => {
    const testLine = getTestLine(currentLine, word);
    if (shouldWrapLine(ctx, innerWidth, testLine)) {
      appendLine(wrappedLines, currentLine, lineHeight);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
    if (wordIndex === words.length - 1) appendLine(wrappedLines, currentLine, lineHeight);
  });
};

/**
 * Wrap paragraph text.
 * Used to support camera-relative placement.
 * Uses options to perform the operation.
 * @param {Object} options Configuration options.
 * @param {CanvasRenderingContext2D} [options.ctx] Canvas rendering context.
 * @param {number} [options.innerWidth] Inner width.
 * @param {number} [options.lineHeight] Line height.
 * @param {string} [options.paragraphText] Paragraph text.
 * @param {*} [options.wrappedLines] Wrapped lines.
 */
export const wrapParagraphText = ({ ctx, innerWidth, lineHeight, paragraphText, wrappedLines }) => {
  if (!paragraphText) {
    addEmptyLine(wrappedLines, lineHeight);
    return;
  }
  const words = paragraphText.split(" ");
  wrapWordsIntoLines({ ctx, innerWidth, lineHeight, words, wrappedLines });
};
