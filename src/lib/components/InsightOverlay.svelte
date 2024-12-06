<!-- src/lib/components/InsightOverlay.svelte -->
<script>
  import { fly, fade } from 'svelte/transition';
  export let insight;
  export let active = false;
  export let position = { x: 0, y: 0 };
</script>

<div 
  class="insight-overlay"
  class:active
  style="transform: translate({position.x}px, {position.y}px)"
>
  {#if active}
    <div class="content" in:fly={{ y: 20, duration: 400 }}>
      <h3>{insight.title}</h3>
      <div class="metric">
        <span class="value">{insight.value}</span>
        <span class="label">{insight.label}</span>
      </div>
      {#if insight.description}
        <p class="description">{insight.description}</p>
      {/if}
    </div>
  {/if}
</div>

<style>
  .insight-overlay {
    position: absolute;
    background: rgba(20, 0, 40, 0.85);
    backdrop-filter: blur(8px);
    border-radius: 12px;
    padding: 1.5rem;
    width: 280px;
    opacity: 0;
    transition: all 0.3s ease;
    pointer-events: none;
  }

  .insight-overlay.active {
    opacity: 1;
    pointer-events: all;
  }

  h3 {
    color: var(--color-bright-purple);
    font-size: 1.125rem;
    margin: 0 0 1rem;
  }

  .metric {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    margin-bottom: 1rem;
  }

  .value {
    font-size: 2rem;
    color: var(--color-bright-purple);
    font-weight: 600;
  }

  .label {
    font-size: 0.875rem;
    color: var(--color-off-purple);
  }

  .description {
    font-size: 0.875rem;
    color: var(--color-off-purple);
    line-height: 1.6;
    margin: 0;
  }
</style>
