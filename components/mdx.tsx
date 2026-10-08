import defaultMdxComponents from 'fumadocs-ui/mdx';
import type { ComponentProps } from 'react';
import type { MDXComponents } from 'mdx/types';

function Table({ children, ...props }: ComponentProps<'table'>) {
  return (
    <div className="sd-table-wrap" role="region" tabIndex={0} aria-label="Bảng dữ liệu">
      <table {...props}>{children}</table>
    </div>
  );
}

function Blockquote({ children, ...props }: ComponentProps<'blockquote'>) {
  return (
    <blockquote className="sd-callout" {...props}>
      <span className="sd-callout-mark" aria-hidden="true">
        i
      </span>
      <div>{children}</div>
    </blockquote>
  );
}

function Divider(props: ComponentProps<'hr'>) {
  return <hr className="sd-divider" {...props} />;
}

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    table: Table,
    blockquote: Blockquote,
    hr: Divider,
    ...components,
  } satisfies MDXComponents;
}

export const useMDXComponents = getMDXComponents;

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}
