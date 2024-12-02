<!-- src/lib/components/Chart/Annotations.svelte -->
<script>
  export let annotation;
</script>

<g class="annotation" transform="translate({annotation.position.x}, {annotation.position.y})">
  <path d="M0,0 L30,30" class="annotation-line" />
  <text x="35" y="35" class="annotation-text">{annotation.text}</text>
</g>

<style>
  .annotation-line {
    stroke: var(--color-bright-purple);
    stroke-width: 2;
  }

  .annotation-text {
    fill: var(--color-off-purple);
    font-size: 14px;
  }
</style>