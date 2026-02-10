<script lang="ts">
  import AddMaterialAbstract from './AddMaterialAbstract.svelte';
  import AddMaterialDilution from './AddMaterialDilution.svelte';
  import AddMaterialInstance from './AddMaterialInstance.svelte';
  import Button from './components/ui/button/button.svelte';

  let display: 'abstract' | 'instance' | 'dilution' = $state('instance');
</script>

<div class="">
  <div class="col-span-2 flex w-full justify-center">
    <Button
      variant={display === 'abstract' ? 'default' : 'outline'}
      onclick={() => (display = 'abstract')}>Definition</Button
    >
    <Button
      variant={display === 'instance' ? 'default' : 'outline'}
      onclick={() => (display = 'instance')}>Inventory</Button
    >
    <Button
      variant={display === 'dilution' ? 'default' : 'outline'}
      onclick={() => (display = 'dilution')}>Dilution</Button
    >
  </div>
  {#if display === 'abstract'}
    <AddMaterialAbstract />
  {:else if display === 'instance'}
    <AddMaterialInstance />
  {:else if display === 'dilution'}
    <AddMaterialDilution />
  {/if}
</div>
