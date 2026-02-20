<script lang="ts">
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
    formula = $bindable({
      name: '',
      type: 'DRAFT',
      materials: [],
      solventGrams: 0,
      targetGrams: 100,

      reset() {
        this.name = '';
        this.materials = [];
        this.solventGrams = 0;
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

  // let formula: FormulaBuilder = $state();

  let materialTotal = $derived(
    formula.materials.reduce((acc: number, material: MaterialSpend) => acc + material.grams, 0)
  );

  let materialDilutionTotal = $derived(
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

  let concentrationDilutionTotal = $derived(materialDilutionTotal / formula.targetGrams);

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
      return materials.inventory.filter((m) => (m.name ? regex.test(m.name) : false));
    }
    return materials.inventory;
  }

  function concentrationAbs(material: MaterialSpend) {
    const original = material.original;

    if (original.grams_material != null && original.grams_solvent != null) {
      let concentration =
        original.grams_material / (original.grams_material + original.grams_solvent);
      return (material.grams * concentration) / formula.targetGrams;
    }

    return material.grams / formula.targetGrams;
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

  <div class="flex w-1/2 justify-center gap-4">
    <!-- ADD MATERIAL -->

    <DropdownMenu.Root>
      <DropdownMenu.Trigger class="relative max-w-lg">
        <Button size="icon-sm" variant="outline">
          <Plus />
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content
        class="min-h-0 overflow-y-scroll not-sm:max-h-80 sm:max-h-56 sm:max-w-60 sm:wrap-anywhere"
      >
        <div class="p-2">
          <Input
            type="search"
            placeholder="Search inventory"
            bind:value={searching}
            onselect={(e) => e.preventDefault()}
          />
        </div>
        {#each materialsDisplay() as material}
          <DropdownMenu.Item
            onclick={() => addToFormula(material)}
            disabled={material.grams_available <= 0 && formula.type === 'MIXTURE'}
            class="flex"
          >
            <p class="flex-1">{material.name}</p>
            <p>
              {gf.format(material.grams_available)}
            </p>
          </DropdownMenu.Item>
        {/each}
      </DropdownMenu.Content>
    </DropdownMenu.Root>

    <Select.Root disabled={editing} type="single" bind:value={formula.type}>
      <Select.Trigger class="w-fit">
        {formula.type === 'MIXTURE' ? 'Mixture' : 'Draft'}
      </Select.Trigger>
      <Select.Content>
        <Select.Item value="MIXTURE">Mixture</Select.Item>
        <Select.Item value="DRAFT">Draft</Select.Item>
      </Select.Content>
    </Select.Root>

    <div class="flex items-center">
      <p class=" w-fit pr-2 text-center text-xs">Total (g)</p>
      <Input type="number" step="1" class="w-20" bind:value={formula.targetGrams}></Input>
    </div>

    <div class="flex items-center gap-1 not-sm:w-full not-sm:flex-wrap">
      <Button
        class="not-sm:hidden"
        size="icon-sm"
        variant="ghost"
        onclick={() => {
          formula.targetGrams /= 10;
        }}>/10</Button
      >
      <Button
        class="not-sm:hidden"
        size="icon-sm"
        variant="ghost"
        onclick={() => {
          formula.targetGrams *= 10;
        }}>*10</Button
      >
    </div>
  </div>
</div>

<table class="mx-auto w-2/3 border-collapse md:table-fixed">
  <!-- HEADER ROW -->

  <thead class="p-2">
    <tr>
      <th class="w-1/4 border p-2 text-center">Material</th>
      <th class="w-1/4 border p-2 text-center">Amount</th>
      <th class="w-1/4 border p-2 text-center">% material</th>
      <th class="w-1/4 border p-2 text-center">% material (undiluted)</th>
      <th class="w-1/4 border p-2 text-center">% total</th>
    </tr>
  </thead>

  <tbody>
    <!-- MATERIAL ROWS -->

    {#each formula.materials as material}
      <tr class="relative">
        <td class="border p-2 text-center">
          <div class="flex w-fit items-center justify-start">
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
            <p>
              {material.original.name}
            </p>
          </div>
        </td>
        <td class="border p-2 text-center">
          <Input
            class={exceeded.includes(material.original.id) && formula.type === 'MIXTURE'
              ? 'mx-auto w-20 border-destructive bg-destructive/5 focus-visible:border-destructive focus-visible:ring-destructive'
              : 'mx-auto w-20'}
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

        <!-- % MATERIAL -->

        <td class="border p-2 text-center">
          {#if materialTotal !== 0}
            {pf.format(material.grams / materialTotal)}
          {:else}
            {pf.format(0)}
          {/if}
        </td>

        <!-- % MATERIAL ABSOLUTE -->

        <td class="border p-2 text-center">
          {#if materialTotal !== 0}
            {pf.format(concentrationAbs(material))}
          {:else}
            {pf.format(0)}
          {/if}
        </td>

        <td class="border p-2 text-center">{pf.format(material.grams / formula.targetGrams)}</td>
      </tr>
    {/each}

    <!-- SOLVENT ROW -->

    <tr class="text-muted-foreground">
      <td class="border p-2 text-center">Solvent</td>
      <td class="border p-2 text-center">{gf.format(formula.targetGrams - materialTotal)}</td>
      <td class="border p-2 text-center">-</td>
      <td class="border p-2 text-center">-</td>
      <td class="border p-2 text-center"
        >{pf.format((formula.targetGrams - materialTotal) / formula.targetGrams)}</td
      >
    </tr>

    <!-- TOTAL ROW -->

    <tr>
      <td class="border p-2 text-center font-bold">Total</td>

      <td class="border p-2 text-center font-bold">{gf.format(formula.targetGrams)}</td>

      <td class="border p-2 text-center font-bold"> - </td>

      <td class="border p-2 text-center font-bold">
        {pf.format(concentrationDilutionTotal)}
      </td>

      <td class="border p-2 text-center font-bold">{pf.format(1)}</td>
    </tr>
  </tbody>
</table>

<div class="flex w-full justify-center gap-2 p-4">
  <Button variant="destructive" onclick={() => onCancel()}>Cancel</Button>
  <Button disabled={!saveEnabled} onclick={() => onSave(formula)}>Save</Button>
</div>
