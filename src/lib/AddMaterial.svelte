<script lang="ts">
  import AddMaterialAbstract from './AddMaterialAbstract.svelte';
  import AddMaterialDilution from './AddMaterialDilution.svelte';
  import AddMaterialInstance from './AddMaterialInstance.svelte';
  import Button from './components/ui/button/button.svelte';
  import type { Material, MaterialAbstract } from './types';

  let {
    material,
    inventory,
    onSubmit
  }: {
    material: MaterialAbstract;
    inventory: Material[];
    onSubmit: () => void;
  } = $props();

  let display: 'instance' | 'dilution' = $state('instance');
</script>

<div class="">
  <h3 class="w-full p-2 text-center text-sm text-muted-foreground">Add to inventory</h3>
  <div class="flex w-full justify-center gap-2">
    <Button
      variant={display === 'instance' ? 'default' : 'outline'}
      onclick={() => (display = 'instance')}>Pure</Button
    >
    <Button
      disabled={inventory.length === 0}
      variant={display === 'dilution' ? 'default' : 'outline'}
      onclick={() => (display = 'dilution')}>Dilution</Button
    >
  </div>
  {#if display === 'instance'}
    <AddMaterialInstance {onSubmit} {material} />
  {:else if display === 'dilution'}
    <AddMaterialDilution {onSubmit} {inventory} />
  {/if}
</div>
