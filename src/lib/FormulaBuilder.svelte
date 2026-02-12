<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { Label } from '$lib/components/ui/label';
  import { materials } from '$lib/materials.svelte';
  import type { FormulaBuilder, Material, MaterialSpend } from './types';
  import { gf, pf } from './utils';
  import { Info, Plus, X } from '@lucide/svelte';
  import * as DropdownMenu from './components/ui/dropdown-menu/index';
  import { Input } from './components/ui/input';
  import { insertFormula } from './formulae.svelte';

  let exceeded = $state<number[]>([]);

  let formula: FormulaBuilder = $state({
    name: '',
    materials: [],
    solventGrams: 0,
    targetGrams: 100,
    targetConcentration: 20,

    reset() {
      this.name = '';
      this.materials = [];
      this.solventGrams = 0;
      this.targetGrams = 100;
      this.targetConcentration = 20;
    }
  });

  let gramsMaterial = $derived(
    formula.materials.reduce((acc, material) => acc + material.grams, 0)
  );
  let available = $derived(
    formula.targetGrams * (formula.targetConcentration / 100) - gramsMaterial
  );
  let concentration = $derived(gramsMaterial / formula.targetGrams);

  let saveEnabled = $derived(formula.name && formula.materials.length > 0 && exceeded.length === 0);

  function addToFormula(material: Material) {
    formula.materials.push({
      original: material,
      grams: 0
    });
  }

  async function saveFormula() {
    if (formula.materials.length === 0) {
      return;
    }

    for (const material of formula.materials) {
      if (material.grams > material.original.grams_available) {
        console.error('insufficient material');
        return;
      }
    }

    formula.targetConcentration /= 100;

    await insertFormula(formula);

    formula.reset();
  }

  function handleMaterialInput(target: HTMLInputElement, material: MaterialSpend) {
    const value = parseFloat(target.value);
    if (value > material.original.grams_available) {
      exceeded.push(material.original.id);
    } else {
      exceeded = exceeded.filter((id) => id !== material.original.id);
    }
  }
</script>

<!-- HEADER -->

<div class="mx-4 flex items-center justify-center gap-4 rounded-xl p-2 py-2 not-sm:flex-wrap">
  <!-- NAME -->

  <!-- ADD MATERIAL -->

  <div class="flex items-center gap-4 not-sm:w-full not-sm:flex-wrap">
    <div class="not-sm:w-full">
      <Input class="w-full" bind:value={formula.name} placeholder="Name"></Input>
    </div>

    <Button
      class="not-sm:hidden"
      size="icon-sm"
      variant="ghost"
      onclick={() => {
        formula.targetGrams /= 10;
        for (const material of formula.materials) {
          material.grams /= 10;
        }
      }}>/10</Button
    >
    <Button
      class="not-sm:hidden"
      size="icon-sm"
      variant="ghost"
      onclick={() => {
        formula.targetGrams *= 10;
        for (const material of formula.materials) {
          material.grams *= 10;
        }
      }}>*10</Button
    >
  </div>

  <DropdownMenu.Root>
    <DropdownMenu.Trigger class="max-w-lg">
      <Button size="icon-sm" variant="outline">
        <Plus />
      </Button>
    </DropdownMenu.Trigger>
    <DropdownMenu.Content>
      {#each materials.inventory as material}
        <DropdownMenu.Item
          onclick={() => addToFormula(material)}
          disabled={material.grams_available <= 0}
          class="flex"
        >
          <p class="flex-2">{material.name}</p>
          <p>
            {gf.format(material.grams_available)}
          </p>
        </DropdownMenu.Item>
      {/each}
    </DropdownMenu.Content>
  </DropdownMenu.Root>

  <div class="flex flex-wrap justify-center">
    <p class=" w-full text-center text-xs">Total (g)</p>
    <Input type="number" step="1" class="w-20" bind:value={formula.targetGrams}></Input>
  </div>

  <div>
    <Label class="text-xs">Concentration (%)</Label>
    <Input type="number" step="1" class="w-20" bind:value={formula.targetConcentration}></Input>
  </div>

  <div>
    <p class="text-xs">Available</p>
    <p>{gf.format(available)}</p>
  </div>
</div>

<table class="mx-auto w-2/3 border-collapse sm:table-fixed">
  <!-- HEADER ROW -->

  <thead class="p-2">
    <tr>
      <th class="w-1/4 border p-2 text-center">Material</th>
      <th class="w-1/4 border p-2 text-center">Amount</th>
      <th class="w-1/4 border p-2 text-center">% material</th>
      <th class="w-1/4 border p-2 text-center">% total</th>
    </tr>
  </thead>

  <tbody>
    <!-- MATERIAL ROWS -->

    {#each formula.materials as material}
      <tr class="relative hover:bg-muted/50">
        <td class="border p-2 text-center">
          <div class="flex w-fit items-center justify-start gap-4">
            <Button
              size="icon-sm"
              variant="ghost"
              class="hover:text-destructive"
              onclick={() => {
                formula.materials = formula.materials.filter(
                  (m) => m.original.id !== material.original.id
                );
              }}><X /></Button
            >
            <p>
              {material.original.name}
            </p>
          </div>
        </td>
        <td class="border p-2 text-center">
          <Input
            class={exceeded.includes(material.original.id)
              ? 'mx-auto w-20 border-destructive bg-destructive/5 focus-visible:border-destructive focus-visible:ring-destructive'
              : 'mx-auto w-20'}
            oninput={(e) => {
              handleMaterialInput(e.target as HTMLInputElement, material);
            }}
            type="number"
            step="1"
            bind:value={material.grams}
          ></Input>

          {#if exceeded.includes(material.original.id)}
            <div class="mt-1 flex items-center justify-center gap-2 text-xs text-destructive">
              <Info class="h-4 w-4" />
              <span>Not enough material</span>
            </div>
          {/if}
        </td>

        {#if gramsMaterial !== 0}
          <td class="border p-2 text-center">
            {pf.format(material.grams / gramsMaterial)}
          </td>
        {:else}
          <td class="border p-2 text-center">
            {pf.format(0)}
          </td>
        {/if}

        <td class="border p-2 text-center">{pf.format(material.grams / formula.targetGrams)}</td>
      </tr>
    {/each}

    <!-- SOLVENT ROW -->

    <tr class="text-muted-foreground">
      <td class="border p-2 text-center">Solvent</td>
      <td class="border p-2 text-center">{gf.format(formula.targetGrams - gramsMaterial)}</td>
      <td class="border p-2 text-center">-</td>
      <td class="border p-2 text-center"
        >{pf.format((formula.targetGrams - gramsMaterial) / formula.targetGrams)}</td
      >
    </tr>

    <!-- TOTAL ROW -->

    <tr>
      <td class="border p-2 text-center font-bold">Total</td>
      <td class="border p-2 text-center font-bold">{gf.format(formula.targetGrams)}</td>
      {#if concentration !== formula.targetConcentration / 100}
        <td class="border p-2 text-center font-bold"
          >{pf.format(concentration)}/{pf.format(formula.targetConcentration / 100)}</td
        >
      {:else}
        <td class="border p-2 text-center font-bold"
          >{pf.format(formula.targetConcentration / 100)}
        </td>
      {/if}
      <td class="border p-2 text-center font-bold">{pf.format(1)}</td>
    </tr>
  </tbody>
</table>

<div class="flex w-full justify-center p-4">
  <Button disabled={!saveEnabled} onclick={saveFormula}>Save</Button>
</div>
