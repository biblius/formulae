<script lang="ts">
  import { Badge } from '$lib/components/ui/badge';
  import { materialType } from './materials.svelte';
  import { ChevronDown, ChevronLeft, ChevronRight, ExternalLink, Link } from '@lucide/svelte';

  import type { MaterialAbstract, Material } from './types';
  import { df, gf } from './utils';
  import { openUrl } from '@tauri-apps/plugin-opener';
  import Button from './components/ui/button/button.svelte';

  let {
    index,
    material,
    inventory,
    expanded = $bindable()
  }: {
    index: number;
    material: MaterialAbstract;
    inventory: Material[];
    expanded: number[];
  } = $props();

  function toggleExpand() {
    if (expanded.includes(material.id)) {
      expanded = expanded.filter((id) => id !== material.id);
    } else {
      expanded.push(material.id);
    }
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="m-1 p-1" class:bg-secondary={index % 2 !== 0}>
  <div
    class="flex w-full cursor-pointer items-center gap-2"
    class:border-b={expanded.includes(material.id)}
    onclick={toggleExpand}
  >
    <h3 class="max-w-80 min-w-50 flex-1 p-2">
      {material.name}
    </h3>

    <Badge variant={index % 2 !== 0 ? 'default' : 'secondary'}>{materialType(material.type)}</Badge>

    <div class="w-full"></div>

    {#each material.tags as tag}
      <Badge
        class="rounded-md text-xs opacity-75"
        style={tag.color ? `background:${tag.color}` : undefined}
      >
        {tag.value}
      </Badge>
    {/each}

    <div class="justify-self-end px-4">
      {#if expanded.includes(material.id)}
        <ChevronDown size={14} />
      {:else}
        <ChevronRight size={14} />
      {/if}
    </div>
  </div>

  {#if expanded.includes(material.id)}
    <div class="space-y-2 px-2 py-3 text-sm">
      <p class="text-muted-foreground">
        {material.description}
      </p>

      <div class="space-y-2 pt-2">
        {#if inventory.length === 0}
          <div class="text-sm text-muted-foreground italic">No inventory available</div>
        {:else}
          <div class="grid grid-cols-9 items-center space-y-2">
            <h4 class="py-1 text-xs text-muted-foreground">Name</h4>
            <h4 class="py-1 text-xs text-muted-foreground">Type</h4>
            <h4 class="py-1 text-xs text-muted-foreground">Manufacturer</h4>
            <h4 class="py-1 text-xs text-muted-foreground">Batch</h4>
            <h4 class="py-1 text-xs text-muted-foreground">Available</h4>
            <h4 class="py-1 text-xs text-muted-foreground">Initial</h4>
            <h4 class="py-1 text-xs text-muted-foreground">Predilution</h4>
            <h4 class="py-1 text-xs text-muted-foreground">Link</h4>
            <h4 class="py-1 text-xs text-muted-foreground">Created</h4>
            {#each inventory as inv}
              <div class="font-medium">
                {inv.name ?? material.name}
              </div>

              <div class="font-medium">
                {inv.type}
              </div>

              <div class="font-medium">
                {inv.manufacturer ?? '-'}
              </div>

              <div class="font-mono text-xs font-medium">
                {inv.batch_id ?? '-'}
              </div>

              <div class="font-medium">
                {gf.format(inv.grams_available)}
              </div>

              <div class="font-medium">
                {gf.format(inv.grams_initial)}
              </div>

              <div class="font-mono text-sm">
                {inv.predilution ?? '-'}
              </div>

              <!-- svelte-ignore a11y_consider_explicit_label -->
              {#if inv.link != null}
                <Button
                  size="icon-sm"
                  variant="link"
                  title={inv.link}
                  onclick={() => openUrl(inv.link!!)}
                >
                  <ExternalLink />
                </Button>
              {:else}
                <div class="font-mono text-sm">-</div>
              {/if}

              <div class="font-mono text-sm">
                {df.format(new Date(inv.created_at))}
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>
