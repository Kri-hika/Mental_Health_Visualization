<script>
  export let items = [];
  export let orientation = 'horizontal';

  $: containerClass = `legend-container ${orientation}`;
</script>

<div class={containerClass}>
  {#each items as item}
    <div class="legend-item">
      <span 
        class="legend-swatch"
        style="background-color: {item.color}"
      />
      <span class="legend-label">{item.label}</span>
    </div>
  {/each}
</div>

<style>
  .legend-container {
    display: flex;
    gap: 1rem;
    font-family: var(--sans);
    font-size: 12px;
    color: var(--color-off-purple);
  }

  .legend-container.vertical {
    flex-direction: column;
    gap: 0.5rem;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .legend-swatch {
    width: 12px;
    height: 12px;
    border-radius: 2px;
  }
</style>