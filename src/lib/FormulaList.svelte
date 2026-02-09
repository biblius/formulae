<script lang="ts">
  import { Trash } from '@lucide/svelte';
  import { Button } from '$lib/components/ui/button';
  import { deleteFormulaNote, insertFormulaNote } from './formula.svelte';
  import type { Formula } from './types';

  const { formulae } = $props<{ formulae: Formula[] }>();

  let openId = $state<number | null>(null);

  // per-formula UI state
  let addingNoteFor = $state<Set<number>>(new Set());
  let noteDrafts = $state<Record<number, string>>({});

  function toggle(id: number) {
    openId = openId === id ? null : id;
  }

  function startAddNote(id: number) {
    addingNoteFor.add(id);
    addingNoteFor = new Set(addingNoteFor);
  }

  function cancelAddNote(id: number) {
    addingNoteFor.delete(id);
    addingNoteFor = new Set(addingNoteFor);
    delete noteDrafts[id];
  }

  async function saveNote(id: number) {
    const content = noteDrafts[id]?.trim();
    if (!content) return;

    await insertFormulaNote(id, content);

    cancelAddNote(id);
  }

  async function deleteNote(formulaId: number, id: number) {
    await deleteFormulaNote(formulaId, id);
  }
</script>

<ul class="divide-y rounded-md border">
  {#each formulae as formula}
    <li>
      <!-- HEADER -->

      <button
        class="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-muted/50"
        onclick={() => toggle(formula.id)}
      >
        <div>
          <div class="font-medium">{formula.name}</div>
          {#if formula.description}
            <div class="text-sm text-muted-foreground">
              {formula.description}
            </div>
          {/if}
        </div>

        <div class="text-sm whitespace-nowrap text-muted-foreground">
          {formula.grams_total} g ({formula.materials.length} materials)
        </div>
      </button>

      {#if openId === formula.id}
        <div class="px-4 pb-4">
          <!-- Materials table -->
          <table class="w-full border-collapse border text-sm">
            <thead>
              <tr class="border-b text-left">
                <th class="py-1 pr-2 font-medium">Material</th>
                <th class="py-1 pr-2 text-right font-medium">Grams</th>
              </tr>
            </thead>
            <tbody>
              {#each formula.materials as material}
                <tr class="border-b last:border-b-0">
                  <td class="py-1 pr-2">{material.material_id}</td>
                  <td class="py-1 pr-2 text-right tabular-nums">
                    {material.grams}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>

          <!-- Notes -->

          <div class="mt-3 text-sm">
            <div class="mb-1 flex items-center justify-between">
              <span class="text-muted-foreground">Notes</span>
            </div>

            {#if formula.notes.length > 0}
              <ul class="list-disc space-y-1 pl-5 text-muted-foreground">
                {#each formula.notes as note}
                  <li class="flex items-center gap-4">
                    <Button
                      class="hover:text-destructive"
                      size="icon-sm"
                      variant="ghost"
                      onclick={() => deleteNote(formula.id, note.id)}><Trash /></Button
                    >
                    <div class="m-1 p-2">
                      <p class="border-b font-bold">{note.created_at}</p>
                      <p>{note.content}</p>
                    </div>
                  </li>
                {/each}
              </ul>
            {/if}

            <!-- Add note textarea -->
            {#if addingNoteFor.has(formula.id)}
              <div class="mt-2 space-y-2">
                <textarea
                  class="w-full resize-y rounded-md border p-2 text-sm"
                  rows="3"
                  placeholder="Write a note…"
                  bind:value={noteDrafts[formula.id]}
                ></textarea>

                <div class="flex gap-2">
                  <button
                    class="rounded-md border px-2 py-1 text-sm hover:bg-muted"
                    onclick={() => saveNote(formula.id)}
                  >
                    Save
                  </button>

                  <button
                    class="px-2 py-1 text-sm text-muted-foreground hover:underline"
                    onclick={() => cancelAddNote(formula.id)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            {/if}

            {#if !addingNoteFor.has(formula.id)}
              <button
                class="text-xs text-muted-foreground underline hover:text-foreground"
                onclick={() => startAddNote(formula.id)}
              >
                Add note
              </button>
            {/if}
          </div>
        </div>
      {/if}
    </li>
  {/each}
</ul>
