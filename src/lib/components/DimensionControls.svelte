<!-- src/lib/components/DimensionControls.svelte -->
<script>
  import { createEventDispatcher } from 'svelte';
  
  export let dimension = 'clusters';
  const dispatch = createEventDispatcher();

  const dimensions = [
    {
      id: 'clusters',
      label: 'Mental Health Tribes',
      icon: '🌟'
    },
    {
      id: 'worklife',
      label: 'Work-Life Balance',
      icon: '⚖️'
    },
    {
      id: 'treatment',
      label: 'Treatment Journey',
      icon: '🏥'
    },
    {
      id: 'stress',
      label: 'Stress Patterns',
      icon: '📊'
    }
  ];
</script>

<div class="dimension-controls">
  {#each dimensions as dim}
    <button
      class="dimension-button"
      class:active={dimension === dim.id}
      on:click={() => dispatch('change', dim.id)}
    >
      <span class="icon">{dim.icon}</span>
      <span class="label">{dim.label}</span>
    </button>
  {/each}
</div>

<style>
  .dimension-controls {
    position: absolute;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 1rem;
    z-index: 10;
  }

  .dimension-button {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background: rgba(20, 0, 40, 0.85);
    border: 1px solid rgba(157, 78, 246, 0.2);
    border-radius: 8px;
    color: var(--color-off-purple);
    cursor: pointer;
    transition: all 0.2s ease;
    backdrop-filter: blur(8px);
  }

  .dimension-button:hover {
    border-color: var(--color-bright-purple);
    color: var(--color-bright-purple);
  }

  .dimension-button.active {
    background: var(--color-bright-purple);
    color: var(--color-dark-purple);
    border-color: var(--color-bright-purple);
  }

  .icon {
    font-size: 1.25rem;
  }

  .label {
    font-size: 0.875rem;
    font-weight: 500;
  }

  @media (max-width: 768px) {
    .dimension-controls {
      flex-direction: column;
      left: 20px;
      top: 50%;
      transform: translateY(-50%);
    }

    .dimension-button {
      padding: 0.5rem;
    }

    .label {
      display: none;
    }
  }
</style>