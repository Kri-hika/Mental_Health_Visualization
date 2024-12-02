<!-- src/lib/components/MentalHealthViz.svelte -->
<script>
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import DynamicCluster from './Chart/DynamicCluster.svelte';
  import { scrollY, viewport } from '$lib/stores';
  
  export let data;
  let currentView = 'initial';
  let vizComponent;
  
  // Use default dimensions initially
  let width = 1000;
  let height = 800;
  
  onMount(() => {
    if (browser) {
      width = window.innerWidth;
      height = window.innerHeight;
    }
  });
  
  // Story progression states
  const storyStates = [
    {
      id: 'initial',
      title: 'Mental Health in the Workplace',
      description: 'Exploring patterns across 1000 professionals',
      layout: 'gather'
    },
    {
      id: 'occupation',
      title: 'Professional Distribution',
      description: 'How different occupations compare',
      layout: 'byOccupation'
    },
    {
      id: 'conditions',
      title: 'Mental Health Conditions',
      description: '51.5% reported having mental health conditions',
      layout: 'byCondition'
    }
  ];

  let currentStoryIndex = 0;
  
  function handleStoryProgress() {
    currentStoryIndex = (currentStoryIndex + 1) % storyStates.length;
    const newState = storyStates[currentStoryIndex];
    vizComponent.updateLayout(newState.layout);
  }
</script>

<div class="visualization-container">
  <!-- Story overlay -->
  <div class="story-overlay">
    <h2>{storyStates[currentStoryIndex].title}</h2>
    <p>{storyStates[currentStoryIndex].description}</p>
    <button on:click={handleStoryProgress}>
      Continue →
    </button>
  </div>

  <!-- Main visualization -->
  <DynamicCluster
    {data}
    bind:this={vizComponent}
    layout={storyStates[currentStoryIndex].layout}
  />
</div>

<style>
  .visualization-container {
    width: 100%;
    height: 100vh;
    background: var(--color-dark-purple);
    position: relative;
    overflow: hidden;
  }

  .story-overlay {
    position: absolute;
    top: 2rem;
    left: 2rem;
    background: rgba(20, 0, 20, 0.9);
    padding: 1.5rem;
    border-radius: 8px;
    color: var(--color-off-purple);
    max-width: 400px;
    z-index: 100;
  }

  h2 {
    color: var(--color-bright-purple);
    margin-bottom: 1rem;
  }

  button {
    margin-top: 1rem;
    background: var(--color-off-purple);
    color: var(--color-dark-purple);
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  button:hover {
    background: var(--color-bright-purple);
  }
</style>