<script lang="ts">
  import { Check, SquarePen, Trash, X } from '@lucide/svelte';
  import { Button } from '$lib/components/ui/button';
  import { deleteFormulaNote, updateFormulaNote } from './formulae.svelte';
  import type { FormulaNote } from './types';
  import { df, dtf } from './utils';

  let { note = $bindable() }: { note: FormulaNote } = $props();
  let editing = $state(false);
  let lastContent: string | null = $state(null);

  async function saveNote() {
    const content = note.content?.trim();
    if (!content) return;

    await updateFormulaNote(note.id, content);

    editing = false;
    lastContent = null;
  }

  function startEditNote() {
    lastContent = note.content;
    editing = true;
  }

  function cancelEditNote() {
    if (lastContent != null) {
      note.content = lastContent;
    }
    editing = false;
  }

  async function deleteNote() {
    await deleteFormulaNote(note.formula_id, note.id);
  }
</script>

<div class="flex w-full items-center gap-2 text-sm">
  <Button class="ml-4" size="icon-sm" variant="ghost" onclick={() => startEditNote()}
    ><SquarePen /></Button
  >
  {#if editing}
    <textarea
      class="h-40 w-full resize-y rounded-md border p-2 text-sm"
      rows="3"
      placeholder="Write a note…"
      bind:value={note.content}
    ></textarea>

    <div class="flex gap-2 p-2">
      <Button size="icon-sm" onclick={() => saveNote()}><Check /></Button>
      <Button size="icon-sm" variant="destructive" onclick={() => cancelEditNote()}><X /></Button>
      <Button
        class="hover:text-destructive"
        size="icon-sm"
        variant="ghost"
        onclick={() => deleteNote()}><Trash /></Button
      >
    </div>
  {:else}
    <div class="m-1 w-full p-2">
      <p class="my-2 w-full border-b font-bold text-muted-foreground">
        {dtf.format(new Date(note.created_at))}
      </p>
      <p class="whitespace-pre-wrap">{note.content}</p>
    </div>
  {/if}
</div>
