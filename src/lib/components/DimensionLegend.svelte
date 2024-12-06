<!-- src/lib/components/DimensionLegend.svelte -->
<script>
  export let dimension;

  const legendData = {
    worklife: [
      { label: 'Balanced', color: '#43E8D8' },
      { label: 'Moderate', color: '#9D4EDD' },
      { label: 'Strained', color: '#FF6B9C' }
    ],
    stress: [
      { label: 'Low Stress', color: '#43E8D8' },
      { label: 'Medium Stress', color: '#9D4EDD' },
      { label: 'High Stress', color: '#FF6B9C' }
    ],
    treatment: [
      { label: 'No Condition', color: '#4FACFF' },
      { label: 'Has Condition', color: '#FF6B9C' },
      { label: 'Seeking Help', color: '#43E8D8' }
    ]
  };
</script>

<div class="legend">
  <h4>Legend</h4>
  <div class="legend-items">
    {#each legendData[dimension] || [] as item}
      <div class="legend-item">
        <span class="color-dot" style="background-color: {item.color}"></span>
        <span class="label">{item.label}</span>
      </div>
    {/each}
  </div>
</div>

<style>
  .legend {
    position: absolute;
    bottom: 20px;
    left: 20px;
    background: rgba(20, 0, 40, 0.85);
    padding: 1rem;
    border-radius: 8px;
    backdrop-filter: blur(8px);
  }

  h4 {
    color: var(--color-bright-purple);
    font-size: 0.875rem;
    margin-bottom: 0.75rem;
  }

  .legend-items {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .color-dot {
    width: 8px;
    height: 8px;
    border-radius: 2px;
  }

  .label {
    font-size: 0.75rem;
    color: var(--color-off-purple);
  }
</style>
