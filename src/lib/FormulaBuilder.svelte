<script lang="ts">
  import { Checkbox } from '$lib/components/ui/checkbox/index.js';
  import * as Select from './components/ui/select';
  import { Button } from '$lib/components/ui/button';
  import { materials } from '$lib/data/materials.svelte';
  import type { FormulaBuilder, Material, MaterialSpend } from './types';
  import { gf, pf } from './utils';
  import { Info, Plus, X } from '@lucide/svelte';
  import * as DropdownMenu from './components/ui/dropdown-menu/index';
  import { Input } from './components/ui/input';
  import Textarea from './components/Textarea.svelte';

  let exceeded = $state<number[]>([]);
  let searching = $state('');

  let {
    formula = $bindable<FormulaBuilder>({
      name: '',
      type: 'DRAFT',
      materials: [],
      targetGrams: 100,
      useSolvent: true,

      reset() {
        this.name = '';
        this.materials = [];
        this.targetGrams = 100;
        this.type = 'DRAFT';
      }
    }),
    onSave,
    onCancel,
    editing = false
  } = $props<{
    formula?: FormulaBuilder;
    onSave: (formula: FormulaBuilder) => void;
    onCancel: () => void;
    editing?: boolean;
  }>();

  let totalInvalid = $state(false);

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
  let targetMass = $derived(formula.useSolvent ? formula.targetGrams : materialMassAbsolute);

  /**
   * % of material after dilution
   */
  let concentrationMaterialAbsolute = $derived(materialMassDiluted / targetMass);

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
      return (material.grams * concentration) / targetMass;
    }

    return material.grams / targetMass;
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

<h3
  class="pointer-events-none mx-auto mt-12 w-2/3 border-b border-muted-foreground text-sm text-muted-foreground"
>
  Formula
</h3>

<table class="mx-auto my-6 w-2/3 border-collapse md:table-fixed">
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

        <td class="border p-2 text-center">{pf.format(material.grams / targetMass)}</td>
      </tr>
    {/each}

    <!-- SOLVENT ROW -->

    <tr class="text-muted-foreground tabular-nums">
      <!-- ACTION -->

      <td class="border p-2 text-foreground">
        <Checkbox class="mx-auto text-foreground" bind:checked={formula.useSolvent} />
      </td>

      <!-- NAME -->

      <td class="border p-2 text-center"> Solvent </td>

      <!-- AMOUNT (G) -->

      <td class="border p-2 text-center">
        {#if formula.useSolvent}
          {gf.format(formula.targetGrams - materialMassAbsolute)}
        {:else}
          -
        {/if}
      </td>

      <!-- MATERIAL % -->

      <td class="border p-2 text-center">
        {pf.format((targetMass - materialMassDiluted) / targetMass)}
      </td>

      <!-- PPT -->

      <td class="border p-2 text-center">
        {(((targetMass - materialMassDiluted) / targetMass) * 1000).toFixed(0)}
      </td>

      <!-- TOTAL -->

      <td class="border p-2 text-center">
        {pf.format((targetMass - materialMassAbsolute) / targetMass)}
      </td>
    </tr>

    <!-- TOTAL ROW -->

    <tr class="tabular-nums">
      <td class="border p-2 text-center font-bold">Total</td>

      <td class="border p-2 text-center font-bold">
        {formula.materials.length}
        {#if formula.materials.length === 1}
          material
        {:else}
          materials
        {/if}
      </td>

      <td class="border p-2 text-center font-bold">
        {#if formula.useSolvent}
          <Input
            type="number"
            step="1"
            min={materialMassAbsolute}
            class="mx-auto w-20"
            bind:value={formula.targetGrams}
            onbeforeinput={(e) => {
              if (e.data === null || e.data === '.') {
                return;
              }
              const value = parseInt(e.data);
              if (isNaN(value)) {
                e.preventDefault();
                return;
              }
            }}
            oninput={() => {
              if (materialMassAbsolute > formula.targetGrams && formula.useSolvent) {
                totalInvalid = true;
              } else {
                totalInvalid = false;
              }
            }}
          ></Input>
          {#if totalInvalid}
            <div class="mt-1 flex items-center justify-center gap-2 text-xs text-destructive">
              <Info class="h-4 w-4" />
              <span>Total cannot be less than material total</span>
            </div>
          {/if}
        {:else}
          <p>{materialMassAbsolute.toFixed(2)}</p>
        {/if}
      </td>

      <td class="border p-2 text-center font-bold">
        {pf.format(concentrationMaterialAbsolute)}
      </td>

      <td class="border p-2 text-center font-bold text-muted-foreground"> 1000 </td>

      <td class="border p-2 text-center font-bold">{pf.format(1)}</td>
    </tr>
  </tbody>
</table>

<h3
  class="pointer-events-none mx-auto mt-12 w-2/3 border-b border-muted-foreground text-sm text-muted-foreground"
>
  Add materials
</h3>

<div class="mx-auto my-8 w-2/3">
  <Input type="search" placeholder="Search inventory" class="my-2" bind:value={searching} />
  <div class="relative max-h-100 overflow-scroll">
    <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->

    <table class="mx-auto w-full border-collapse border border-red-900 md:table-fixed">
      <thead class="sticky top-0 z-10 border bg-muted p-2">
        <tr>
          <th class="sticky z-10 w-1/4 border bg-muted p-2 text-center">Material</th>
          <th class="sticky z-10 w-1/4 border bg-muted p-2 text-center">Available (g)</th>
          <th class="sticky z-10 w-1/8 border bg-muted p-2 text-center">Add</th>
        </tr>
      </thead>

      <tbody class="tabular-nums">
        {#each materialsDisplay() as material}
          <!-- MATERIAL ROWS -->

          <tr class:text-muted-foreground={hasMaterial(material)} class="relative">
            <td class="w-1/4 border p-2 text-center wrap-anywhere">
              {material.name}
            </td>

            <td class="w-1/4 border p-2 text-center">
              {gf.format(material.grams_available)}
            </td>
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
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>

<div class="flex w-full justify-center gap-2 p-4">
  <Button variant="destructive" onclick={() => onCancel()}>Cancel</Button>
  <Button disabled={!saveEnabled} onclick={() => onSave(formula)}>Save</Button>
</div>
