<!-- src/lib/components/ClusterLabel.svelte -->
<script>
  export let title;
  export let stats;
  export let x = 0;
  export let y = 0;
  export let active = false;
</script>

<g 
  class="cluster-label"
  class:active
  transform="translate({x}, {y})"
>
  <rect
    x="-60"
    y="-30"
    width="120"
    height="60"
    rx="8"
    class="label-bg"
  />
  
  <text y="-12" class="title">
    {title}
  </text>
  
  {#if active && stats}
    <text y="8" class="stats">
      {stats.count} people
    </text>
    <text y="22" class="stats">
      {stats.wellbeing}% wellbeing
    </text>
  {/if}
</g>

<style>
  .cluster-label {
    pointer-events: all;
  }

  .label-bg {
    fill: rgba(20, 0, 40, 0.85);
    stroke: var(--color-bright-purple);
    stroke-width: 1;
    stroke-opacity: 0.3;
    fill-opacity: 0;
    transition: all 0.3s ease;
  }

  .active .label-bg {
    fill-opacity: 0.95;
    stroke-opacity: 1;
  }

  .title {
    fill: var(--color-bright-purple);
    font-size: 12px;
    text-anchor: middle;
    font-weight: 500;
  }

  .stats {
    fill: var(--color-off-purple);
    font-size: 10px;
    text-anchor: middle;
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  .active .stats {
    opacity: 1;
  }
</style>