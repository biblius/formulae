<script lang="ts">
  import type { FormulaEntry } from './data/formulae.svelte';
  import { gf, pf } from './utils';
  import { Button } from '$lib/components/ui/button';
  import { Input } from './components/ui/input';
  import type { FormulaBuilder, FormulaBuilderEntry } from './types';
  import Self from './FormulaEntryRow.svelte';
  import { ChevronDown, ChevronRight, X } from '@lucide/svelte';
  import InputError from './components/InputError.svelte';

  type Props = {
    formula: FormulaBuilder;
    entry: FormulaEntry;
    level?: number;
    errors: number[];
  };

  let { formula = $bindable(), entry, level = 0, errors = $bindable() }: Props = $props();

  let state = $state({
    expanded: false,
    entryValue:
      formula.materials.find((m) => m.original!.id === entry.id)?.grams?.toString() ?? '0',
    inputError: ''
  });

  let isRoot = $derived(level === 0);
  let canExpand = $derived(entry.entries.length > 0);
</script>

<!-- ROOT MATERIAL -->

<tr class:mt-1={!isRoot && canExpand}>
  <!-- ACTIONS -->

  <td class="border p-2 text-center" class:border={isRoot || canExpand}>
    <div class="flex justify-center">
      {#if isRoot}
        <Button
          size="icon-sm"
          variant="ghost"
          class="hover:text-destructive"
          onclick={() => {
            formula.materials = formula.materials.filter(
              (m: FormulaBuilderEntry) => m.materialId !== entry.id
            );
          }}><X /></Button
        >
      {/if}
      {#if canExpand}
        <Button
          size="icon-sm"
          variant="ghost"
          onclick={() => {
            state.expanded = !state.expanded;
          }}
        >
          {#if state.expanded}
            <ChevronDown />
          {:else}
            <ChevronRight />
          {/if}
        </Button>
      {/if}
    </div>
  </td>

  <!-- MATERIAL NAME -->

  <td class="border p-2 text-center">
    <p>
      {entry.name}
    </p>
  </td>

  <!-- MATERIAL AMOUNT (G) -->

  <td class="border p-2 text-center">
    {#if isRoot}
      <Input
        class="mx-auto w-20"
        bind:value={state.entryValue}
        type="number"
        step="0.1"
        oninput={() => {
          if (!/^\d*[\.]?\d*$/.test(state.entryValue)) {
            state.inputError = 'Not a number';
            errors.push(entry.id);
            return;
          }

          const material = formula.materials.find((m) => m.materialId === entry.id);

          if (!material) {
            state.inputError = 'Material no longer exists';
            errors.push(entry.id);
            return;
          }

          if (state.entryValue == null || state.entryValue.length === 0) {
            material.grams = 0;
            return;
          }

          const value = parseFloat(state.entryValue);

          if (isNaN(value)) {
            state.inputError = 'Not a number';
            errors.push(entry.id);
            return;
          }

          if (value < 0) {
            state.inputError = 'Cannot be negative';
            errors.push(entry.id);
            return;
          }

          material.grams = value;
          state.inputError = '';
          errors = errors.filter((id) => entry.id !== id);
        }}
      ></Input>
      {#if state.inputError}
        <InputError message={state.inputError} />
      {/if}
    {:else}
      {gf.format(entry.totalMass)}
    {/if}
  </td>

  <!-- MATERIAL G -->

  <td class="border p-2 text-center">
    <div class="mx-auto flex w-1/2 flex-wrap items-center justify-center">
      <p>
        {gf.format(entry.materialMass)}
      </p>
      {#if entry.solventMass && entry.solventMass > 0}
        <p class="w-full border-t text-muted-foreground">
          {gf.format(entry.solventMass!!)}
        </p>
      {/if}
    </div>
  </td>

  <!-- MATERIAL % -->

  <td class="border p-2 text-center">
    {pf.format(entry.materialPercent ?? 0)}
  </td>

  <!-- PPT -->

  <td class="border p-2 text-center">
    {entry.materialPPT}
  </td>
</tr>

<!-- CHILD MATERIALS -->

{#if canExpand && state.expanded}
  {#each entry.entries as childEntry}
    <Self {errors} {formula} entry={childEntry} level={level + 1} />
  {/each}
{/if}
