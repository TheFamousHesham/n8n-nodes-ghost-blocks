// Lexical document builder — pure logic, sandbox-compatible.
// No oEmbed/OpenGraph fetching (those need fs/dns/fetch which are blocked).

import { paragraphNode, headingNode, quoteNode } from './text-parser';
import * as cards from './cards';

export type ContentBlock = Record<string, unknown> & { type: string };

type LexicalNode = Record<string, unknown>;

export function buildLexicalDocument(blocks: ContentBlock[] | undefined): string {
	if (!blocks || blocks.length === 0) {
		return JSON.stringify(wrapRoot([paragraphNode('')]));
	}
	const children: LexicalNode[] = [];
	for (const block of blocks) {
		const node = buildNode(block);
		if (node) children.push(node);
	}
	if (children.length === 0) children.push(paragraphNode(''));
	return JSON.stringify(wrapRoot(children));
}

function wrapRoot(children: LexicalNode[]): LexicalNode {
	return {
		root: {
			children,
			direction: 'ltr',
			format: '',
			indent: 0,
			type: 'root',
			version: 1,
		},
	};
}

function str(v: unknown, fallback = ''): string {
	return typeof v === 'string' ? v : fallback;
}

function num(v: unknown, fallback = 0): number {
	return typeof v === 'number' ? v : fallback;
}

function bool(v: unknown): boolean {
	return v === true;
}

function buildNode(block: ContentBlock): LexicalNode | null {
	switch (block.type) {
		case 'paragraph':
			return paragraphNode(str(block.text));
		case 'heading':
			return headingNode(str(block.text), num(block.level, 2));
		case 'quote':
			return quoteNode(str(block.text));

		case 'image': {
			const widthRaw = block.width;
			const cw = widthRaw === 'wide' || widthRaw === 'full' ? widthRaw : 'regular';
			return cards.imageCard({
				src: str(block.src),
				alt: str(block.alt),
				caption: str(block.caption),
				width: typeof widthRaw === 'number' ? widthRaw : 0,
				height: num(block.height),
				cardWidth: cw,
			});
		}
		case 'gallery':
			return cards.galleryCard({
				images: Array.isArray(block.images)
					? (block.images as Array<{
							src?: string;
							alt?: string;
							caption?: string;
							width?: number;
							height?: number;
							filename?: string;
					  }>)
					: [],
			});
		case 'divider':
			return cards.dividerCard();

		case 'button':
			return cards.buttonCard({
				buttonText: str(block.text),
				buttonUrl: str(block.url),
				alignment: str(block.alignment),
			});

		case 'bookmark':
			return cards.bookmarkCard({
				url: str(block.url),
				title: str(block.title),
				description: str(block.description),
				icon: str(block.icon),
				thumbnail: str(block.thumbnail),
				author: str(block.author),
				publisher: str(block.publisher),
				caption: str(block.caption),
			});

		case 'callout':
			return cards.calloutCard({
				calloutEmoji: str(block.emoji),
				calloutText: str(block.text),
				backgroundColor: str(block.color),
			});

		case 'toggle':
			return cards.toggleCard({
				heading: str(block.heading),
				content: str(block.content),
			});

		case 'header':
			return cards.headerCard({
				backgroundImageSrc: str(block.background_image),
				heading: str(block.heading),
				subheading: str(block.subheading),
				buttonText: str(block.button_text),
				buttonUrl: str(block.button_url),
			});

		case 'email_cta':
			return cards.emailCtaCard({
				html: str(block.text) || str(block.html),
				buttonText: str(block.button_text),
				buttonUrl: str(block.button_url),
				segment: str(block.segment),
			});

		case 'email_content':
			return cards.emailCard({ html: str(block.html) });

		case 'signup':
			return cards.signupCard({
				header: str(block.heading),
				subheader: str(block.subheading),
				buttonText: str(block.button_text),
				buttonColor: str(block.button_color),
				buttonTextColor: str(block.button_text_color),
				backgroundColor: str(block.background_color),
				textColor: str(block.text_color),
				alignment: str(block.alignment),
				layout: str(block.layout),
				backgroundImageSrc: str(block.background_image),
				disclaimer: str(block.disclaimer),
				successMessage: str(block.success_message),
			});

		case 'paywall':
			return cards.paywallCard();

		case 'call_to_action':
			return cards.ctaCard({
				htmlEditor: str(block.text) || str(block.html),
				buttonText: str(block.button_text),
				buttonUrl: str(block.button_url),
				backgroundColor: str(block.background_color),
				layout: str(block.layout),
				hasSponsorLabel: bool(block.sponsor_label),
			});

		case 'html':
			return cards.htmlCard({ html: str(block.html) });
		case 'markdown':
			return cards.markdownCard({ markdown: str(block.markdown) });
		case 'codeblock':
			return cards.codeblockCard({
				code: str(block.code),
				language: str(block.language),
				caption: str(block.caption),
			});

		case 'embed':
			return cards.embedCard({ url: str(block.url), html: str(block.html) });

		case 'video':
			return cards.videoCard({
				src: str(block.src),
				caption: str(block.caption),
				customThumbnailSrc: str(block.thumbnail),
			});
		case 'audio':
			return cards.audioCard({
				src: str(block.src),
				title: str(block.title),
				duration: num(block.duration),
			});
		case 'file':
			return cards.fileCard({
				src: str(block.src),
				fileName: str(block.filename),
				fileTitle: str(block.title),
				fileCaption: str(block.caption),
				fileSize: num(block.file_size),
			});

		case 'product':
			return cards.productCard({
				productImageSrc: str(block.image),
				productTitle: str(block.title),
				productDescription: str(block.description),
				productRatingEnabled: block.rating != null,
				productStarRating: num(block.rating),
				productButtonEnabled: Boolean(block.button_text && block.button_url),
				productButton: str(block.button_text),
				productUrl: str(block.button_url),
			});

		default:
			throw new Error(`Unknown content block type: ${block.type}`);
	}
}
