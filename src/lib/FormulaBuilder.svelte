<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { Label } from '$lib/components/ui/label';
  import { materials } from '$lib/materials.svelte';
  import MaterialList from '$lib/MaterialList.svelte';
  import type { FormulaBuilder, Material } from './types';
  import { gf, pf } from './utils';
  import { ChevronDown, ChevronRight, Plus } from '@lucide/svelte';
  import EditableNumber from './EditableNumber.svelte';
  import * as DropdownMenu from './components/ui/dropdown-menu/index';
  import { Input } from './components/ui/input';
  import { formulae, initFormulae, insertFormula } from './formula.svelte';
  import FormulaList from './FormulaList.svelte';

  let showMaterialList = $state(false);

  let formula: FormulaBuilder = $state({
    name: '',
    materials: [],
    solventGrams: 0,
    targetGrams: 100,
    targetConcentration: 0.2,

    reset() {
      this.materials = [];
      this.solventGrams = 0;
    }
  });

  let gramsMaterial = $derived(
    formula.materials.reduce((acc, material) => acc + material.grams, 0)
  );
  let available = $derived(formula.targetGrams * formula.targetConcentration - gramsMaterial);
  let concentration = $derived(gramsMaterial / formula.targetGrams);

  let saveEnabled = $derived(formula.name && formula.materials.length > 0);

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

    await insertFormula(formula);
  }
</script>

{#await initFormulae() then}
  <div class="m-2 justify-center gap-1 rounded-md p-2">
    <div class="mx-auto flex w-1/2 items-center justify-between gap-6 rounded-xl p-2 py-2">
      <div>
        <Input bind:value={formula.name} placeholder="Formula name"></Input>
      </div>
      <div class="flex items-center gap-4">
        <DropdownMenu.Root>
          <DropdownMenu.Trigger class="max-w-lg">
            <Button size="icon-sm">
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

        <Button
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

      <div>
        <Label class="text-xs">Target total</Label>
        <EditableNumber
          amount={formula.targetGrams}
          onSave={(value) => {
            formula.targetGrams = value;
          }}
          onclickP={() => {
            formula.targetGrams += 1;
          }}
          onclickM={() => {
            formula.targetGrams -= 1;
          }}
          formatter={gf}
        />
      </div>

      <div>
        <Label class="text-xs">Target material</Label>
        <EditableNumber
          amount={formula.targetConcentration}
          onSave={(value) => {
            formula.targetConcentration = value / 100;
          }}
          onclickP={() => {
            formula.targetConcentration += 0.01;
            if (formula.targetConcentration > 1) {
              formula.targetConcentration = 1;
            }
          }}
          onclickM={() => {
            formula.targetConcentration -= 0.01;
            if (formula.targetConcentration < 0) {
              formula.targetConcentration = 0;
            }
          }}
          formatter={pf}
        />
      </div>

      <div>
        <Label class="text-xs">Available</Label>
        <p>{gf.format(available)}</p>
      </div>
    </div>

    <table class="w-full table-fixed">
      <tbody>
        <!-- HEADER ROW -->

        <tr class="p-2">
          <th class="w-1/4 border p-2 text-center">Material</th>
          <th class="w-1/4 border p-2 text-center">Amount</th>
          <th class="w-1/4 border p-2 text-center">% material</th>
          <th class="w-1/4 border p-2 text-center">% total</th>
        </tr>

        <!-- MATERIAL ROWS -->

        {#each formula.materials as material}
          <tr>
            <td class="border p-2 text-center">{material.original.name}</td>
            <td class="flex justify-center border p-2 text-center">
              <EditableNumber
                amount={material.grams}
                onSave={(value) => {
                  material.grams = value;
                }}
                onclickP={() => {
                  material.grams += 0.01;
                }}
                onclickM={() => {
                  material.grams -= 0.01;
                }}
                formatter={gf}
              />
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

            <td class="border p-2 text-center">{pf.format(material.grams / formula.targetGrams)}</td
            >
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
          {#if concentration !== formula.targetConcentration}
            <td class="border p-2 text-center font-bold"
              >{pf.format(concentration)}/{pf.format(formula.targetConcentration)}</td
            >
          {:else}
            <td class="border p-2 text-center font-bold"
              >{pf.format(formula.targetConcentration)}
            </td>
          {/if}
          <td class="border p-2 text-center font-bold">{pf.format(1)}</td>
        </tr>
      </tbody>
    </table>

    <div class="flex w-full justify-center p-4">
      <Button disabled={!saveEnabled} onclick={saveFormula}>Save</Button>
    </div>

    <!-- FORMULA LIST -->

    <FormulaList formulae={formulae.formulae} />
    <div class="my-4">
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
      <h2 onclick={() => (showMaterialList = !showMaterialList)}>
        <div class="flex cursor-pointer items-center border-b">
          {#if showMaterialList}
            <ChevronDown size={14} />
          {:else}
            <ChevronRight size={14} />
          {/if}
          <p>Material overview</p>
        </div>
      </h2>
      {#if showMaterialList}
        <MaterialList materialsAbstract={materials.abstract} materials={materials.inventory} />
      {/if}
    </div>
  </div>
{/await}
