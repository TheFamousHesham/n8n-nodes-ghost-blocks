// Lexical card node builders — pure logic, sandbox-compatible.
// Card type field names match @tryghost/kg-default-nodes (Ghost 6.x).

import { paragraphNode, stripInlineMarkdown } from './text-parser';

export function imageCard(i: { src?: string; alt?: string; caption?: string; width?: number; height?: number; cardWidth?: string }) {
  return {
    type: 'image', version: 1,
    src: i.src || '', width: i.width || 0, height: i.height || 0,
    title: '', alt: i.alt || '', caption: i.caption || '',
    cardWidth: i.cardWidth || 'regular', href: '',
  };
}

export function galleryCard(i: { images?: Array<{ src?: string; alt?: string; caption?: string; width?: number; height?: number; filename?: string }> }) {
  return {
    type: 'gallery', version: 1,
    images: (i.images || []).map((img, idx) => ({
      row: Math.floor(idx / 3),
      src: img.src || '', width: img.width || 0, height: img.height || 0,
      alt: img.alt || '', caption: img.caption || '', fileName: img.filename || '',
    })),
  };
}

export function dividerCard() {
  return { type: 'horizontalrule', version: 1 };
}

export function buttonCard(i: { buttonText?: string; buttonUrl?: string; alignment?: string }) {
  return {
    type: 'button', version: 1,
    buttonText: stripInlineMarkdown(i.buttonText),
    buttonUrl: i.buttonUrl || '',
    alignment: i.alignment || 'center',
  };
}

export function bookmarkCard(i: { url?: string; title?: string; description?: string; icon?: string; thumbnail?: string; author?: string; publisher?: string; caption?: string }) {
  // Cloud version: no auto-enrichment. Caller must provide metadata or accept blank card.
  return {
    type: 'bookmark', version: 1,
    url: i.url || '',
    metadata: {
      url: i.url || '',
      title: i.title || '',
      description: i.description || '',
      icon: i.icon || '',
      thumbnail: i.thumbnail || '',
      author: i.author || '',
      publisher: i.publisher || '',
    },
    caption: i.caption || '',
  };
}

export function calloutCard(i: { calloutEmoji?: string; calloutText?: string; backgroundColor?: string }) {
  return {
    type: 'callout', version: 1,
    calloutEmoji: i.calloutEmoji || '',
    calloutText: stripInlineMarkdown(i.calloutText),
    backgroundColor: i.backgroundColor || 'blue',
  };
}

export function toggleCard(i: { heading?: string; content?: string }) {
  const inner = typeof i.content === 'string' ? [paragraphNode(i.content)] : [];
  return { type: 'toggle', version: 1, heading: stripInlineMarkdown(i.heading), content: inner };
}

export function headerCard(i: { backgroundImageSrc?: string; heading?: string; subheading?: string; buttonText?: string; buttonUrl?: string }) {
  return {
    type: 'header', version: 1,
    backgroundImageSrc: i.backgroundImageSrc || '',
    heading: stripInlineMarkdown(i.heading),
    subheading: stripInlineMarkdown(i.subheading),
    buttonEnabled: !!(i.buttonText && i.buttonUrl),
    buttonText: stripInlineMarkdown(i.buttonText),
    buttonUrl: i.buttonUrl || '',
    size: 'small', style: 'dark',
  };
}

export function emailCtaCard(i: { html?: string; buttonText?: string; buttonUrl?: string; segment?: string }) {
  return {
    type: 'email-cta', version: 1,
    html: i.html || '',
    showButton: !!i.buttonText,
    buttonText: i.buttonText || '',
    buttonUrl: i.buttonUrl || '',
    showDividers: true,
    segment: i.segment || '',
  };
}

export function emailCard(i: { html?: string }) {
  return { type: 'email', version: 1, html: i.html || '' };
}

export function signupCard(i: { header?: string; subheader?: string; buttonText?: string; buttonColor?: string; buttonTextColor?: string; backgroundColor?: string; textColor?: string; alignment?: string; layout?: string; backgroundImageSrc?: string; disclaimer?: string; successMessage?: string }) {
  return {
    type: 'signup', version: 1,
    header: stripInlineMarkdown(i.header),
    subheader: stripInlineMarkdown(i.subheader),
    buttonText: stripInlineMarkdown(i.buttonText) || 'Subscribe',
    buttonColor: i.buttonColor || 'accent',
    buttonTextColor: i.buttonTextColor || '#FFFFFF',
    backgroundColor: i.backgroundColor || '#F0F0F0',
    textColor: i.textColor || '',
    alignment: i.alignment || 'center',
    layout: i.layout || 'wide',
    backgroundImageSrc: i.backgroundImageSrc || '',
    backgroundSize: 'cover',
    disclaimer: i.disclaimer || '',
    labels: [],
    successMessage: i.successMessage || 'Thanks for subscribing!',
    swapped: false,
  };
}

export function paywallCard() {
  return { type: 'paywall', version: 1 };
}

export function ctaCard(i: { htmlEditor?: string; buttonText?: string; buttonUrl?: string; backgroundColor?: string; layout?: string; hasSponsorLabel?: boolean }) {
  return {
    type: 'call-to-action', version: 1,
    htmlEditor: i.htmlEditor || '',
    showButton: !!i.buttonText,
    buttonText: i.buttonText || '',
    buttonUrl: i.buttonUrl || '',
    backgroundColor: i.backgroundColor || '#F0F0F0',
    layout: i.layout || 'minimal',
    hasSponsorLabel: i.hasSponsorLabel || false,
  };
}

export function htmlCard(i: { html?: string }) { return { type: 'html', version: 1, html: i.html || '' }; }
export function markdownCard(i: { markdown?: string }) { return { type: 'markdown', version: 1, markdown: i.markdown || '' }; }

export function codeblockCard(i: { code?: string; language?: string; caption?: string }) {
  return { type: 'codeblock', version: 1, code: i.code || '', language: i.language || '', caption: i.caption || '' };
}

export function embedCard(i: { url?: string; html?: string; embedType?: string; metadata?: Record<string, unknown> }) {
  // Cloud version: no oEmbed fetching. Caller can supply pre-built html if needed.
  return {
    type: 'embed', version: 1,
    url: i.url || '', html: i.html || '',
    embedType: i.embedType || 'rich',
    metadata: i.metadata || {},
  };
}

export function videoCard(i: { src?: string; caption?: string; customThumbnailSrc?: string }) {
  return {
    type: 'video', version: 1,
    src: i.src || '', caption: i.caption || '',
    thumbnailSrc: '', customThumbnailSrc: i.customThumbnailSrc || '',
    width: 0, height: 0, duration: 0, mimeType: '',
    loop: false, cardWidth: 'regular',
  };
}

export function audioCard(i: { src?: string; title?: string; duration?: number }) {
  return { type: 'audio', version: 1, src: i.src || '', title: i.title || '', duration: i.duration || 0, mimeType: '' };
}

export function fileCard(i: { src?: string; fileName?: string; fileTitle?: string; fileCaption?: string; fileSize?: number }) {
  return {
    type: 'file', version: 1,
    src: i.src || '', fileName: i.fileName || '',
    fileTitle: i.fileTitle || '', fileCaption: i.fileCaption || '',
    fileSize: i.fileSize || 0,
  };
}

export function productCard(i: { productImageSrc?: string; productTitle?: string; productDescription?: string; productRatingEnabled?: boolean; productStarRating?: number; productButtonEnabled?: boolean; productButton?: string; productUrl?: string }) {
  return {
    type: 'product', version: 1,
    productImageSrc: i.productImageSrc || '',
    productTitle: i.productTitle || '',
    productDescription: i.productDescription || '',
    productRatingEnabled: i.productRatingEnabled || false,
    productStarRating: i.productStarRating || 0,
    productButtonEnabled: i.productButtonEnabled || false,
    productButton: i.productButton || '',
    productUrl: i.productUrl || '',
  };
}
