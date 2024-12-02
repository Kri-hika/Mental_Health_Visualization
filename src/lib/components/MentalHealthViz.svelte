<!-- src/lib/components/MentalHealthViz.svelte -->
<script>
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import DynamicCluster from './Chart/DynamicCluster.svelte';
  import _ from 'lodash';
  
  export let data;
  let vizComponent;
  let isTransitioning = false;
  let currentStoryIndex = 0;
  
  const storyStates = [
    {
      id: 'gather',
      title: 'Mental Health in Tech',
      description: 'Our dataset includes 1000 tech professionals across different roles. Each point represents an individual, their occupation, and mental health status.',
      layout: 'gather'
    },
    {
      id: 'occupation',
      title: 'Professional Distribution',
      description: 'Breakdown by occupation reveals varying mental health patterns across different roles in the tech industry.',
      layout: 'byOccupation'
    },
    {
      id: 'conditions',
      title: 'Mental Health Distribution',
      description: 'Overall, 51.5% of professionals reported having mental health conditions, with variations across different roles.',
      layout: 'byCondition'
    }
  ];

  $: currentState = storyStates[currentStoryIndex];
  
  async function handleStoryProgress() {
    if (isTransitioning) return;
    isTransitioning = true;

    const nextIndex = (currentStoryIndex + 1) % storyStates.length;
    const nextState = storyStates[nextIndex];

    try {
      await vizComponent.updateLayout(nextState.layout);
      await new Promise(resolve => setTimeout(resolve, 100));
      currentStoryIndex = nextIndex;
    } finally {
      isTransitioning = false;
    }
  }

  onMount(() => {
    if (vizComponent) {
      vizComponent.updateLayout(currentState.layout);
    }
  });
</script>

<div class="viz-wrapper">
  <DynamicCluster
    {data}
    bind:this={vizComponent}
    layout={currentState.layout}
  >
    <div 
      slot="story-content" 
      class="story-content"
      class:transitioning={isTransitioning}
    >
      <h2>{currentState.title}</h2>
      <p>{currentState.description}</p>
      <button 
        on:click={handleStoryProgress}
        disabled={isTransitioning}
        class:transitioning={isTransitioning}
      >
        {isTransitioning ? 'Transitioning...' : 'Continue →'}
      </button>
    </div>
  </DynamicCluster>
</div>

<style>
  .viz-wrapper {
    width: 100%;
    height: 100vh;
    position: relative;
  }

  :global(.story-content) {
    color: var(--color-off-purple);
    max-width: 280px;
    transition: opacity 0.3s ease;
  }

  :global(.story-content.transitioning) {
    opacity: 0.7;
  }

  :global(.story-content h2) {
    color: var(--color-bright-purple);
    font-size: 1.5rem;
    line-height: 1.2;
    margin-bottom: 1rem;
  }

  :global(.story-content p) {
    font-size: 0.9375rem;
    line-height: 1.6;
    margin-bottom: 1.5rem;
    opacity: 0.9;
  }

  :global(.story-content button) {
    background: var(--color-bright-purple);
    color: var(--color-dark-purple);
    border: none;
    padding: 0.625rem 1.25rem;
    border-radius: 4px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  :global(.story-content button:disabled) {
    opacity: 0.7;
    cursor: not-allowed;
  }

  :global(.story-content button:not(:disabled):hover) {
    background: var(--color-off-purple);
    transform: translateX(2px);
  }

  :global(.story-content button.transitioning) {
    cursor: not-allowed;
    opacity: 0.7;
  }
</style>