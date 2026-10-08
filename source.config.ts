import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';
import { defineConfig } from 'fumadocs-mdx/config';

export default defineConfig({
  mdxOptions: {
    remarkPlugins: (plugins) => [remarkMath, ...plugins],
    rehypePlugins: (plugins) => [...plugins, [rehypeKatex, { strict: false }]],
    rehypeCodeOptions: {
      themes: {
        light: 'github-dark',
        dark: 'github-dark',
      },
      langAlias: {
        flux: 'text',
        math: 'text',
      },
    },
  },
});
