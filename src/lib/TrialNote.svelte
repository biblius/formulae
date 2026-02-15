<script lang="ts">
  import { Check, SquarePen, Trash, X } from '@lucide/svelte';
  import { Button } from '$lib/components/ui/button';
  import { deleteFormulaNote, updateFormulaNote } from './data/formulae.svelte';
  import type { TrialNote } from './types';
  import { dtf } from './utils';
  import Textarea from './components/Textarea.svelte';

  let { note = $bindable() }: { note: TrialNote } = $props();
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
    await deleteFormulaNote(note.trial_id, note.id);
  }
</script>

<div class="flex w-full items-center gap-2 text-sm">
  <Button class="ml-4" size="icon-sm" variant="ghost" onclick={() => startEditNote()}
    ><SquarePen /></Button
  >
  {#if editing}
    <Textarea rows={5} placeholder="Write a note…" bind:value={note.content} />

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
