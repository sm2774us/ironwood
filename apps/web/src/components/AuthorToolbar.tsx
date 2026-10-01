import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthorStore } from '@/stores/author-store';
import { InlineEditor } from './InlineEditor';

export function AuthorToolbar() {
  const enabled = useAuthorStore((s) => s.enabled);
  const setEnabled = useAuthorStore((s) => s.setEnabled);
  if (!enabled) return null;
  return (
    <>
      <div
        role="region"
        aria-label="Author mode"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-primary/50 bg-card/95 backdrop-blur"
      >
        <div className="container flex flex-wrap items-center justify-between gap-3 py-3">
          <p className="flex items-center gap-2 text-sm">
            <Pencil className="size-4 text-primary" aria-hidden />
            <strong>Author mode</strong>
            <span className="text-muted-foreground">
              Click any dashed element to edit its content fragment.
            </span>
          </p>
          <Button size="sm" variant="outline" onClick={() => setEnabled(false)}>
            Exit author mode
          </Button>
        </div>
      </div>
      <InlineEditor />
    </>
  );
}
