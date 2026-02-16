<script lang="ts">
  import { Check, SquarePen, Trash, X } from '@lucide/svelte';
  import { Button } from '$lib/components/ui/button';
  import type { TrialNote } from './types';
  import { dtf } from './utils';
  import Textarea from './components/Textarea.svelte';
  import { deleteTrialNote, updateTrialNote } from './data/trials.svelte';

  let { note = $bindable() }: { note: TrialNote } = $props();
  let editing = $state(false);
  let noteInput: string = $state('');

  async function saveNote() {
    const content = noteInput?.trim();

    if (!content) return;

    await updateTrialNote(note.id, noteInput);

    note.content = noteInput;

    cancelEditNote();
  }

  function startEditNote() {
    if (editing) {
      cancelEditNote();
      return;
    }
    noteInput = note.content;
    editing = true;
  }

  function cancelEditNote() {
    noteInput = '';
    editing = false;
  }

  async function deleteNote() {
    await deleteTrialNote(note.trial_id, note.id);
    cancelEditNote();
  }
</script>

<div class="flex w-full items-center gap-2 text-sm">
  <Button
    class="ml-4"
    size="icon-sm"
    variant={editing ? 'default' : 'ghost'}
    onclick={() => startEditNote()}><SquarePen /></Button
  >
  {#if editing}
    <Textarea rows={5} placeholder="Write a note…" bind:value={noteInput} />

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
