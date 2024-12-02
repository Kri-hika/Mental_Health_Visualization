<script>
  import { createEventDispatcher } from 'svelte';
  import { scaleLinear } from 'd3-scale';
  import { timer } from '$lib/stores';

  export let type = 'x';
  export let scale;
  export let label = '';
  
  const dispatch = createEventDispatcher();
  
  $: ticks = scale.ticks(5);
  $: transform = type === 'x' 
    ? `translate(0, ${height})`
    : 'translate(0, 0)';
</script>

<g 
  class="axis"
  {transform}
  role="graphics-symbol"
  aria-label={`${type} axis`}
>
  {#each ticks as tick}
    <g 
      class="tick"
      transform={`translate(${type === 'x' ? scale(tick) : 0},
                           ${type === 'y' ? scale(tick) : 0})`}
    >
      <line
        x2={type === 'x' ? 0 : -6}
        y2={type === 'x' ? 6 : 0}
        stroke="var(--color-off-purple)"
      />
      <text
        dx={type === 'x' ? 0 : -9}
        dy={type === 'x' ? 9 : 3}
        text-anchor={type === 'x' ? 'middle' : 'end'}
        fill="var(--color-off-purple)"
      >
        {tick}
      </text>
    </g>
  {/each}
  
  {#if label}
    <text
      class="axis-label"
      transform={type === 'x' 
        ? `translate(${scale.range()[1] / 2}, 40)`
        : `translate(-40, ${scale.range()[0] / 2}) rotate(-90)`}
      text-anchor="middle"
    >
      {label}
    </text>
  {/if}
</g>

<style>
  .axis-label {
    fill: var(--color-off-purple);
    font-size: 12px;
    font-family: var(--sans);
  }
  
  .tick text {
    font-size: 10px;
    font-family: var(--sans);
  }
</style>