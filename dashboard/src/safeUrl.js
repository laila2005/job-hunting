// Only http(s) links may be rendered into href attributes. Anything else (javascript:, data:, etc.) becomes undefined.
export const safeUrl = u => {
  try {
    const p = new URL(u);
    return ['http:', 'https:'].includes(p.protocol) ? p.href : undefined;
  } catch {
    return undefined;
  }
};
