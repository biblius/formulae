<script lang="ts">
  import * as Dialog from './components/ui/dialog';
  import { Check, Trash, X } from '@lucide/svelte';
  import { Button, buttonVariants } from '$lib/components/ui/button';
  import { deleteFormula, insertFormulaNote } from './formulae.svelte';
  import { materials } from './materials.svelte';
  import { df, gf, pf } from './utils';
  import FormulaNote from './FormulaNote.svelte';
  import type { Formula, FormulaMaterial } from './types';
  import { tick } from 'svelte';

  let open = $state<boolean>(false);
  let addingNote = $state<boolean>(false);
  let noteInput = $state<string>('');

  let { formula = $bindable() }: { formula: Formula } = $props();

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

  let concentrationTotal = $derived(materialTotal / formula.grams_total);
  let concentrationTotalAbs = $derived(materialDilutionTotal / formula.grams_total);

  async function toggleOpen() {
    open = !open;
    if (open) {
      await tick(); // wait for expanded DOM
      document.getElementById(`formula-${formula.id}`)?.scrollIntoView({
        behavior: 'smooth',
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

    await insertFormulaNote(formula.id, content);

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
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<li id={`formula-${formula.id}`} class="m-2 border">
  <!-- HEADER -->

  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <div
    class="flex w-full cursor-pointer items-center justify-between gap-2 bg-muted/50 p-2 hover:bg-primary/50"
    onclick={() => toggleOpen()}
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
  </div>

  {#if open}
    <div class="bg-secondary p-4">
      <div class="m-2 w-full overflow-x-auto">
        <table class="mx-auto w-2/3 border-collapse text-sm">
          <!-- HEADER -->

          <thead>
            <tr class="border text-muted-foreground">
              <th class="p-2 pr-2 font-medium">Material</th>
              <th class="p-2 pr-2 font-medium">Type</th>
              <th class="p-2 pr-2 font-medium">Amount</th>
              <th class="p-2 pr-2 font-medium">% material</th>
              <th class="p-2 pr-2 font-medium">% material (abs)</th>
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

              <td class="p-2 pr-2">{pf.format(concentrationTotal)}</td>

              <td class="p-2 pr-2">{pf.format(concentrationTotalAbs)}</td>

              <td class="p-2 pr-2">{pf.format(1)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <!-- Notes -->

      <div class="flex w-full flex-wrap justify-center overflow-x-auto text-sm">
        <div class="my-2 w-full text-center">
          <span class="text-muted-foreground">Notes</span>
        </div>

        {#each formula.notes as _, i}
          <FormulaNote bind:note={formula.notes[i]} />
        {/each}

        {#if addingNote}
          <div class="m-2 flex w-1/2 flex-wrap justify-center">
            <textarea
              class="h-40 w-full resize-y rounded-md border p-2 text-sm"
              rows="3"
              placeholder="Write a note…"
              bind:value={noteInput}
            ></textarea>

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

    <div class=" flex items-center justify-between bg-secondary p-2">
      <p class="text-muted-foreground">Created {createdAt}</p>
      <Dialog.Root>
        <Dialog.Trigger>
          <Button size="icon" variant="ghost" class="hover:text-destructive"><Trash /></Button>
        </Dialog.Trigger>
        <Dialog.Content>
          <Dialog.Header>
            <Dialog.Title>Delete {formula.name}?</Dialog.Title>
            <Dialog.Description>This action cannot be undone.</Dialog.Description>
          </Dialog.Header>

          <Dialog.Footer>
            <Dialog.Close class={buttonVariants({ variant: 'default' })}>Cancel</Dialog.Close>
            <Button type="submit" variant="destructive" onclick={() => deleteFormula(formula.id)}
              >Delete</Button
            >
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Root>
    </div>
  {/if}
</li>
