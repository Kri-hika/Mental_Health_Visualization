<!-- src/lib/components/TribeVisualization.svelte -->
<script>
  import { onMount } from 'svelte';
  import * as d3 from 'd3';
  import _ from 'lodash';
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();

  export let data;
  export let userData;

  let svg;
  let container;
  let simulation;
  let width = 1000;
  let height = 700;
  let clusters = [];
  let zoomBehavior;

  // Process and enhance data
  function processData() {
    const processedData = data.map(d => ({
      ...d,
      wlbScore: calculateWLBScore(d),
      cluster: determineCluster(d),
      isUser: false,
      x: width / 2 + (Math.random() - 0.5) * 10,
      y: height / 2 + (Math.random() - 0.5) * 10
    }));

    const userDataProcessed = {
      ...userData,
      wlbScore: calculateWLBScore(userData),
      cluster: determineCluster(userData),
      isUser: true,
      x: width / 2,
      y: height / 2
    };

    return [...processedData, userDataProcessed];
  }

  function calculateWLBScore(d) {
    const sleepIdeal = 8;
    const workIdeal = 40;
    const sleepDiff = Math.abs(d.sleepHours - sleepIdeal);
    const workDiff = Math.abs(d.workHours - workIdeal);
    return 1 - ((sleepDiff / 5 + workDiff / 20) / 2);
  }

  function determineCluster(d) {
    const wlbLevel = d.wlbScore > 0.7 ? 'Balanced' : 
                    d.wlbScore > 0.4 ? 'Moderate' : 'Strained';
    const ageGroup = d.age < 30 ? 'Young' :
                    d.age < 50 ? 'Mid' : 'Senior';
    return `${wlbLevel}-${d.stressLevel}-${ageGroup}`;
  }

  function initializeVisualization() {
    if (!svg || !data || !userData) return;

    // Clear existing elements
    d3.select(svg).selectAll('*').remove();

    const processedData = processData();
    clusters = _.groupBy(processedData, 'cluster');

    // Create main group for zooming
    const g = d3.select(svg)
      .append('g')
      .attr('class', 'viz-group');

    // Initialize zoom behavior
    zoomBehavior = d3.zoom()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    d3.select(svg).call(zoomBehavior);

    // Calculate cluster centers in a spiral layout
    const clusterCenters = {};
    const numClusters = Object.keys(clusters).length;
    const a = 10; // spiral parameter
    const b = 2; // spiral parameter

    Object.keys(clusters).forEach((clusterName, i) => {
      const angle = (i * 2 * Math.PI) / numClusters;
      const radius = a + b * angle;
      clusterCenters[clusterName] = {
        x: width/2 + radius * Math.cos(angle) * 50,
        y: height/2 + radius * Math.sin(angle) * 50
      };
    });

    // Create force simulation
    simulation = d3.forceSimulation(processedData)
      .force('center', d3.forceCenter(width/2, height/2))
      .force('charge', d3.forceManyBody().strength(d => d.isUser ? -100 : -30))
      .force('collision', d3.forceCollide().radius(d => d.isUser ? 15 : 5))
      .force('cluster', alpha => {
        processedData.forEach(d => {
          const center = clusterCenters[d.cluster];
          const k = alpha * 1;
          d.vx -= (d.x - center.x) * k;
          d.vy -= (d.y - center.y) * k;
        });
      })
      .on('tick', () => ticked(g));

    // Create gradient definitions
    const defs = g.append('defs');
    createGradients(defs);

    // Add cluster backgrounds
    g.append('g')
      .attr('class', 'cluster-backgrounds')
      .selectAll('circle')
      .data(Object.entries(clusterCenters))
      .join('circle')
      .attr('cx', d => d[1].x)
      .attr('cy', d => d[1].y)
      .attr('r', 60)
      .attr('fill', (d, i) => `url(#cluster-gradient-${i})`)
      .attr('opacity', 0.1);

    // Add nodes
    const nodes = g.append('g')
      .attr('class', 'nodes')
      .selectAll('circle')
      .data(processedData)
      .join('circle')
      .attr('r', d => d.isUser ? 8 : 4)
      .attr('fill', d => getNodeColor(d))
      .attr('stroke', d => d.isUser ? '#FFD700' : 'none')
      .attr('stroke-width', d => d.isUser ? 2 : 0)
      .attr('opacity', d => d.isUser ? 1 : 0.6);

    // Add cluster labels
    g.append('g')
      .attr('class', 'labels')
      .selectAll('text')
      .data(Object.entries(clusterCenters))
      .join('text')
      .attr('x', d => d[1].x)
      .attr('y', d => d[1].y - 80)
      .text(d => formatClusterLabel(d[0]))
      .attr('text-anchor', 'middle')
      .attr('class', 'cluster-label')
      .style('opacity', 0);

    // Initial animation sequence
    startCinematicSequence(processedData, g);
  }

  function createGradients(defs) {
    const gradients = [
      ['#4FACFF', '#43E8D8'], // Balanced
      ['#9D4EDD', '#FF9E64'], // Moderate
      ['#FF6B9C', '#FF4646']  // Strained
    ];

    gradients.forEach((colors, i) => {
      const gradient = defs.append('radialGradient')
        .attr('id', `cluster-gradient-${i}`)
        .attr('cx', '50%')
        .attr('cy', '50%')
        .attr('r', '50%');

      gradient.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', colors[0])
        .attr('stop-opacity', 0.2);

      gradient.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', colors[1])
        .attr('stop-opacity', 0);
    });
  }

  async function startCinematicSequence(processedData, g) {
    const userNode = processedData.find(d => d.isUser);
    const userCluster = clusters[userNode.cluster];
    
    // Initial state - all nodes invisible
    g.selectAll('circle')
      .attr('opacity', 0);

    // 1. Fade in user's node
    await transition(g.selectAll('circle')
      .filter(d => d.isUser)
      .attr('opacity', 1), 1000);

    // 2. Zoom to user's cluster
    await zoomToNode(userNode, 2);

    // 3. Fade in cluster members
    await transition(g.selectAll('circle')
      .filter(d => d.cluster === userNode.cluster)
      .attr('opacity', d => d.isUser ? 1 : 0.6), 1000);

    // 4. Show cluster label
    await transition(g.selectAll('.cluster-label')
      .filter(d => d[0] === userNode.cluster)
      .style('opacity', 1), 1000);

    // 5. Gradually zoom out
    await zoomToNode(userNode, 1, 2000);

    // 6. Fade in all other nodes and labels
    await Promise.all([
      transition(g.selectAll('circle')
        .filter(d => d.cluster !== userNode.cluster)
        .attr('opacity', 0.4), 1500),
      transition(g.selectAll('.cluster-label')
        .style('opacity', 0.8), 1500)
    ]);
  }

  function transition(selection, duration) {
    return new Promise(resolve => {
      selection.transition()
        .duration(duration)
        .on('end', resolve);
    });
  }

  function zoomToNode(node, scale = 2, duration = 1500) {
    return new Promise(resolve => {
      d3.select(svg)
        .transition()
        .duration(duration)
        .call(zoomBehavior.transform,
          d3.zoomIdentity
            .translate(width/2, height/2)
            .scale(scale)
            .translate(-node.x, -node.y))
        .on('end', resolve);
    });
  }

  function getNodeColor(d) {
    if (d.isUser) return '#FFD700';
    
    const stressColors = {
      'Low': '#4FACFF',
      'Medium': '#9D4EDD',
      'High': '#FF6B9C'
    };

    return stressColors[d.stressLevel];
  }

  function formatClusterLabel(cluster) {
    const [balance, stress, age] = cluster.split('-');
    return `${age}\n${stress} Stress\n${balance}`;
  }

  function ticked(g) {
    g.selectAll('circle')
      .attr('cx', d => d.x)
      .attr('cy', d => d.y);
  }

  onMount(() => {
    if (container) {
      const rect = container.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      initializeVisualization();

      const resizeObserver = new ResizeObserver(() => {
        if (container) {
          const rect = container.getBoundingClientRect();
          width = rect.width;
          height = rect.height;
          initializeVisualization();
        }
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
    <h3>Your Mental Health Tribe</h3>
    <div class="user-stats">
      <div class="stat">
        <span class="label">Age:</span>
        <span class="value">{userData?.age} years</span>
      </div>
      <div class="stat">
        <span class="label">Sleep:</span>
        <span class="value">{userData?.sleepHours} hours</span>
      </div>
      <div class="stat">
        <span class="label">Work:</span>
        <span class="value">{userData?.workHours} hours/week</span>
      </div>
      <div class="stat">
        <span class="label">Stress:</span>
        <span class="value">{userData?.stressLevel}</span>
      </div>
    </div>

    <div class="legend">
      <h4>Stress Levels</h4>
      <div class="legend-item">
        <span class="color-dot" style="background: #4FACFF"></span>
        <span>Low</span>
      </div>
      <div class="legend-item">
        <span class="color-dot" style="background: #9D4EDD"></span>
        <span>Medium</span>
      </div>
      <div class="legend-item">
        <span class="color-dot" style="background: #FF6B9C"></span>
        <span>High</span>
      </div>
    </div>
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
    border-radius: 16px;
    backdrop-filter: blur(8px);
    width: 280px;
    color: var(--color-off-purple);
  }

  h3 {
    color: var(--color-bright-purple);
    font-size: 1.25rem;
    margin-bottom: 1rem;
  }

  .user-stats {
    background: rgba(255, 215, 0, 0.1);
    padding: 1rem;
    border-radius: 8px;
    margin-bottom: 1.5rem;
  }

  .stat {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.5rem;
    font-size: 0.875rem;
  }

  .stat:last-child {
    margin-bottom: 0;
  }

  .value {
    color: var(--color-bright-purple);
    font-weight: 500;
  }

  .legend {
    border-top: 1px solid rgba(139, 92, 246, 0.2);
    padding-top: 1rem;
  }

  h4 {
    color: var(--color-bright-purple);
    font-size: 0.875rem;
    margin-bottom: 0.75rem;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.375rem;
  }

  .color-dot {
    width: 8px;
    height: 8px;
    border-radius: 2px;
  }

  :global(.cluster-label) {
    fill: var(--color-bright-purple);
    font-size: 0.875rem;
    font-weight: 500;
  }
</style>