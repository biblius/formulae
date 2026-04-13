<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { materials } from '$lib/data/materials.svelte';
  import type { FormulaBuilder, FormulaBuilderEntry } from './types';
  import { gf, pf } from './utils';
  import { Info, ListRestart, Plus, RefreshCw, Undo, X } from '@lucide/svelte';
  import { Input } from './components/ui/input';
  import Textarea from './components/Textarea.svelte';
  import { calculateFormulaBuilder, formulae, type FormulaEntry } from './data/formulae.svelte';
  import Tooltipped from './components/Tooltipped.svelte';
  import FormulaEntryRow from './FormulaEntryRow.svelte';

  let searching = $state('');

  type BuilderProps = {
    formula?: FormulaBuilder;
    onSave: (formula: FormulaBuilder) => void;
    onCancel: () => void;
  };

  let {
    formula = $bindable<FormulaBuilder>({
      name: '',
      materials: [],
      solvent: 0,

      reset() {
        this.name = '';
        this.materials = [];
        this.solvent = 0;
      }
    }),
    onSave,
    onCancel
  }: BuilderProps = $props();

  let result = $derived(calculateFormulaBuilder(formula));

  let saveEnabled = $derived(formula.name && formula.materials.length > 0);

  function addMaterial(material: FormulaBuilderEntry) {
    formula.materials.push(material);
  }

  function hasMaterial(id: number) {
    for (const m of formula.materials) {
      if (m.original!.id === id) {
        return true;
      }
    }
    return false;
  }

  function materialsDisplay() {
    if (searching) {
      const regex = new RegExp(searching, 'i');
      return materials.inventory().filter((m) => (m.name ? regex.test(m.name) : false));
    }
    return materials.inventory();
  }

  function mixturesDisplay() {
    if (searching) {
      const regex = new RegExp(searching, 'i');
      return formulae.formulae.filter((m) => (m.name ? regex.test(m.name) : false));
    }
    return formulae.formulae;
  }

  let addMaterialType: 'material' | 'mixture' = $state('material');

  function entryValue(e: FormulaEntry): string {
    return formula.materials.find((m) => m.original!.id === e.id)?.grams?.toString() ?? '0';
  }
</script>

<!-- HEADER -->

<div class="mx-4 flex flex-wrap items-center justify-center gap-4 rounded-xl p-2 py-2">
  <!-- NAME -->

  <div class="w-1/2">
    <div class="my-2 not-sm:w-full">
      <Input class="w-full" bind:value={formula.name} placeholder="Name"></Input>
    </div>

    <div class="w-full not-sm:w-full">
      <Textarea rows={4} bind:value={formula.description} placeholder="Description" />
    </div>
  </div>
</div>

<div class="m-2 flex gap-2 border-t border-b border-muted p-4 not-lg:flex-wrap">
  <div>
    <h3 class="pointer-events-none mx-auto text-center text-sm text-muted-foreground">Formula</h3>
    <table class="mx-auto my-6 w-full border-collapse md:table-fixed">
      <!-- HEADER ROW -->

      <thead class="p-2">
        <tr>
          <th class="w-1/8 border p-2 text-center"></th>
          <th class="w-1/4 border p-2 text-center">Material</th>
          <th class="w-1/4 border p-2 text-center">Amount</th>
          <th class="w-1/4 border p-2 text-center">Material g</th>
          <th class="w-1/4 border p-2 text-center">Material %</th>
          <th class="w-1/4 border p-2 text-center">Material PPT</th>
        </tr>
      </thead>

      <tbody class="text-right tabular-nums">
        <!-- MATERIAL ROWS -->

        {#each result.entries as entry (entry.id + entry.type)}
          <FormulaEntryRow bind:formula {entry} />
        {/each}

        <!-- SOLVENT ROW -->

        <tr class="text-muted-foreground tabular-nums">
          <!-- ACTION -->

          <td class="border p-2 text-center text-foreground">
            <Button
              size="icon-sm"
              variant="ghost"
              disabled={formula.solvent === 0}
              onclick={() => {
                formula.solvent = 0;
              }}><Undo /></Button
            >
          </td>

          <!-- NAME -->

          <td class="border p-2 text-center">Solvent</td>

          <!-- AMOUNT G -->

          <td class="border p-2 text-center">
            <Input
              type="number"
              step="0.1"
              min={0}
              class="mx-auto w-20"
              bind:value={formula.solvent}
            ></Input>
            {#if formula.solvent < 0}
              <div class="mt-1 flex items-center justify-center gap-2 text-xs text-destructive">
                <Info class="h-4 w-4" />
                <span>Cannot be negative</span>
              </div>
            {/if}
          </td>

          <!-- SOLVENT G -->

          <td class="border p-2 text-center">
            <Tooltipped text="Solvent mass from materials">
              {gf.format(result.materialSolventMass)}
            </Tooltipped>
          </td>

          <!-- SOLVENT % -->

          <td class="border p-2 text-center">
            {pf.format(result.solventPercent)}
          </td>

          <!-- SOLVENT PPT -->

          <td class="border p-2 text-center">
            {result.solventPPT}
          </td>
        </tr>

        <!-- TOTAL ROW -->

        <tr class="tabular-nums">
          <!-- ACTION -->
          <td class="border p-2 text-center font-bold">Total</td>

          <!-- MATERIAL -->

          <td class="border p-2 text-center font-bold">
            {result.totalMaterials}
            {#if result.totalMaterials === 1}
              material
            {:else}
              materials
            {/if}
          </td>

          <!-- AMOUNT -->

          <td class="border p-2 text-center font-bold">
            <Tooltipped
              text="Total mass ({gf.format(result.materialMass)} materials + {gf.format(
                result.addedSolventMass + result.materialSolventMass
              )} solvent)"
            >
              {gf.format(result.totalMass)}
            </Tooltipped>
          </td>

          <!-- MATERIAL G -->

          <td class="border p-2 text-center font-bold">
            <Tooltipped text="Total material mass (excluding solvent)">
              {gf.format(result.materialMass)}
            </Tooltipped>
          </td>

          <!-- MATERIAL % -->

          <td class="border p-2 text-center font-bold">
            {pf.format(result.materialPercent)}
          </td>

          <!-- MATERIAL PPT -->

          <td class="border p-2 text-center font-bold text-muted-foreground">
            <span class="text-foreground">{result.materialPPT}</span> / 1000
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- ADD MATERIALS -->

  <div>
    <div>
      <h3
        class="mx-auto flex items-center justify-center text-center text-sm text-muted-foreground"
      >
        Add
      </h3>

      <div class="mx-auto flex w-5/6 items-center justify-center gap-2">
        <Input type="search" placeholder="Search inventory" class="my-2" bind:value={searching} />
        <Button
          variant={addMaterialType === 'material' ? 'default' : 'outline'}
          onclick={() => (addMaterialType = 'material')}>Material</Button
        >
        <Button
          variant={addMaterialType === 'mixture' ? 'default' : 'outline'}
          onclick={() => (addMaterialType = 'mixture')}>Mixture</Button
        >
      </div>

      {#if addMaterialType === 'material'}
        <div class="mx-auto my-4 w-5/6">
          <div class="max-h-100 overflow-scroll">
            <table class="relative mx-auto w-full border-collapse border md:table-fixed">
              <thead class="sticky top-0 z-10 border">
                <tr>
                  <th class="sticky w-1/8 border bg-muted p-2 text-center">Add</th>
                  <th class="sticky w-1/4 border bg-muted p-2 text-center">Material</th>
                  <th class="sticky w-1/4 border bg-muted p-2 text-center">Available (g)</th>
                </tr>
              </thead>

              <tbody class="tabular-nums">
                {#each materialsDisplay() as material}
                  <!-- MATERIAL ROWS -->

                  <tr class:text-muted-foreground={hasMaterial(material.id)} class="relative">
                    <!-- ACTIONS -->

                    <td class="w-1/8 border p-2 text-center">
                      <Button
                        variant="ghost"
                        disabled={hasMaterial(material.id)}
                        onclick={() =>
                          addMaterial({
                            original: material,
                            name:
                              material.name ??
                              materials.getAbstract(material.material_id)?.name ??
                              '',
                            materialId: material.id,
                            type: 'MATERIAL',
                            grams: 0
                          })}
                      >
                        <Plus /></Button
                      >
                    </td>
                    <td class="w-1/4 border p-2 text-center wrap-anywhere">
                      {material.name}
                    </td>

                    <td class="w-1/4 border p-2 text-center">
                      {gf.format(material.grams_available)}
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </div>
      {:else}
        <div class="mx-auto my-4 w-5/6">
          <div class="max-h-100 overflow-scroll">
            <table class="relative mx-auto w-full border-collapse border md:table-fixed">
              <thead class="sticky top-0 z-10 border">
                <tr>
                  <th class="sticky w-1/8 border bg-muted p-2 text-center">Add</th>
                  <th class="sticky w-1/4 border bg-muted p-2 text-center">Mixture</th>
                  <th class="sticky w-1/4 border bg-muted p-2 text-center">Available (g)</th>
                </tr>
              </thead>

              <tbody class="tabular-nums">
                {#each mixturesDisplay() as mixture}
                  <!-- MATERIAL ROWS -->

                  <tr class:text-muted-foreground={hasMaterial(mixture.id)} class="relative">
                    <!-- ACTIONS -->

                    <td class="w-1/8 border p-2 text-center">
                      <Button
                        variant="ghost"
                        disabled={hasMaterial(mixture.id)}
                        onclick={() =>
                          addMaterial({
                            original: mixture,
                            name: mixture.name,
                            materialId: mixture.id,
                            type: 'MIXTURE',
                            grams: 0
                          })}
                      >
                        <Plus /></Button
                      >
                    </td>
                    <td class="w-1/4 border p-2 text-center wrap-anywhere">
                      {mixture.name}
                    </td>

                    <td class="w-1/4 border p-2 text-center">
                      {gf.format(mixture.grams_available)}
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>

<div class="flex w-full justify-center gap-2 p-4">
  <Button variant="destructive" onclick={() => onCancel()}>Cancel</Button>
  <Button disabled={!saveEnabled} onclick={() => onSave(formula)}>Save</Button>
</div>

<!-- <div class="whitespace-pre"> -->
<!--   {JSON.stringify(result, null, 4)} -->
<!-- </div> -->
