// Inline markdown parser — pure logic, sandbox-compatible.
// Supports: **bold**, *italic*, ***bold italic***, `code`, [text](url)

const FORMAT_BOLD = 1;
const FORMAT_ITALIC = 2;
const FORMAT_CODE = 16;

export interface LexicalTextNode {
  detail: 0;
  format: number;
  mode: 'normal';
  style: '';
  text: string;
  type: 'extended-text';
  version: 1;
}

export interface LexicalLinkNode {
  children: LexicalTextNode[];
  direction: 'ltr';
  format: '';
  indent: 0;
  type: 'link';
  version: 1;
  rel: 'noopener';
  target: null;
  title: '';
  url: string;
}

export function textNode(text: string, format = 0): LexicalTextNode {
  return { detail: 0, format, mode: 'normal', style: '', text, type: 'extended-text', version: 1 };
}

export function linkNode(text: string, url: string): LexicalLinkNode {
  return {
    children: [textNode(text)],
    direction: 'ltr',
    format: '',
    indent: 0,
    type: 'link',
    version: 1,
    rel: 'noopener',
    target: null,
    title: '',
    url,
  };
}

export function parseInlineText(input: string | undefined): (LexicalTextNode | LexicalLinkNode)[] {
  if (!input || typeof input !== 'string') return [textNode('')];

  const nodes: (LexicalTextNode | LexicalLinkNode)[] = [];
  const pattern = /(\[([^\]]+)\]\(([^)]+)\))|\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|\*(.+?)\*|`([^`]+)`/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(input)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(textNode(input.slice(lastIndex, match.index)));
    }
    if (match[1]) nodes.push(linkNode(match[2]!, match[3]!));
    else if (match[4]) nodes.push(textNode(match[4], FORMAT_BOLD | FORMAT_ITALIC));
    else if (match[5]) nodes.push(textNode(match[5], FORMAT_BOLD));
    else if (match[6]) nodes.push(textNode(match[6], FORMAT_ITALIC));
    else if (match[7]) nodes.push(textNode(match[7], FORMAT_CODE));
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < input.length) nodes.push(textNode(input.slice(lastIndex)));
  if (nodes.length === 0) nodes.push(textNode(input));
  return nodes;
}

/** Strip inline markdown markers from plain-text fields (callouts, signups, etc.). */
export function stripInlineMarkdown(input: string | undefined): string {
  if (!input || typeof input !== 'string') return '';
  return input
    .replace(/\*\*\*(.+?)\*\*\*/g, '$1')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
}

export function paragraphNode(text: string) {
  return { children: parseInlineText(text), direction: 'ltr', format: '', indent: 0, type: 'paragraph', version: 1 };
}

export function headingNode(text: string, level = 2) {
  return {
    children: parseInlineText(text),
    direction: 'ltr', format: '', indent: 0,
    type: 'extended-heading', version: 1,
    tag: `h${Math.min(Math.max(level, 1), 6)}`,
  };
}

export function quoteNode(text: string) {
  return { children: parseInlineText(text), direction: 'ltr', format: '', indent: 0, type: 'extended-quote', version: 1 };
}
