<!-- src/lib/components/Chart/ScatterPlot.svelte -->
<script>
  import { onMount } from 'svelte';
  import { scaleLinear } from 'd3-scale';
  import { viewport } from '$lib/stores';
  
  export let data;
  
  let width = $viewport.width;
  let height = $viewport.height;
  
  // Define margins
  const margin = { top: 40, right: 40, bottom: 60, left: 60 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  
  // Create scales
  $: xScale = scaleLinear()
    .domain([0, Math.max(...data.map(d => d.Work_Hours))])
    .range([0, plotWidth]);
    
  $: yScale = scaleLinear()
    .domain([0, Math.max(...data.map(d => d.Sleep_Hours))])
    .range([plotHeight, 0]);
</script>

<svg {width} {height}>
  <g transform="translate({margin.left}, {margin.top})">
    <!-- Axes -->
    <g class="x-axis" transform="translate(0, {plotHeight})">
      <line x1={0} y1={0} x2={plotWidth} y2={0} stroke="var(--color-off-purple)" />
      <text 
        x={plotWidth/2} 
        y={40} 
        text-anchor="middle"
        fill="var(--color-off-purple)"
      >
        Work Hours per Week
      </text>
    </g>
    
    <g class="y-axis">
      <line x1={0} y1={0} x2={0} y2={plotHeight} stroke="var(--color-off-purple)" />
      <text 
        transform="rotate(-90)" 
        x={-plotHeight/2} 
        y={-40} 
        text-anchor="middle"
        fill="var(--color-off-purple)"
      >
        Sleep Hours per Day
      </text>
    </g>
    
    <!-- Data points -->
    {#each data as point}
      <circle
        cx={xScale(point.Work_Hours)}
        cy={yScale(point.Sleep_Hours)}
        r={4}
        class="data-point"
        class:has-condition={point.Mental_Health_Condition === 'Yes'}
      />
    {/each}
  </g>
</svg>

<style>
  svg {
    width: 100%;
    height: 100vh;
    background: var(--color-dark-purple);
  }
  
  .data-point {
    fill: var(--color-off-purple);
    opacity: 0.6;
    transition: all 0.3s ease;
  }
  
  .data-point.has-condition {
    fill: var(--color-bright-purple);
  }
  
  .data-point:hover {
    opacity: 1;
    r: 6;
  }
</style>