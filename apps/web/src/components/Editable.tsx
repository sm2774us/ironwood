import type { ContentModel } from '@ironwood/shared';
import { createElement, type KeyboardEvent, type MouseEvent } from 'react';
import { ueTextAttrs } from '@/lib/aem';
import { cn } from '@/lib/cn';
import { useAuthorStore } from '@/stores/author-store';

type Tag = 'span' | 'p' | 'h1' | 'h2' | 'h3' | 'div';

interface Props {
  model: ContentModel;
  fragment: { _id: string; _path: string };
  prop: string;
  label: string;
  children: string;
  as?: Tag;
  multiline?: boolean;
  className?: string;
}

/**
 * Renders a content-fragment property with Universal Editor instrumentation
 * (`data-aue-resource/prop/type/label`). In the real editor those attributes are all that's needed;
 * in the built-in author mode (`?author=1`) the same element additionally opens an inline editor.
 */
export function Editable({
  model,
  fragment,
  prop,
  label,
  children,
  as = 'span',
  multiline = false,
  className,
}: Props) {
  const enabled = useAuthorStore((s) => s.enabled);
  const openEditor = useAuthorStore((s) => s.openEditor);
  const attrs = ueTextAttrs(fragment, prop, label, multiline ? 'richtext' : 'text');

  if (!enabled) return createElement(as, { className, ...attrs }, children);

  const open = (e: MouseEvent | KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openEditor({ model, id: fragment._id, prop, label, value: children, multiline });
  };
  return createElement(
    as,
    {
      className: cn(
        className,
        'cursor-pointer rounded-sm outline-dashed outline-1 outline-offset-2 outline-primary/70 hover:outline-2',
      ),
      ...attrs,
      role: 'button',
      tabIndex: 0,
      'aria-label': `Edit ${label}`,
      onClick: open,
      onKeyDown: (e: KeyboardEvent) => (e.key === 'Enter' || e.key === ' ') && open(e),
    },
    children,
  );
}
