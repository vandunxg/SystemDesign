import { createGetUrl } from 'fumadocs-core/source';

export const appName = 'System Design Interview';
export const docsRoute = '/docs';
export const docsImageRoute = '/og/docs';
export const docsContentRoute = '/llms.mdx/docs';

const getContentUrl = createGetUrl(docsContentRoute);

export function getPageMarkdownUrl(page: { slugs: string[]; locale?: string }) {
  return {
    segments: [...page.slugs, 'content.md'],
    url: getContentUrl([...page.slugs, 'content.md'], page.locale),
  };
}
