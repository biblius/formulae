<script lang="ts">
  import * as Dialog from './components/ui/dialog';
  import { Check, SquarePen, Trash, Undo, X } from '@lucide/svelte';
  import { Button, buttonVariants } from '$lib/components/ui/button';
  import {
    deleteFormula,
    insertFormulaNote,
    undoFormula,
    updateFormula,
    type FormulaType
  } from './data/formulae.svelte';
  import { materials } from './data/materials.svelte';
  import { df, gf, pf } from './utils';
  import FormulaNote from './FormulaNote.svelte';
  import type { FormulaBuilder as FormulaBuilderState, Formula, FormulaMaterial } from './types';
  import { tick } from 'svelte';
  import Textarea from './components/Textarea.svelte';
  import FormulaBuilder from './FormulaBuilder.svelte';

  let open = $state<boolean>(false);
  let editing = $state<boolean>(false);
  let addingNote = $state<boolean>(false);
  let noteInput = $state<string>('');

  let deleteDialogOpen = $state(false);
  let undoDialogOpen = $state(false);

  let { formula = $bindable() }: { formula: Formula<FormulaType> } = $props();

  let createdAt = $derived(df.format(new Date(formula.created_at)));

  let materialTotal = $derived(
    formula.materials.reduce((acc, material) => acc + material.grams, 0)
  );

  let materialDilutionTotal = $derived(
    formula.materials.reduce((acc, material) => {
      const original = materials.get(material.material_id);

      if (!original) {
        return acc;
      }

      if (original.grams_material != null && original.grams_solvent != null) {
        const ratio = original.grams_material / (original.grams_material + original.grams_solvent);
        return acc + material.grams * ratio;
      }

      return acc + material.grams;
    }, 0)
  );

  let concentrationTotalAbs = $derived(materialDilutionTotal / formula.grams_total);

  async function toggleOpen() {
    open = !open;
    if (open) {
      await tick(); // wait for expanded DOM
      document.getElementById(`formula-${formula.id}`)?.scrollIntoView({
        behavior: 'instant',
        block: 'start'
      });
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

    await insertFormulaNote(formula.id, content, formula.type);

    cancelAddNote();
  }

  function concentration(material: FormulaMaterial): number {
    return material.grams / materialTotal;
  }

  function concentrationAbs(material: FormulaMaterial): number {
    const original = materials.get(material.material_id);

    if (!original) {
      return -1;
    }

    if (original.grams_material != null && original.grams_solvent != null) {
      let concentration =
        original.grams_material / (original.grams_material + original.grams_solvent);
      return (material.grams * concentration) / materialTotal;
    }

    return material.grams / materialTotal;
  }

  let builder = $state<FormulaBuilderState>({
    name: formula.name,
    type: formula.type,
    description: formula.description ?? undefined,
    materials: formula.materials.map((m) => {
      return {
        original: materials.get(m.material_id)!!,
        grams: m.grams
      };
    }),
    solventGrams:
      formula.grams_total - formula.materials.reduce((acc, material) => acc + material.grams, 0),
    targetGrams: formula.grams_total,

    reset() {
      this.name = formula.name;
      this.type = formula.type;
      this.description = formula.description ?? undefined;
      this.materials = formula.materials.map((m) => {
        return {
          original: materials.get(m.material_id)!!,
          grams: m.grams
        };
      });
      this.solventGrams =
        formula.grams_total - formula.materials.reduce((acc, material) => acc + material.grams, 0);
      this.targetGrams = formula.grams_total;
    }
  });
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
      <div class="font-medium">{formula.name}</div>
      <div class="text-sm whitespace-nowrap text-muted-foreground">
        {formula.grams_total} g ({formula.materials.length} materials)
      </div>
    </div>
    {#if formula.description}
      <div class="text-sm text-muted-foreground">
        {formula.description}
      </div>
    {/if}
  </div>

  {#if open}
    {#if editing}
      <FormulaBuilder
        bind:formula={builder}
        onSave={async (f) => {
          await updateFormula(formula.id, f);
          editing = false;
        }}
        onCancel={() => {
          editing = false;
          builder.reset();
        }}
        editing={true}
      />
    {:else}
      <div class="bg-muted/75 p-4">
        <div class="m-2 w-full overflow-x-auto">
          <table class="mx-auto w-2/3 border-collapse text-sm">
            <!-- TABLE HEADER -->

            <thead>
              <tr class="border text-muted-foreground">
                <th class="p-2 pr-2 font-medium">Material</th>
                <th class="p-2 pr-2 font-medium">Type</th>
                <th class="p-2 pr-2 font-medium">Amount</th>
                <th class="p-2 pr-2 font-medium">% material</th>
                <th class="p-2 pr-2 font-medium">% material (undiluted)</th>
                <th class="p-2 pr-2 font-medium">% total</th>
              </tr>
            </thead>

            <!-- BODY -->

            <tbody>
              {#each formula.materials as material}
                <tr class="border">
                  <td class="p-2 pr-2">{materials.get(material.material_id)?.name}</td>
                  <td class="p-2 pr-2">{materials.get(material.material_id)?.type}</td>

                  <!-- GRAMS MATERIAL -->

                  <td class="p-2 pr-2 tabular-nums">
                    {gf.format(material.grams)}
                  </td>

                  <!-- % MATERIAL -->

                  <td class="p-2 pr-2">
                    {pf.format(concentration(material))}
                  </td>

                  <!-- % MATERIAL ABS -->

                  <td class="p-2 pr-2">
                    {pf.format(concentrationAbs(material))}
                  </td>

                  <!-- % TOTAL -->

                  <td class="p-2 pr-2">
                    {pf.format(material.grams / formula.grams_total)}
                  </td>
                </tr>
              {/each}

              <!-- SOLVENT -->

              <tr class="border-b text-muted-foreground">
                <td class="p-2">Solvent</td>

                <td class="p-2">-</td>

                <td class="p-2">{gf.format(formula.grams_total - materialTotal)}</td>

                <td class="p-2">-</td>

                <td class="p-2">-</td>

                <td class="p-2"
                  >{pf.format((formula.grams_total - materialTotal) / formula.grams_total)}</td
                >
              </tr>
            </tbody>

            <!-- FOOTER -->

            <tfoot>
              <tr class="p-2 font-bold">
                <td class="p-2 pr-2">Total</td>

                <td class="p-2 pr-2">-</td>

                <td class="p-2 pr-2 tabular-nums">
                  {gf.format(formula.grams_total)}
                </td>

                <td class="p-2 pr-2">-</td>

                <td class="p-2 pr-2">{pf.format(concentrationTotalAbs)}</td>

                <td class="p-2 pr-2">{pf.format(1)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <!-- Notes -->

        <div class="flex w-full flex-wrap justify-center overflow-x-auto text-sm">
          <div class="my-2 w-full border-b text-left">
            <span class="text-muted-foreground">Notes</span>
          </div>

          {#each formula.notes as _, i}
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
            <Button class="z-50" variant="ghost" onclick={() => (editing = !editing)}
              ><SquarePen /></Button
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
