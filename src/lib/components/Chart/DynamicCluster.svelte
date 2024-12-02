<!-- src/lib/components/Chart/DynamicCluster.svelte -->
<script>
  import { onMount, createEventDispatcher } from 'svelte';
  import { browser } from '$app/environment';
  import * as d3 from 'd3';
  import _ from 'lodash';

  export let data;
  export let layout = 'gather';

  const dispatch = createEventDispatcher();
  let svg;
  let container;
  let simulation;
  let width = 1000;
  let height = 700;

  // Adjusted margins
  $: margin = {
    top: 80,
    right: 200, 
    bottom: 60,
    left: 80
  };

  $: plotWidth = width - margin.left - margin.right;
  $: plotHeight = height - margin.top - margin.bottom;

  // Enhanced color scheme
  const colorScales = {
    occupation: {
      'IT': '#8A4FFF',
      'Healthcare': '#FF6B9C',
      'Finance': '#4FACFF',
      'Engineering': '#43E8D8',
      'Sales': '#9D4EDD',
      'Education': '#FF9E64',
      'Other': '#9BA1FF'
    },
    mentalHealth: {
      'Yes': '#FF69B4',
      'No': '#B8A2CE'
    }
  };

  function initializeSimulation() {
    if (!browser) return;
    
    if (simulation) simulation.stop();
    
    simulation = d3.forceSimulation(data)
      .force('charge', d3.forceManyBody().strength(-30))
      .force('collision', d3.forceCollide().radius(4))
      .alphaDecay(0.1)
      .velocityDecay(0.5)
      .alpha(0.5)
      .on('tick', ticked);
  }

  function updateConnectors() {
    if (!svg || layout !== 'byOccupation') return;

    const connectorGroup = d3.select(svg).select('.connectors');
    connectorGroup.selectAll('*').remove();

    const occupations = [...new Set(data.map(d => d.occupation))];
    
    occupations.forEach(occupation => {
      const points = data.filter(d => d.occupation === occupation);
      
      points.sort((a, b) => a.y - b.y);
      const topPoints = points.slice(0, 3);
      const avgX = d3.mean(topPoints, d => d.x);
      const minY = d3.min(topPoints, d => d.y);

      const labelElement = d3.select(svg).select(`.occupation-label-${occupation}`);
      if (!labelElement.empty()) {
        const labelX = +labelElement.attr('x');
        const labelY = margin.top - 30;

        const path = d3.path();
        path.moveTo(labelX, labelY);
        
        const midY = (labelY + minY) / 2;
        
        path.bezierCurveTo(
          labelX, midY - 20,
          avgX, midY + 20,
          avgX, minY - 10
        );

        connectorGroup.append('path')
          .attr('class', 'connector')
          .attr('d', path.toString())
          .attr('stroke', colorScales.occupation[occupation])
          .attr('stroke-width', 1)
          .attr('fill', 'none')
          .attr('opacity', 0.4);
      }
    });
  }

  export async function updateLayout(newLayout) {
    layout = newLayout;
    if (!simulation) return;

    simulation.stop();
    
    const occupations = [...new Set(data.map(d => d.occupation))];
    const centerX = width / 2;
    const centerY = height / 2;

    // Clear existing elements
    d3.select(svg).select('.labels').selectAll('*').remove();
    d3.select(svg).select('.connectors').selectAll('*').remove();

    switch(layout) {
      case 'gather':
        data.forEach(d => {
          d.x = centerX + (Math.random() - 0.5) * 100;
          d.y = centerY + (Math.random() - 0.5) * 100;
        });
        
        simulation
          .force('x', d3.forceX(centerX).strength(0.2))
          .force('y', d3.forceY(centerY).strength(0.2));
        break;

      case 'byOccupation':
        const occupationScale = d3.scalePoint()
          .domain(occupations)
          .range([margin.left + 50, width - margin.right - 50])
          .padding(0.7);

        data.forEach(d => {
          d.x = occupationScale(d.occupation);
          d.y = centerY + (Math.random() - 0.5) * 50;
        });

        simulation
          .force('x', d3.forceX(d => occupationScale(d.occupation)).strength(0.3))
          .force('y', d3.forceY(d => 
            d.mentalHealth === 'Yes' ? centerY - 50 : centerY + 50
          ).strength(0.2));

        // Add labels
        const labelGroup = d3.select(svg).select('.labels');
        occupations.forEach(occupation => {
          const group = data.filter(d => d.occupation === occupation);
          const withCondition = group.filter(d => d.mentalHealth === 'Yes').length;
          const percentage = Math.round((withCondition / group.length) * 100);

          labelGroup.append('text')
            .attr('class', `occupation-label occupation-label-${occupation}`)
            .attr('x', occupationScale(occupation))
            .attr('y', margin.top - 30)
            .attr('text-anchor', 'middle')
            .text(occupation);

          labelGroup.append('text')
            .attr('class', 'percentage-label')
            .attr('x', occupationScale(occupation))
            .attr('y', margin.top - 10)
            .attr('text-anchor', 'middle')
            .text(`${percentage}% with condition`);
        });
        break;

      case 'byCondition':
        data.forEach(d => {
          d.x = d.mentalHealth === 'Yes' ? 
            margin.left + plotWidth * 0.3 :
            margin.left + plotWidth * 0.7;
          d.y = centerY + (Math.random() - 0.5) * 100;
        });

        simulation
          .force('x', d3.forceX(d => 
            d.mentalHealth === 'Yes' ? 
              margin.left + plotWidth * 0.3 : 
              margin.left + plotWidth * 0.7
          ).strength(0.3))
          .force('y', d3.forceY(centerY).strength(0.2));
        break;
    }

    simulation.alpha(0.3).restart();

    return new Promise(resolve => {
      let iterations = 0;
      simulation.on('tick', () => {
        iterations++;
        if (iterations > 30) {
          simulation.stop();
          updateConnectors();
          resolve();
        }
        ticked();
      });
    });
  }

  function ticked() {
    if (!svg) return;

    const circles = d3.select(svg)
      .select('.plot')
      .selectAll('circle')
      .data(data);

    circles.join('circle')
      .attr('cx', d => Math.max(margin.left, Math.min(width - margin.right, d.x)))
      .attr('cy', d => Math.max(margin.top, Math.min(height - margin.bottom, d.y)))
      .attr('r', 3)
      .attr('fill', d => 
        layout === 'byOccupation' ? 
          colorScales.occupation[d.occupation] : 
          colorScales.mentalHealth[d.mentalHealth]
      )
      .attr('opacity', d => d.mentalHealth === 'Yes' ? 0.8 : 0.5)
      .on('mouseover', (event, d) => {
        d3.select(event.target)
          .attr('r', 5)
          .attr('opacity', 1);
        dispatch('hover', { node: d });
      })
      .on('mouseout', (event, d) => {
        d3.select(event.target)
          .attr('r', 3)
          .attr('opacity', d.mentalHealth === 'Yes' ? 0.8 : 0.5);
        dispatch('hover', { node: null });
      });
  }

  onMount(() => {
    const updateDimensions = () => {
      const rect = container.getBoundingClientRect();
      width = rect.width || 1000;
      height = rect.height || 700;
      if (simulation) updateLayout(layout);
    };

    updateDimensions();
    initializeSimulation();
    updateLayout(layout);
    
    const resizeObserver = new ResizeObserver(updateDimensions);
    resizeObserver.observe(container);
    
    return () => {
      resizeObserver.disconnect();
      if (simulation) simulation.stop();
    };
  });
</script>

<div class="visualization-container" bind:this={container}>
  <div class="story-panel">
    <slot name="story-content"></slot>
  </div>

  <svg bind:this={svg} {width} {height}>
    <g class="connectors" />
    <g class="plot" transform="translate({margin.left}, {margin.top})" />
    <g class="labels" />
  </svg>

  {#if layout !== 'gather'}
    <div class="legend">
      <div class="legend-header">
        {layout === 'byOccupation' ? 'Occupation Types' : 'Mental Health Status'}
      </div>
      {#if layout === 'byCondition'}
        {#each Object.entries(colorScales.mentalHealth) as [status, color]}
          <div class="legend-item">
            <span class="legend-swatch" style="background-color: {color}"></span>
            <span class="legend-label">{status}</span>
          </div>
        {/each}
      {:else}
        {#each Object.entries(colorScales.occupation) as [occupation, color]}
          <div class="legend-item">
            <span class="legend-swatch" style="background-color: {color}"></span>
            <span class="legend-label">{occupation}</span>
          </div>
        {/each}
      {/if}
    </div>
  {/if}
</div>

<style>
  .visualization-container {
    width: 100%;
    height: 100%;
    position: relative;
    background: var(--color-dark-purple);
  }

  .story-panel {
    position: absolute;
    top: 50%;
    left: 20px;
    transform: translateY(-50%);
    background: rgba(20, 0, 20, 0.85);
    padding: 1.5rem;
    border-radius: 8px;
    backdrop-filter: blur(8px);
    max-width: 280px;
    z-index: 10;
  }

  .legend {
    position: absolute;
    top: 20px;
    right: 20px;
    background: rgba(20, 0, 20, 0.85);
    padding: 1rem;
    border-radius: 6px;
    backdrop-filter: blur(8px);
  }

  .legend-header {
    color: var(--color-bright-purple);
    font-size: 0.875rem;
    font-weight: 500;
    margin-bottom: 0.75rem;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.375rem;
  }

  .legend-swatch {
    width: 8px;
    height: 8px;
    border-radius: 2px;
  }

  .legend-label {
    color: var(--color-off-purple);
    font-size: 0.75rem;
  }

  :global(.occupation-label) {
    fill: var(--color-bright-purple);
    font-size: 0.875rem;
    font-weight: 500;
  }

  :global(.percentage-label) {
    fill: var(--color-off-purple);
    font-size: 0.75rem;
  }

  :global(.condition-label) {
    fill: var(--color-bright-purple);
    font-size: 0.875rem;
    font-weight: 500;
  }
</style>