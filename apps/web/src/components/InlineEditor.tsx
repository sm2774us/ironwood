import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, type FormEvent } from 'react';
import { analytics } from '@/analytics';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input, Textarea } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { contentKeys, patchContent } from '@/features/content/queries';
import { useAuthorStore } from '@/stores/author-store';

/** Author-mode editor: the same PATCH-a-content-fragment write path the Universal Editor performs against AEM. */
export function InlineEditor() {
  const editing = useAuthorStore((s) => s.editing);
  const close = useAuthorStore((s) => s.closeEditor);
  const qc = useQueryClient();
  const [value, setValue] = useState('');

  useEffect(() => setValue(editing?.value ?? ''), [editing]);

  const save = useMutation({
    mutationFn: () => {
      if (!editing) throw new Error('nothing to save');
      return patchContent(editing.model, editing.id, { prop: editing.prop, value });
    },
    onSuccess: async () => {
      analytics.track('content_edited', { model: editing?.model ?? '', prop: editing?.prop ?? '' });
      await qc.invalidateQueries({ queryKey: contentKeys.all });
      close();
    },
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    save.mutate();
  };

  return (
    <Dialog open={!!editing} onOpenChange={(o) => !o && close()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit {editing?.label}</DialogTitle>
          <DialogDescription>
            Changes write to the <code>{editing?.model}</code> content fragment and publish
            instantly to this page.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="inline-edit">{editing?.label}</Label>
            {editing?.multiline ? (
              <Textarea
                id="inline-edit"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                rows={4}
              />
            ) : (
              <Input id="inline-edit" value={value} onChange={(e) => setValue(e.target.value)} />
            )}
          </div>
          {save.isError && (
            <p role="alert" className="text-sm text-destructive">
              {save.error.message}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={close}>
              Cancel
            </Button>
            <Button type="submit" disabled={save.isPending || value === editing?.value}>
              {save.isPending ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
