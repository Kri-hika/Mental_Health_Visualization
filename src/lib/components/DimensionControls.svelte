<!-- src/lib/components/DimensionControls.svelte -->
<script>
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();
  
  export let dimension = 'worklife';
  
  const dimensions = [
    {
      id: 'clusters',
      label: 'Mental Health Tribes',
      icon: '🎯',
      description: 'Explore similar lifestyle and wellbeing patterns'
    },
    {
      id: 'worklife',
      label: 'Work-Life Balance',
      icon: '⚖️',
      description: 'View balance between work, sleep, and activities'
    },
    {
      id: 'stress',
      label: 'Stress Levels',
      icon: '🌊',
      description: 'Explore stress patterns and contributors'
    },
    {
      id: 'treatment',
      label: 'Treatment Access',
      icon: '💊',
      description: 'Compare treatment seeking behaviors'
    }
  ];

  function handleDimensionChange(newDimension) {
    // Add transition class before changing dimension
    document.querySelector('.dynamic-tribe-viz')?.classList.add('transitioning');
    
    setTimeout(() => {
      dimension = newDimension;
      dispatch('change', newDimension);
      
      // Remove transition class after animation
      setTimeout(() => {
        document.querySelector('.dynamic-tribe-viz')?.classList.remove('transitioning');
      }, 500);
    }, 100);
  }
</script>

<div class="dimension-controls">
  {#each dimensions as dim}
    <button
      class="dimension-button"
      class:active={dimension === dim.id}
      on:click={() => handleDimensionChange(dim.id)}
    >
      <span class="icon">{dim.icon}</span>
      <div class="content">
        <span class="label">{dim.label}</span>
        <span class="description">{dim.description}</span>
      </div>
    </button>
  {/each}
</div>

<style>
  .dimension-controls {
    position: absolute;
    top: 20px;
    left: 20px;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    background: rgba(20, 0, 40, 0.85);
    padding: 1rem;
    border-radius: 12px;
    backdrop-filter: blur(8px);
    z-index: 100;
    transition: opacity 0.3s ease;
  }

  /* When parent is transitioning, fade controls */
  :global(.transitioning) .dimension-controls {
    opacity: 0.5;
    pointer-events: none;
  }

  .dimension-button {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    background: transparent;
    border: 1px solid rgba(157, 78, 221, 0.2);
    padding: 0.75rem;
    border-radius: 8px;
    color: var(--color-off-purple);
    cursor: pointer;
    transition: all 0.2s ease;
    width: 100%;
    text-align: left;
  }

  .dimension-button:hover {
    background: rgba(157, 78, 221, 0.1);
    border-color: var(--color-bright-purple);
    transform: translateX(2px);
  }

  .dimension-button.active {
    background: rgba(157, 78, 221, 0.2);
    border-color: var(--color-bright-purple);
  }

  .icon {
    font-size: 1.25rem;
  }

  .content {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .label {
    color: var(--color-bright-purple);
    font-size: 0.875rem;
    font-weight: 500;
  }

  .description {
    font-size: 0.75rem;
    opacity: 0.8;
  }

  /* Animation enhancements */
  .dimension-button {
    position: relative;
    overflow: hidden;
  }

  .dimension-button::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle at center, 
      var(--color-bright-purple) 0%,
      transparent 70%);
    opacity: 0;
    transition: opacity 0.3s ease;
    pointer-events: none;
  }

  .dimension-button:active::after {
    opacity: 0.1;
  }

  .dimension-button.active::after {
    opacity: 0.05;
  }

  /* Responsive adjustments */
  @media (max-width: 768px) {
    .dimension-controls {
      top: auto;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      flex-direction: row;
      max-width: calc(100% - 40px);
      overflow-x: auto;
      padding: 0.75rem;
    }

    .dimension-button {
      flex: 0 0 auto;
      width: auto;
      min-width: 140px;
    }

    .description {
      display: none;
    }
  }
</style>