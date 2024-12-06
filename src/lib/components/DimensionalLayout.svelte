<!-- src/lib/components/DimensionalLayout.svelte -->
<script>
  import { onMount, createEventDispatcher } from 'svelte';
  import * as d3 from 'd3';
  
  export let dimension;
  export let data;
  export let width;
  export let height;
  
  const dispatch = createEventDispatcher();
  
  $: dimensionConfig = getDimensionConfig(dimension);
  
  function getDimensionConfig(dim) {
    return {
      worklife: {
        x: d => d.worklifeScore.work,
        y: d => 1 - d.worklifeScore.sleep,
        xLabel: 'Work-Life Balance',
        yLabel: 'Sleep Quality',
        clusters: [
          { name: 'Balanced', x: 0.3, y: 0.3 },
          { name: 'Moderate', x: 0.5, y: 0.5 },
          { name: 'Intense', x: 0.7, y: 0.7 }
        ]
      },
      treatment: {
        x: d => d.treatmentStatus.accessScore,
        y: d => d.stressImpact.total,
        xLabel: 'Treatment Access',
        yLabel: 'Impact Level',
        clusters: [
          { name: 'Untreated', x: 0.2, y: 0.5 },
          { name: 'Seeking', x: 0.5, y: 0.5 },
          { name: 'Treated', x: 0.8, y: 0.5 }
        ]
      }
    }[dim];
  }
  
  onMount(() => {
    updateLayout();
  });
  
  function updateLayout() {
    const config = dimensionConfig;
    
    // Create axes
    const xAxis = d3.axisBottom()
      .scale(d3.scaleLinear([0, 1]).range([0, width]))
      .ticks(5);
      
    const yAxis = d3.axisLeft()
      .scale(d3.scaleLinear([0, 1]).range([height, 0]))
      .ticks(5);
      
    // Add axes with animations
    d3.select('.x-axis')
      .transition()
      .duration(1000)
      .call(xAxis);
      
    d3.select('.y-axis')
      .transition()
      .duration(1000)
      .call(yAxis);
      
    // Update nodes
    const nodes = d3.selectAll('.node')
      .data(data);
      
    nodes.transition()
      .duration(1500)
      .attr('transform', d => {
        const x = config.x(d) * width;
        const y = config.y(d) * height;
        return `translate(${x}, ${y})`;
      });
      
    // Dispatch layout update event
    dispatch('layoutUpdate', {
      dimension,
      nodes: data.map(d => ({
        id: d.id,
        x: config.x(d) * width,
        y: config.y(d) * height
      }))
    });
  }
</script>

<g class="dimensional-layout">
  <g class="axes">
    <g class="x-axis" transform={`translate(0, ${height})`} />
    <g class="y-axis" />
    
    <text class="axis-label x" 
      x={width/2} 
      y={height + 40}
      text-anchor="middle"
    >
      {dimensionConfig.xLabel}
    </text>
    
    <text class="axis-label y"
      transform={`translate(-40, ${height/2}) rotate(-90)`}
      text-anchor="middle"
    >
      {dimensionConfig.yLabel}
    </text>
  </g>
  
  <g class="clusters">
    {#each dimensionConfig.clusters as cluster}
      <g class="cluster-marker"
        transform={`translate(${cluster.x * width}, ${cluster.y * height})`}
      >
        <circle r="40" class="cluster-background" />
        <text class="cluster-label" dy="0.35em" text-anchor="middle">
          {cluster.name}
        </text>
      </g>
    {/each}
  </g>
</g>

<style>
  .axis-label {
    fill: var(--color-off-purple);
    font-size: 12px;
  }
  
  .cluster-background {
    fill: rgba(157, 78, 221, 0.1);
    stroke: var(--color-bright-purple);
    stroke-width: 1;
    stroke-opacity: 0.3;
  }
  
  .cluster-label {
    fill: var(--color-bright-purple);
    font-size: 14px;
    font-weight: 500;
  }
</style>