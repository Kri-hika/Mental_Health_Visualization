<!-- src/lib/components/TribeVisualization.svelte -->
<script>
  import { onMount } from 'svelte';
  import * as d3 from 'd3';
  import _ from 'lodash';

  export let data;
  export let userData;

  let svg;
  let container;
  let simulation;
  let width = 1000;
  let height = 700;
  let clusters = [];
  let processedData = [];

  // Constants for clustering
  const CLUSTER_PADDING = 50;
  const CLUSTER_STRENGTH = 0.15;
  const NODE_CHARGE = -30;
  const COLLISION_RADIUS = 5;

  // Lifecycle Score Calculations
  function calculateLifecycleScore(d) {
    // Normalize sleep (ideal range: 7-9 hours)
    const sleepScore = 1 - Math.min(Math.abs(d.sleepHours - 8) / 4, 1);
    
    // Normalize work hours (ideal range: 35-45 hours)
    const workScore = 1 - Math.min(Math.abs(d.workHours - 40) / 20, 1);
    
    // Weight and combine scores
    return (sleepScore * 0.4 + workScore * 0.6);
  }

  function processDataForClustering() {
    // Process the dataset
    const enhancedData = data.map(d => ({
      ...d,
      lifecycleScore: calculateLifecycleScore(d),
      isUser: false,
      radius: 4
    }));

    // Add user data
    const enhancedUserData = {
      ...userData,
      lifecycleScore: calculateLifecycleScore(userData),
      isUser: true,
      radius: 8
    };

    // Group data into clusters
    processedData = [...enhancedData, enhancedUserData];
    clusters = createClusters(processedData);

    return processedData;
  }

  function createClusters(nodes) {
    // Create cluster definitions based on lifecycle scores and stress levels
    const clusterDefinitions = {
      'balanced-low': { x: width * 0.3, y: height * 0.3, label: 'Balanced\nLow Stress' },
      'balanced-medium': { x: width * 0.7, y: height * 0.3, label: 'Balanced\nModerate Stress' },
      'balanced-high': { x: width * 0.5, y: height * 0.2, label: 'Balanced\nHigh Stress' },
      'intense-low': { x: width * 0.3, y: height * 0.7, label: 'Intense\nLow Stress' },
      'intense-medium': { x: width * 0.7, y: height * 0.7, label: 'Intense\nModerate Stress' },
      'intense-high': { x: width * 0.5, y: height * 0.8, label: 'Intense\nHigh Stress' }
    };

    // Assign nodes to clusters
    nodes.forEach(node => {
      const clusterKey = `${node.lifecycleScore > 0.6 ? 'balanced' : 'intense'}-${node.stressLevel.toLowerCase()}`;
      node.cluster = clusterKey;
    });

    return clusterDefinitions;
  }

  function initializeVisualization() {
    if (!svg || !processedData.length) return;

    // Clear previous visualization
    d3.select(svg).selectAll('*').remove();

    // Create main group
    const g = d3.select(svg)
      .append('g')
      .attr('class', 'viz-group');

    // Initialize force simulation
    simulation = d3.forceSimulation(processedData)
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('charge', d3.forceManyBody().strength(NODE_CHARGE))
      .force('collision', d3.forceCollide().radius(d => d.radius + 1))
      .force('cluster', forceCluster())
      .force('x', d3.forceX().strength(CLUSTER_STRENGTH))
      .force('y', d3.forceY().strength(CLUSTER_STRENGTH))
      .on('tick', ticked);

    // Create nodes
    const nodes = g.append('g')
      .attr('class', 'nodes')
      .selectAll('circle')
      .data(processedData)
      .enter()
      .append('circle')
      .attr('r', d => d.radius)
      .attr('fill', d => getNodeColor(d))
      .attr('stroke', d => d.isUser ? '#FFD700' : 'none')
      .attr('stroke-width', d => d.isUser ? 2 : 0)
      .attr('opacity', d => getNodeOpacity(d))
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended));

    // Add cluster labels
    const labels = g.append('g')
      .attr('class', 'labels')
      .selectAll('text')
      .data(Object.entries(clusters))
      .enter()
      .append('text')
      .attr('x', d => d[1].x)
      .attr('y', d => d[1].y)
      .attr('text-anchor', 'middle')
      .attr('class', 'cluster-label')
      .text(d => d[1].label);

    // Add zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.5, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    d3.select(svg).call(zoom);

    // Initial zoom to user's cluster
    const userNode = processedData.find(d => d.isUser);
    if (userNode) {
      const userCluster = clusters[userNode.cluster];
      zoomToPosition(userCluster.x, userCluster.y);
    }
  }

  function forceCluster() {
    return (alpha) => {
      processedData.forEach(d => {
        const cluster = clusters[d.cluster];
        if (cluster) {
          d.vx -= (d.x - cluster.x) * CLUSTER_STRENGTH * alpha;
          d.vy -= (d.y - cluster.y) * CLUSTER_STRENGTH * alpha;
        }
      });
    };
  }

  function getNodeColor(d) {
    if (d.isUser) return '#FFD700';

    const stressColors = {
      'Low': '#4FACFF',
      'Medium': '#9D4EDD',
      'High': '#FF6B9C'
    };

    // Interpolate color based on lifecycle score
    const baseColor = d3.color(stressColors[d.stressLevel]);
    return d3.color(baseColor).brighter(d.lifecycleScore);
  }

  function getNodeOpacity(d) {
    if (d.isUser) return 1;
    return 0.6 + (d.lifecycleScore * 0.4);
  }

  function zoomToPosition(x, y) {
    const zoom = d3.zoom().scaleExtent([0.5, 4]);
    
    d3.select(svg)
      .transition()
      .duration(1500)
      .call(zoom.transform, d3.zoomIdentity
        .translate(width/2, height/2)
        .scale(2)
        .translate(-x, -y))
      .transition()
      .delay(2000)
      .duration(1500)
      .call(zoom.transform, d3.zoomIdentity);
  }

  function ticked() {
    d3.select(svg).selectAll('circle')
      .attr('cx', d => d.x)
      .attr('cy', d => d.y);
  }

  function dragstarted(event) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    event.subject.fx = event.subject.x;
    event.subject.fy = event.subject.y;
  }

  function dragged(event) {
    event.subject.fx = event.x;
    event.subject.fy = event.y;
  }

  function dragended(event) {
    if (!event.active) simulation.alphaTarget(0);
    event.subject.fx = null;
    event.subject.fy = null;
  }

  onMount(() => {
    if (container) {
      const rect = container.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      processDataForClustering();
      initializeVisualization();

      const resizeObserver = new ResizeObserver(() => {
        const rect = container.getBoundingClientRect();
        width = rect.width;
        height = rect.height;
        initializeVisualization();
      });

      resizeObserver.observe(container);

      return () => {
        resizeObserver.disconnect();
        if (simulation) simulation.stop();
      };
    }
  });
</script>

<div class="viz-container" bind:this={container}>
  <svg bind:this={svg} {width} {height}></svg>
  
  <div class="info-panel">
    <h3>Your Mental Health Profile</h3>
    {#if userData}
      <div class="tribe-stats">
        <div class="stat-group">
          <div class="stat-item">
            <span class="stat-label">Age</span>
            <span class="stat-value">{userData.age} years</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Sleep</span>
            <span class="stat-value">{userData.sleepHours} hours</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Work</span>
            <span class="stat-value">{userData.workHours} hrs/week</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Stress</span>
            <span class="stat-value">{userData.stressLevel}</span>
          </div>
        </div>
      </div>

      <div class="tribe-insights">
        <h4>Your Tribe Insights</h4>
        <div class="insight-cards">
          {#if processedData.length}
            {#if userData.lifecycleScore > 0.6}
              <div class="insight-card positive">
                <span class="insight-icon">✨</span>
                <p>You maintain a good work-life balance</p>
              </div>
            {:else}
              <div class="insight-card warning">
                <span class="insight-icon">⚡</span>
                <p>Your schedule is more intense than average</p>
              </div>
            {/if}
          {/if}
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .viz-container {
    width: 100%;
    height: 100vh;
    position: relative;
    background: var(--color-dark-purple);
  }

  svg {
    width: 100%;
    height: 100%;
  }

  .info-panel {
    position: absolute;
    top: 20px;
    right: 20px;
    background: rgba(20, 0, 40, 0.85);
    padding: 1.5rem;
    border-radius: 12px;
    backdrop-filter: blur(8px);
    width: 300px;
    color: var(--color-off-purple);
  }

  h3 {
    color: var(--color-bright-purple);
    font-size: 1.25rem;
    margin-bottom: 1.5rem;
  }

  .tribe-stats {
    background: rgba(139, 92, 246, 0.1);
    padding: 1rem;
    border-radius: 8px;
    margin-bottom: 1.5rem;
  }

  .stat-group {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }

  .stat-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .stat-label {
    font-size: 0.875rem;
    color: var(--color-off-purple);
  }

  .stat-value {
    font-size: 1.125rem;
    color: var(--color-bright-purple);
    font-weight: 500;
  }

  .tribe-insights {
    margin-top: 2rem;
  }

  h4 {
    color: var(--color-bright-purple);
    font-size: 1rem;
    margin-bottom: 1rem;
  }

  .insight-cards {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .insight-card {
    padding: 1rem;
    border-radius: 8px;
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .insight-card.positive {
    background: rgba(67, 232, 216, 0.1);
  }

  .insight-card.warning {
    background: rgba(255, 107, 156, 0.1);
  }

  .insight-icon {
    font-size: 1.25rem;
  }

  .insight-card p {
    font-size: 0.875rem;
    line-height: 1.4;
    margin: 0;
  }

  :global(.cluster-label) {
    fill: var(--color-bright-purple);
    font-size: 0.875rem;
    opacity: 0.8;
    pointer-events: none;
  }

  @media (max-width: 768px) {
    .info-panel {
      width: calc(100% - 2rem);
      max-height: 40vh;
      top: auto;
      bottom: 1rem;
      right: 1rem;
      overflow-y: auto;
    }
  }
</style>