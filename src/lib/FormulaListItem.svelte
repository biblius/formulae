<script lang="ts">
  import * as Tooltip from '$lib/components/ui/tooltip/index.js';
  import * as Dialog from './components/ui/dialog';
  import { Check, Copy, FlaskRound, SquarePen, Trash, Undo, X } from '@lucide/svelte';
  import { Button, buttonVariants } from '$lib/components/ui/button';
  import {
    calculateFormulaBuilder,
    cloneFormulaDraft,
    deleteFormula,
    formulae,
    insertFormulaNote,
    spendFormulaDraft,
    toBuilder,
    undoFormula,
    updateFormula
  } from './data/formulae.svelte';
  import { materials } from './data/materials.svelte';
  import { df, gf, pf } from './utils';
  import FormulaNote from './FormulaNote.svelte';
  import type { FormulaBuilder as FormulaBuilderState, Formula } from './types';
  import Textarea from './components/Textarea.svelte';
  import FormulaBuilder from './FormulaBuilder.svelte';
  import Tooltipped from './components/Tooltipped.svelte';

  let open = $state<boolean>(false);
  let editing = $state<boolean>(false);
  let addingNote = $state<boolean>(false);
  let noteInput = $state<string>('');

  let deleteDialogOpen = $state(false);
  let undoDialogOpen = $state(false);

  let {
    formula = $bindable(),
    onDraftSpend = () => {}
  }: { formula: Formula; onDraftSpend?: () => void } = $props();

  let createdAt = $derived(df.format(new Date(formula.created_at)));

  async function toggleOpen() {
    open = !open;
    // if (open) {
    // await tick(); // wait for expanded DOM
    // document.getElementById(`formula-${formula.id}`)?.scrollIntoView({
    //   behavior: 'instant',
    //   block: 'start'
    // });
    // }
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

    await insertFormulaNote(formula.id, content, formula.type);

    cancelAddNote();
  }

  let builder = $state<FormulaBuilderState>(toBuilder(formula));
  let result = $derived(calculateFormulaBuilder(toBuilder(formula)));

  let exceeded = $derived(
    result.entries.filter((material) => {
      if (material.type === 'MATERIAL') {
        const available = materials.get(material.id)?.grams_available;
        if (!available) return false;
        return material.totalMass > available;
      }
      if (material.type === 'MIXTURE') {
        const available = formulae.get(material.id)?.grams_available;
        if (!available) return false;
        return material.totalMass > available;
      }
    })
  );
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<li id={`formula-${formula.id}`} class="mx-auto my-2 w-5/6 border border-muted not-sm:w-full">
  <!-- HEADER -->

  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <div
    class="flex w-full cursor-pointer flex-wrap items-center justify-between gap-2 bg-secondary/50 p-2 hover:bg-primary/10"
    onclick={() => toggleOpen()}
  >
    <div class="flex w-full items-center justify-between gap-2">
      <div class="w-2/3">
        <div class="font-medium">{formula.name}</div>
        {#if formula.description}
          <div class="text-sm text-muted-foreground">
            {formula.description}
          </div>
        {/if}
      </div>
      <div class="flex w-1/3 flex-wrap text-end text-sm text-muted-foreground">
        <p class="w-full">
          {df.format(new Date(formula.created_at))}
        </p>
        <p class="w-full">
          {formula.grams_total} g ({formula.materials.length} materials)
        </p>
      </div>
    </div>
  </div>

  {#if open}
    {#if editing}
      <FormulaBuilder
        bind:formula={builder}
        onSave={async (f) => {
          if (f.materials.length === 0) {
            console.error('no materials');
            return;
          }

          for (const material of f.materials) {
            if (material.grams <= 0) {
              console.error('material cannot be 0 or less!');
              return;
            }
          }

          await updateFormula(formula.id, f);

          f.reset();

          editing = false;
        }}
        onCancel={() => {
          editing = false;
          builder.reset();
        }}
      />
    {:else}
      <div class="bg-muted/75 p-4">
        <div class="m-2 w-full overflow-x-auto">
          <table class="mx-auto w-2/3 border-collapse text-sm">
            <!-- TABLE HEADER -->

            <thead>
              <tr class="border text-muted-foreground">
                <th class="p-2 pr-2 font-medium">Material</th>
                <th class="p-2 pr-2 font-medium">Amount</th>
                <th class="p-2 pr-2 font-medium">Material g</th>
                <th class="p-2 pr-2 font-medium">Material %</th>
                <th class="p-2 pr-2 font-medium">Material PPT</th>
              </tr>
            </thead>

            <!-- BODY -->

            <tbody class="tabular-nums">
              {#each result.entries as material}
                <tr class="border text-left tabular-nums">
                  <td class="p-2 pr-2">{material.name}</td>

                  <!-- AMOUNT -->

                  <td class="p-2 pr-2 tabular-nums">
                    {gf.format(material.totalMass)}
                  </td>

                  <!-- MATERIAL G -->

                  <td class="p-2 pr-2">
                    {gf.format(material.materialMass)}
                  </td>

                  <!-- MATERIAL % -->

                  <td class="p-2 pr-2">
                    {pf.format(material.materialPercent!!)}
                  </td>

                  <!-- PPT -->

                  <td class="p-2 pr-2">
                    {material.materialPPT}
                  </td>
                </tr>
              {/each}

              <!-- SOLVENT -->

              <tr class="border-b text-muted-foreground tabular-nums">
                <td class="p-2">Solvent</td>

                <!-- AMOUNT -->

                <td class="relative p-2">
                  <Tooltipped text="Solvent mass manually added">
                    {gf.format(result.addedSolventMass)}
                  </Tooltipped>
                </td>

                <!-- MATERIAL G -->

                <td class="p-2">
                  <Tooltipped text="Solvent mass from materials">
                    {gf.format(result.materialSolventMass)}
                  </Tooltipped>
                </td>

                <!-- MATERIAL % -->

                <td class="p-2">
                  {pf.format(result.solventPercent)}
                </td>

                <!-- PPT -->

                <td class="p-2">
                  {result.solventPPT}
                </td>
              </tr>
            </tbody>

            <!-- TOTAL -->

            <tfoot>
              <tr class="p-2 tabular-nums">
                <td class="p-2 pr-2">Total ({result.totalMaterials} materials)</td>

                <td class="p-2 pr-2 font-bold tabular-nums">
                  <Tooltipped
                    text="Total mass ({gf.format(result.materialMass)} materials + {gf.format(
                      result.addedSolventMass + result.materialSolventMass
                    )} solvent)"
                  >
                    {gf.format(result.totalMass)}
                  </Tooltipped>
                </td>

                <td class="p-2 pr-2 font-bold">
                  <Tooltipped text="Total material mass (excluding solvent)">
                    {gf.format(result.materialMass)}
                  </Tooltipped>
                </td>

                <td class="p-2 pr-2 font-bold">
                  <Tooltipped text="Material percentage of total mass">
                    {pf.format(result.materialPercent)}
                  </Tooltipped>
                </td>

                <td class="p-2 pr-2">
                  <Tooltipped text="Material parts per thousand of total mass">
                    {result.materialPPT}
                  </Tooltipped>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <!-- Notes -->

        <div class="flex w-full flex-wrap justify-center overflow-x-auto text-sm">
          <div class="my-2 w-full border-b text-left">
            <span class="text-muted-foreground">Notes</span>
          </div>

          {#each formula.notes as note, i (note.id)}
            <FormulaNote bind:note={formula.notes[i]} />
          {/each}

          {#if addingNote}
            <div class="m-2 flex w-1/2 flex-wrap justify-center">
              <Textarea placeholder="Write a note…" bind:value={noteInput} />

              <div class="flex gap-2 p-2">
                <Button size="icon-sm" onclick={() => saveNote()}><Check /></Button>
                <Button size="icon-sm" variant="destructive" onclick={() => cancelAddNote()}
                  ><X /></Button
                >
              </div>
            </div>
          {/if}

          {#if !addingNote}
            <div class="flex w-full justify-center">
              <Button
                variant="ghost"
                class="m-2 text-xs underline hover:text-foreground"
                onclick={() => startAddNote()}
              >
                Add note
              </Button>
            </div>
          {/if}
        </div>
      </div>

      <div class=" flex items-center justify-between bg-muted/75 p-2">
        <p class="text-muted-foreground">Created {createdAt}</p>

        <div>
          {#if formula.type === 'DRAFT'}
            <!-- {JSON.stringify(result.entries.length)} -->
            <!-- {JSON.stringify(exceeded)} -->
            <Button
              class="z-50"
              variant="ghost"
              disabled={result.entries.length < 1 || exceeded.length > 0}
              onclick={() => {
                if (formula.materials.length < 1) {
                  console.warn('no materials');
                  return;
                }

                onDraftSpend();

                spendFormulaDraft(formula);
                cancelAddNote();
                builder.reset();
                open = false;
              }}><FlaskRound /></Button
            >
            <Button class="z-50" variant="ghost" onclick={() => (editing = !editing)}
              ><SquarePen /></Button
            >
            <Button
              class="z-50"
              variant="ghost"
              onclick={() => {
                cloneFormulaDraft(formula);
                cancelAddNote();
                builder.reset();
                open = false;
              }}><Copy /></Button
            >
          {/if}
          <!-- UNDO FORMULA -->

          {#if formula.type === 'MIXTURE'}
            <Dialog.Root bind:open={undoDialogOpen}>
              <Dialog.Trigger>
                <Button size="icon" variant="ghost" class="hover:text-destructive"><Undo /></Button>
              </Dialog.Trigger>
              <Dialog.Content>
                <Dialog.Header>
                  <Dialog.Title>Undo mixture {formula.name}?</Dialog.Title>
                  <Dialog.Description
                    >This will delete the mixture and restore all the materials used to create it.
                    This action cannot be undone.</Dialog.Description
                  >
                </Dialog.Header>

                <Dialog.Footer>
                  <Dialog.Close class={buttonVariants({ variant: 'default' })}>Cancel</Dialog.Close>
                  <Button
                    type="submit"
                    variant="destructive"
                    onclick={() => {
                      undoFormula(formula.id);
                      undoDialogOpen = false;
                    }}>Undo</Button
                  >
                </Dialog.Footer>
              </Dialog.Content>
            </Dialog.Root>
          {/if}

          <!-- DELETE FORMULA -->

          <Dialog.Root bind:open={deleteDialogOpen}>
            <Dialog.Trigger>
              <Button size="icon" variant="ghost" class="hover:text-destructive"><Trash /></Button>
            </Dialog.Trigger>
            <Dialog.Content>
              <Dialog.Header>
                <Dialog.Title
                  >Delete {formula.type === 'MIXTURE' ? 'mixture' : 'draft'}
                  {formula.name}?</Dialog.Title
                >
                <Dialog.Description
                  >No materials will be restored. This action cannot be undone.</Dialog.Description
                >
              </Dialog.Header>

              <Dialog.Footer>
                <Dialog.Close class={buttonVariants({ variant: 'default' })}>Cancel</Dialog.Close>
                <Button
                  type="submit"
                  variant="destructive"
                  onclick={() => {
                    deleteFormula(formula.type, formula.id);
                    deleteDialogOpen = false;
                    open = false;
                  }}>Delete</Button
                >
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Root>
        </div>
      </div>
    {/if}
  {/if}
</li>
