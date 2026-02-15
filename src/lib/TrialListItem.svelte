<script lang="ts">
  import * as Dialog from './components/ui/dialog';
  import { Check, Trash, X } from '@lucide/svelte';
  import { deleteTrial, insertTrialNote } from './data/trials.svelte';
  import type { Trial } from './types';
  import { Button, buttonVariants } from '$lib/components/ui/button';
  import Textarea from './components/Textarea.svelte';
  import TrialNote from './TrialNote.svelte';
  import { tick } from 'svelte';
  import { df } from './utils';

  let { trial = $bindable() }: { trial: Trial } = $props();

  let open = $state(false);
  let addingNote = $state(false);
  let noteInput = $state('');

  let createdAt = $derived(df.format(new Date(trial.created_at)));

  async function toggleOpen() {
    open = !open;

    if (open) {
      await tick();
      document
        .getElementById(`trial-${trial.id}`)
        ?.scrollIntoView({ behavior: 'instant', block: 'start' });
    }
  }

  function startAddNote() {
    addingNote = true;
  }

  function cancelAddNote() {
    addingNote = false;
    noteInput = '';
  }

  async function saveNote() {
    const content = noteInput.trim();

    if (!content) return;

    await insertTrialNote(trial.id, content);

    cancelAddNote();
  }
</script>

<li id={`trial-${trial.id}`} class="m-2 border border-muted">
  <!-- HEADER -->

  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="flex w-full cursor-pointer items-center justify-between gap-2 bg-secondary/50 p-2 hover:bg-primary/10"
    onclick={toggleOpen}
  >
    <div>
      <div class="font-medium">{trial.name}</div>
      {#if trial.description}
        <div class="text-sm text-muted-foreground">
          {trial.description}
        </div>
      {/if}
    </div>

    <div class="text-sm whitespace-nowrap text-muted-foreground">
      {trial.materials.length} materials
    </div>
  </div>

  {#if open}
    <div class="bg-muted/75 p-4">
      <!-- MATERIAL TABLE -->

      <div class="mx-auto w-2/3 border-collapse text-sm">
        <table class="mx-auto w-2/3 border-collapse text-sm">
          <thead>
            <tr class="text-muted-foreground">
              <th class=" border p-2 font-medium">Material</th>
              <th class=" border p-2 font-medium">Type</th>
            </tr>
          </thead>

          <tbody>
            {#each trial.materials as material}
              <tr class="border">
                <td class="border p-2">{material.name}</td>
                <td class="border p-2">{material.type}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>

      <!-- NOTES -->

      <div class="flex w-full flex-wrap justify-center text-sm">
        <div class="my-2 w-full text-center">
          <span class="text-muted-foreground">Notes</span>
        </div>

        {#each trial.notes as _, i}
          <TrialNote bind:note={trial.notes[i]} />
        {/each}

        {#if addingNote}
          <div class="m-2 flex w-1/2 flex-wrap justify-center">
            <Textarea placeholder="Write a note…" bind:value={noteInput} />

            <div class="flex gap-2 p-2">
              <Button size="icon-sm" onclick={() => saveNote()}>
                <Check />
              </Button>

              <Button size="icon-sm" variant="destructive" onclick={cancelAddNote}>
                <X />
              </Button>
            </div>
          </div>
        {/if}

        {#if !addingNote}
          <div class="flex w-full justify-center">
            <Button
              variant="ghost"
              class="m-2 text-xs underline hover:text-foreground"
              onclick={startAddNote}
            >
              Add note
            </Button>
          </div>
        {/if}
      </div>
    </div>

    <!-- FOOTER -->

    <div class="flex items-center justify-between bg-muted/75 p-2">
      <p class="text-muted-foreground">Created {createdAt}</p>

      <Dialog.Root>
        <Dialog.Trigger>
          <Button size="icon" variant="ghost" class="hover:text-destructive">
            <Trash />
          </Button>
        </Dialog.Trigger>

        <Dialog.Content>
          <Dialog.Header>
            <Dialog.Title>Delete trial {trial.name}?</Dialog.Title>
            <Dialog.Description>This action cannot be undone.</Dialog.Description>
          </Dialog.Header>

          <Dialog.Footer>
            <Dialog.Close class={buttonVariants({ variant: 'default' })}>Cancel</Dialog.Close>

            <Button type="submit" variant="destructive" onclick={() => deleteTrial(trial.id)}
              >Delete</Button
            >
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Root>
    </div>
  {/if}
</li>
