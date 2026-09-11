import type { MDXComponents } from 'mdx/types'

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h1: (p) => <h1 className="font-display text-4xl text-crema-white" {...p} />,
    h2: (p) => <h2 className="mt-10 font-display text-2xl text-crema-white" {...p} />,
    p: (p) => <p className="mt-4 text-on-surface-variant" {...p} />,
    ul: (p) => <ul className="mt-4 list-disc space-y-2 pl-6 text-on-surface-variant" {...p} />,
    a: (p) => <a className="text-burnished-gold underline" {...p} />,
    ...components,
  }
}
