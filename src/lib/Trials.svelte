<script lang="ts">
  import * as Dialog from './components/ui/dialog';
  import * as DropdownMenu from './components/ui/dropdown-menu/index';
  import { Info, Plus, X } from '@lucide/svelte';
  import { insertTrial } from './data/trials.svelte';
  import type { MaterialAbstract, Trial, TrialAdd } from './types';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { RefreshCw } from '@lucide/svelte';
  import Textarea from './components/Textarea.svelte';
  import TrialNote from './TrialNote.svelte';
  import TrialListItem from './TrialListItem.svelte';

  let { trials = $bindable(), materials }: { trials: Trial[]; materials: MaterialAbstract[] } =
    $props();

  let searching = $state('');

  let trialAdd: TrialAdd = $state<TrialAdd>({
    materials: [],

    reset() {
      delete this.name;
      delete this.description;
      this.materials = [];
    }
  });

  let nameValid = $state(false);
  let descriptionValid = $state(false);
  let materialsValid = $state(false);

  let valid = $derived(nameValid && descriptionValid && materialsValid);

  async function createTrial() {
    if (!trialAdd.name) {
      console.warn('invalid name!', trialAdd.name);
      return;
    }

    if (!trialAdd.description) {
      console.warn('invalid description!', trialAdd.description);
      return;
    }

    if (trialAdd.materials.length < 1) {
      console.warn('invalid materials!', trialAdd.materials);
      return;
    }

    await insertTrial(trialAdd);

    trialAdd.reset();
  }

  function materialsDisplay() {
    if (searching) {
      const regex = new RegExp(searching, 'i');
      return materials.filter((m) => (m.name ? regex.test(m.name) : false));
    }
    return materials;
  }

  function addToTrial(id: number) {
    trialAdd.materials.push(id);
    searching = '';
  }

  let adding = $state(false);
</script>

<h2 class="mb-4 flex items-center gap-4 border-b">
  <p class="not-sm:hidden">Trials</p>
  <div class="flex justify-center p-2">
    <Button
      size="icon-sm"
      variant={adding ? 'default' : 'outline'}
      onclick={() => (adding = !adding)}><Plus /></Button
    >
  </div>
</h2>

{#if adding}
  <div class="m-2 flex flex-wrap items-center justify-center gap-4 rounded-md p-2">
    <div class="flex w-full items-center justify-center">
      <div class="w-1/2">
        <Label for="name" class="text-xs">Name</Label>
        <Input
          bind:value={trialAdd.name}
          oninput={() => {
            if (trialAdd.name) {
              nameValid = true;
            }
          }}
          id="name"
          placeholder={`My trial`}
        />
      </div>
    </div>

    <div class="flex w-full items-center justify-center">
      <div class="w-1/2">
        <Label class="text-xs">Description</Label>
        <Textarea
          rows={6}
          oninput={() => {
            if (trialAdd.description) {
              descriptionValid = true;
            }
          }}
          bind:value={trialAdd.description}
          placeholder="123XYZ"
        />
      </div>
    </div>

    <div class="flex flex-wrap items-center justify-center">
      <div class="my-2 flex w-full items-center justify-center border-b py-1">
        <p class="m-2 p-2">Materials</p>

        <DropdownMenu.Root>
          <DropdownMenu.Trigger>
            <Button size="icon-sm" variant="ghost">
              <Plus />
            </Button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content class="max-h-80 min-h-0 max-w-sm overflow-y-scroll wrap-anywhere">
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
                onclick={() => {
                  addToTrial(material.id);
                  materialsValid = true;
                }}
                class="flex"
              >
                <p class="flex-1">{material.name}</p>
              </DropdownMenu.Item>
            {/each}
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      </div>
      {#if trialAdd.materials.length > 0}
        <div class="flex items-center gap-2">
          {#each trialAdd.materials as materialId}
            <div class="flex items-center rounded-md bg-secondary/50 p-2">
              {materials.find((m) => m.id === materialId)!!.name}
              <Button
                size="icon-sm"
                variant="ghost"
                onclick={() => {
                  trialAdd.materials = trialAdd.materials.filter((m) => m !== materialId);
                  materialsValid = trialAdd.materials.length > 0;
                }}
              >
                <X />
              </Button>
            </div>
          {/each}
        </div>
      {/if}
    </div>

    <div class="mx-auto flex w-full justify-center gap-2 py-2">
      <Button class="w-32" type="button" variant="secondary" onclick={() => trialAdd.reset()}
        ><RefreshCw /></Button
      >
      <Button onclick={() => createTrial()} class="w-32" type="submit" disabled={!valid}>Add</Button
      >
    </div>
  </div>
{/if}

<ul>
  {#each trials as _, i}
    <TrialListItem bind:trial={trials[i]} />
  {/each}
</ul>
