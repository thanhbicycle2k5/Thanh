const THINK_OPEN = '<think>';
const THINK_CLOSE = '</think>';

export function createThinkTagFilter() {
  let buffer = '';
  let insideThink = false;

  const consume = (chunk: string, flush: boolean) => {
    buffer += chunk;
    let visible = '';

    while (buffer.length > 0) {
      const lowerBuffer = buffer.toLowerCase();
      if (insideThink) {
        const closeIndex = lowerBuffer.indexOf(THINK_CLOSE);
        if (closeIndex >= 0) {
          buffer = buffer.slice(closeIndex + THINK_CLOSE.length);
          insideThink = false;
          continue;
        }

        buffer = flush ? '' : buffer.slice(-THINK_CLOSE.length + 1);
        break;
      }

      const openIndex = lowerBuffer.indexOf(THINK_OPEN);
      if (openIndex >= 0) {
        visible += buffer.slice(0, openIndex);
        buffer = buffer.slice(openIndex + THINK_OPEN.length);
        insideThink = true;
        continue;
      }

      if (flush) {
        visible += buffer;
        buffer = '';
        break;
      }

      const safeLength = buffer.length - THINK_OPEN.length + 1;
      if (safeLength > 0) {
        visible += buffer.slice(0, safeLength);
        buffer = buffer.slice(safeLength);
      }
      break;
    }

    return visible;
  };

  return {
    push: (chunk: string) => consume(chunk, false),
    finish: () => consume('', true),
  };
}

export function stripThinkTags(text: string) {
  const filter = createThinkTagFilter();
  return `${filter.push(text)}${filter.finish()}`.trim();
}

export function parseFinalAnswer(content: string) {
  try {
    const parsed = JSON.parse(content) as { answer?: unknown };
    return typeof parsed.answer === 'string' ? parsed.answer.trim() : '';
  } catch {
    return '';
  }
}
