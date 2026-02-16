<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Plus } from '@lucide/svelte';

  let {
    container = $bindable(),
    input = $bindable(),
    placeholder = ''
  }: { container: string[]; input: string; placeholder?: string } = $props();
</script>

{#each container as _, i}
  <div class="my-1 grid w-full max-w-lg items-center">
    <Input
      bind:value={container[i]}
      oninput={() => {
        if (container[i].length === 0) {
          container = container.filter((_, j) => j !== i);
        }
      }}
    />
  </div>
{/each}
<div class="flex items-center">
  <Input
    id="link"
    onkeydown={(e) => {
      if (e.key === 'Enter' && input && input.length) {
        container.push(input);
        input = '';
      }
    }}
    bind:value={input}
    {placeholder}
  />
  <Button
    size="icon-sm"
    variant="outline"
    onclick={() => {
      if (input && input.length) {
        container.push(input);
        input = '';
      }
    }}
  >
    <Plus />
  </Button>
</div>
