<script>
  import { onMount, createEventDispatcher } from 'svelte';
  import { browser } from '$app/environment';
  import * as d3 from 'd3';

  export let data;
  export let layout = 'gather';

  const dispatch = createEventDispatcher(); // Correctly importing and using createEventDispatcher
  let svg;
  let simulation;
  let width = 1000; // Default width
  let height = 800; // Default height
  let selectedNode = null;

  // Initialize force simulation
  function initializeSimulation() {
    if (!browser) return; // Check for browser environment
    
    simulation = d3.forceSimulation(data)
      .force('charge', d3.forceManyBody().strength(-30))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(5))
      .on('tick', ticked);
  }

  onMount(() => {
    // Set dimensions after mount
    width = window.innerWidth;
    height = window.innerHeight;
    
    initializeSimulation();
    updateLayout(layout);
    
    // Add resize listener
    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      updateLayout(layout);
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      if (simulation) simulation.stop();
    };
  });

  // Layout update function (exposed to parent)
  export function updateLayout(newLayout) {
    layout = newLayout;
    
    switch(layout) {
      case 'gather':
        simulation
          .force('x', d3.forceX(width / 2).strength(0.1))
          .force('y', d3.forceY(height / 2).strength(0.1));
        break;
        
      case 'byOccupation':
        const occupationScale = d3.scalePoint()
          .domain([...new Set(data.map(d => d.occupation))])
          .range([100, width - 100]);
          
        simulation
          .force('x', d3.forceX(d => occupationScale(d.occupation)).strength(0.2))
          .force('y', d3.forceY(height / 2).strength(0.1));
        break;
        
      case 'byCondition':
        simulation
          .force('x', d3.forceX(d => 
            d.mentalHealth === 'Yes' ? width * 0.3 : width * 0.7
          ).strength(0.2))
          .force('y', d3.forceY(height / 2).strength(0.1));
        break;
    }
    
    simulation.alpha(1).restart();
  }

  function ticked() {
    const circles = d3.select(svg)
      .selectAll('circle')
      .data(data);

    circles.join('circle')
      .attr('cx', d => d.x)
      .attr('cy', d => d.y)
      .attr('r', 4)
      .attr('class', d => `data-point ${d.mentalHealth === 'Yes' ? 'has-condition' : ''}`)
      .attr('fill', d => d.mentalHealth === 'Yes' ? '#ff69f2' : '#e0d1e8')
      .attr('opacity', 0.6)
      .on('mouseover', (event, d) => {
        selectedNode = d;
        dispatch('hover', { node: d });
      })
      .on('mouseout', () => {
        selectedNode = null;
        dispatch('hover', { node: null });
      });
  }
</script>

<svg 
  bind:this={svg}
  {width}
  {height}
>
  <g class="plot" />
</svg>

<style>
  svg {
    width: 100%;
    height: 100%;
  }

  :global(.data-point) {
    transition: all 0.3s ease;
    cursor: pointer;
  }

  :global(.data-point:hover) {
    opacity: 1;
    r: 6;
  }
</style>
