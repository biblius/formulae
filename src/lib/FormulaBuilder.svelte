<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { materials } from '$lib/data/materials.svelte';
  import type { FormulaBuilder, Material, MaterialSpend } from './types';
  import { gf, pf } from './utils';
  import { Info, Plus, X } from '@lucide/svelte';
  import { Input } from './components/ui/input';
  import Textarea from './components/Textarea.svelte';

  let exceeded = $state<number[]>([]);
  let searching = $state('');

  let {
    formula = $bindable<FormulaBuilder>({
      name: '',
      type: 'DRAFT',
      materials: [],
      solvent: 0,

      reset() {
        this.name = '';
        this.materials = [];
        this.solvent = 0;
        this.type = 'DRAFT';
      }
    }),
    onSave,
    onCancel
  } = $props<{
    formula?: FormulaBuilder;
    onSave: (formula: FormulaBuilder) => void;
    onCancel: () => void;
  }>();

  // type MaterialFilterConfig = {
  //   sort
  // };
  // let materialFilterConfig = $state({})

  /**
   * Absolute mass of material before dilution
   */
  let materialMassAbsolute = $derived(
    formula.materials.reduce((acc: number, material: MaterialSpend) => acc + material.grams, 0)
  );

  /**
   * Absolute mass of material after dilution
   */
  let materialMassDiluted = $derived(
    formula.materials.reduce((acc: number, material: MaterialSpend) => {
      if (material.original.grams_material != null && material.original.grams_solvent != null) {
        const ratio =
          material.original.grams_material /
          (material.original.grams_material + material.original.grams_solvent);
        return acc + material.grams * ratio;
      }
      return acc + material.grams;
    }, 0)
  );

  /**
   * Either the formula target grams if using solvent or the diluted material absolute mass if not.
   */
  let totalMass = $derived(formula.solvent + materialMassAbsolute);

  /**
   * % of material after dilution
   */
  let concentrationMaterialAbsolute = $derived(
    totalMass === 0 ? 0 : materialMassDiluted / totalMass
  );

  let saveEnabled = $derived(
    formula.name &&
      formula.materials.length > 0 &&
      ((formula.type === 'MIXTURE' && exceeded.length === 0) || formula.type === 'DRAFT')
  );

  function addToFormula(material: Material) {
    formula.materials.push({
      original: material,
      grams: 0
    });
  }

  function hasMaterial(material: Material) {
    for (const m of formula.materials) {
      if (m.original.id === material.id) {
        return true;
      }
    }
    return false;
  }

  function handleMaterialInput(target: HTMLInputElement, material: MaterialSpend) {
    const value = parseFloat(target.value);
    if (value > material.original.grams_available) {
      exceeded.push(material.original.id);
    } else {
      exceeded = exceeded.filter((id) => id !== material.original.id);
    }
  }

  function materialsDisplay() {
    if (searching) {
      const regex = new RegExp(searching, 'i');
      return materials.inventory().filter((m) => (m.name ? regex.test(m.name) : false));
    }
    return materials.inventory();
  }

  /**
   * Concentration of material in total mass including solvent, after dilution
   */
  function concentrationTotal(material: MaterialSpend) {
    const original = material.original;

    if (original.grams_material != null && original.grams_solvent != null) {
      let concentration =
        original.grams_material / (original.grams_material + original.grams_solvent);
      return (material.grams * concentration) / totalMass;
    }

    return material.grams / totalMass;
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
          <th class="w-1/4 border p-2 text-center">Amount (g)</th>
          <th class="w-1/4 border p-2 text-center">Amount (%)</th>
          <th class="w-1/4 border p-2 text-center">Amount (PPT)</th>
          <th class="w-1/4 border p-2 text-center">% total</th>
        </tr>
      </thead>

      <tbody class="tabular-nums">
        <!-- MATERIAL ROWS -->

        {#each formula.materials as material}
          <tr class="relative">
            <!-- ACTIONS -->

            <td class="border p-2 text-center">
              <Button
                size="icon-sm"
                variant="ghost"
                class="hover:text-destructive"
                onclick={() => {
                  formula.materials = formula.materials.filter(
                    (m: MaterialSpend) => m.original.id !== material.original.id
                  );
                }}><X /></Button
              >
            </td>

            <!-- MATERIAL NAME -->

            <td class="border p-2 text-center">
              <p>
                {material.original.name}
              </p>
            </td>

            <!-- MATERIAL AMOUNT (G) -->

            <td class="border p-2 text-center">
              <Input
                class="mx-auto w-20"
                oninput={(e) => {
                  handleMaterialInput(e.target as HTMLInputElement, material);
                }}
                type="number"
                step="1"
                bind:value={material.grams}
              ></Input>

              {#if exceeded.includes(material.original.id) && formula.type === 'MIXTURE'}
                <div class="mt-1 flex items-center justify-center gap-2 text-xs text-destructive">
                  <Info class="h-4 w-4" />
                  <span>Not enough material</span>
                </div>
              {/if}
            </td>

            <!-- MATERIAL % -->

            <td class="border p-2 text-center">
              {#if materialMassAbsolute !== 0}
                {pf.format(concentrationTotal(material))}
              {:else}
                {pf.format(0)}
              {/if}
            </td>

            <!-- PPT -->

            <td class="border p-2 text-center">
              {#if materialMassAbsolute !== 0}
                {(concentrationTotal(material) * 1000).toFixed(0)}
              {:else}
                {pf.format(0)}
              {/if}
            </td>

            <td class="border p-2 text-center">{pf.format(material.grams / totalMass)}</td>
          </tr>
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
              }}><X /></Button
            >
          </td>

          <!-- NAME -->

          <td class="border p-2 text-center"> Solvent </td>

          <!-- AMOUNT G -->

          <td class="border p-2 text-center">
            <Input type="number" step="1" min={0} class="mx-auto w-20" bind:value={formula.solvent}
            ></Input>
            {#if formula.solvent < 0}
              <div class="mt-1 flex items-center justify-center gap-2 text-xs text-destructive">
                <Info class="h-4 w-4" />
                <span>Cannot be negative</span>
              </div>
            {/if}
          </td>

          <!-- AMOUNT % -->

          <td class="border p-2 text-center">
            {#if totalMass > 0}
              {pf.format((totalMass - materialMassDiluted) / totalMass)}
            {:else}
              {pf.format(0)}
            {/if}
          </td>

          <!-- PPT -->

          <td class="border p-2 text-center">
            {#if totalMass > 0}
              {(((totalMass - materialMassDiluted) / totalMass) * 1000).toFixed(0)}
            {:else}
              {pf.format(0)}
            {/if}
          </td>

          <!-- TOTAL -->

          <td class="border p-2 text-center">
            {pf.format(totalMass === 0 ? 0 : formula.solvent / totalMass)}
          </td>
        </tr>

        <!-- TOTAL ROW -->

        <tr class="tabular-nums">
          <!-- ACTION -->
          <td class="border p-2 text-center font-bold">Total</td>

          <!-- MATERIAL -->

          <td class="border p-2 text-center font-bold">
            {formula.materials.length}
            {#if formula.materials.length === 1}
              material
            {:else}
              materials
            {/if}
          </td>

          <!-- AMOUNT (G) -->

          <td class="border p-2 text-center font-bold">
            {gf.format(totalMass)}
          </td>

          <!-- AMOUNT (%) -->

          <td class="border p-2 text-center font-bold">
            {pf.format(concentrationMaterialAbsolute)}
          </td>

          <td class="border p-2 text-center font-bold text-muted-foreground"> 1000 </td>

          <td class="border p-2 text-center font-bold">{pf.format(1)}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div>
    <div>
      <h3 class="pointer-events-none mx-auto text-center text-sm text-muted-foreground">
        Add materials
      </h3>

      <div class="mx-auto my-4 w-5/6">
        <Input type="search" placeholder="Search inventory" class="my-2" bind:value={searching} />

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

                <tr class:text-muted-foreground={hasMaterial(material)} class="relative">
                  <!-- ACTIONS -->

                  <td class="w-1/8 border p-2 text-center">
                    <Button
                      variant="ghost"
                      disabled={hasMaterial(material)}
                      onclick={() => addToFormula(material)}
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
    </div>
  </div>
</div>

<div class="flex w-full justify-center gap-2 p-4">
  <Button variant="destructive" onclick={() => onCancel()}>Cancel</Button>
  <Button disabled={!saveEnabled} onclick={() => onSave(formula)}>Save</Button>
</div>
