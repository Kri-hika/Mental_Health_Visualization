<!-- src/lib/components/DynamicTribeViz.svelte -->
<script>
  import { onMount, createEventDispatcher } from 'svelte';
  import { fade, fly } from 'svelte/transition';
  import * as d3 from 'd3';
  import _ from 'lodash';
  import PersonIcon from './icons/PersonIcon.svelte';
  import DimensionControls from './DimensionControls.svelte';
  import InsightPanel from './InsightPanel.svelte';

  export let data;
  export let userData;
  export let treatmentData;

  const dispatch = createEventDispatcher();
  let svg;
  let container;
  let simulation;
  let width = 1000;
  let height = 700;
  let currentDimension = 'clusters'; // clusters, worklife, treatment, stress
  let hoveredNode = null;
  let selectedNode = null;
  let processedData = [];

  // Position configurations for different views
  const VIEW_CONFIGS = {
    clusters: {
      positions: {
        'Balanced-Low': { x: 0.25, y: 0.25 },
        'Balanced-Medium': { x: 0.5, y: 0.25 },
        'Balanced-High': { x: 0.75, y: 0.25 },
        'Intense-Low': { x: 0.25, y: 0.75 },
        'Intense-Medium': { x: 0.5, y: 0.75 },
        'Intense-High': { x: 0.75, y: 0.75 }
      },
      forces: {
        charge: -50,
        collision: 20,
        centerStrength: 0.1
      }
    },
    worklife: {
      forces: {
        charge: -30,
        collision: 15,
        xStrength: 0.2,
        yStrength: 0.2
      }
    },
    treatment: {
      forces: {
        charge: -40,
        collision: 18,
        xStrength: 0.3,
        yStrength: 0.2
      }
    },
    stress: {
      forces: {
        charge: -45,
        collision: 20,
        xStrength: 0.25,
        yStrength: 0.25
      }
    }
  };

  // Color scheme
  const COLORS = {
    TREATMENT: {
      IDENTIFIED: '#FF6B9C',
      UNTREATED: '#4FACFF',
      TREATED: '#43E8D8'
    },
    STRESS: {
      LOW: '#43E8D8',
      MEDIUM: '#9D4EDD',
      HIGH: '#FF6B9C'
    },
    WORKLIFE: {
      BALANCED: '#43E8D8',
      MODERATE: '#9D4EDD',
      INTENSE: '#FF6B9C'
    }
  };

  function processData() {
    const enhanced = data.map(d => ({
      ...d,
      id: d.User_ID,
      worklifeScore: calculateWorklifeScore(d),
      treatmentStatus: determineTreatmentStatus(d),
      stressImpact: calculateStressImpact(d),
      cluster: determineCluster(d),
      position: { x: width/2, y: height/2 },
      velocity: { x: 0, y: 0 },
      particles: generateParticles()
    }));

    const enhancedUser = {
      ...userData,
      id: 'user',
      isUser: true,
      worklifeScore: calculateWorklifeScore(userData),
      treatmentStatus: determineTreatmentStatus(userData),
      stressImpact: calculateStressImpact(userData),
      cluster: determineCluster(userData),
      position: { x: width/2, y: height/2 },
      velocity: { x: 0, y: 0 },
      particles: generateParticles(true)
    };

    processedData = [...enhanced, enhancedUser];
    return processedData;
  }

  function calculateWorklifeScore(d) {
    const sleepScore = 1 - Math.min(Math.abs(d.sleepHours - 8) / 4, 1);
    const workScore = 1 - Math.min(Math.abs(d.workHours - 40) / 20, 1);
    const activityScore = Math.min(d.physicalActivity / 10, 1);
    
    return {
      total: (sleepScore * 0.4 + workScore * 0.4 + activityScore * 0.2),
      sleep: sleepScore,
      work: workScore,
      activity: activityScore
    };
  }

  function determineTreatmentStatus(d) {
    return {
      hasCondition: d.Mental_Health_Condition === 'Yes',
      seeking: d.Consultation_History === 'Yes',
      severity: d.Severity,
      accessScore: calculateAccessScore(d)
    };
  }

  function determineCluster(d) {
    const wellbeing = calculateWorklifeScore(d).total;
    const lifestyle = wellbeing > 0.6 ? 'Balanced' : 'Intense';
    return `${lifestyle}-${d.stressLevel}`;
  }

  function calculateStressImpact(d) {
    const baseImpact = d.stressLevel === 'High' ? 1 :
                      d.stressLevel === 'Medium' ? 0.6 : 0.3;
    const sleepImpact = d.sleepHours < 6 ? 0.3 : 0;
    const workImpact = d.workHours > 50 ? 0.3 : 0;
    
    return {
      total: Math.min(1, baseImpact + sleepImpact + workImpact),
      physical: d.physicalActivity < 3 ? 'Low' : 
               d.physicalActivity > 7 ? 'High' : 'Moderate',
      sleep: d.sleepHours < 6 ? 'Poor' : 
             d.sleepHours > 8 ? 'Good' : 'Adequate'
    };
  }

  function calculateAccessScore(d) {
    let score = 0;
    if (d.Consultation_History === 'Yes') score += 0.5;
    if (d.Severity === 'High') score += 0.3;
    if (d.workHours > 50) score -= 0.2;
    if (d.sleepHours < 6) score -= 0.1;
    return Math.max(0, Math.min(1, score));
  }

  function generateParticles(isUser = false) {
    const count = isUser ? 12 : 8;
    return Array.from({ length: count }, () => ({
      offset: {
        x: (Math.random() - 0.5) * 20,
        y: (Math.random() - 0.5) * 20
      },
      phase: Math.random() * Math.PI * 2,
      radius: isUser ? 2.5 : 2
    }));
  }

  function initializeVisualization() {
    if (!svg || !processedData.length) return;

    // Clear previous visualization
    d3.select(svg).selectAll('*').remove();

    // Setup gradient definitions
    setupGradients();

    // Initialize appropriate view
    switch(currentDimension) {
      case 'clusters':
        initializeClusterView();
        break;
      case 'worklife':
        initializeWorklifeView();
        break;
      case 'treatment':
        initializeTreatmentView();
        break;
      case 'stress':
        initializeStressView();
        break;
    }
  }

   function initializeClusterView() {
    const config = VIEW_CONFIGS.clusters;
    
    // Create cluster labels
    const labelGroup = d3.select(svg).append('g')
      .attr('class', 'cluster-labels');

    Object.entries(config.positions).forEach(([cluster, pos]) => {
      labelGroup.append('text')
        .attr('class', 'cluster-label')
        .attr('x', pos.x * width)
        .attr('y', pos.y * height - 40)
        .text(cluster.replace('-', ' '))
        .style('opacity', 0)
        .transition()
        .duration(1000)
        .style('opacity', 1);
    });

    // Initialize simulation
    simulation = d3.forceSimulation(processedData)
      .force('center', d3.forceCenter(width/2, height/2))
      .force('charge', d3.forceManyBody().strength(config.forces.charge))
      .force('collision', d3.forceCollide().radius(config.forces.collision))
      .force('cluster', createClusterForce())
      .on('tick', () => {
        updateParticles();
        updateNodes();
      });
  }

  function initializeWorklifeView() {
    const config = VIEW_CONFIGS.worklife;

    // Create axes
    const axisGroup = d3.select(svg).append('g')
      .attr('class', 'axes');

    // X-axis (Work Balance)
    axisGroup.append('line')
      .attr('class', 'axis-line')
      .attr('x1', 0)
      .attr('y1', height - 30)
      .attr('x2', width)
      .attr('y2', height - 30);

    axisGroup.append('text')
      .attr('class', 'axis-label')
      .attr('x', width/2)
      .attr('y', height - 10)
      .attr('text-anchor', 'middle')
      .text('Work Balance →');

    // Y-axis (Sleep Quality)
    axisGroup.append('line')
      .attr('class', 'axis-line')
      .attr('x1', 30)
      .attr('y1', 0)
      .attr('x2', 30)
      .attr('y2', height);

    axisGroup.append('text')
      .attr('class', 'axis-label')
      .attr('transform', `translate(10, ${height/2}) rotate(-90)`)
      .attr('text-anchor', 'middle')
      .text('Sleep Quality →');

    // Initialize simulation
    simulation = d3.forceSimulation(processedData)
      .force('x', d3.forceX(d => width * d.worklifeScore.work).strength(config.forces.xStrength))
      .force('y', d3.forceY(d => height * (1 - d.worklifeScore.sleep)).strength(config.forces.yStrength))
      .force('charge', d3.forceManyBody().strength(config.forces.charge))
      .force('collision', d3.forceCollide().radius(config.forces.collision))
      .on('tick', () => {
        updateParticles();
        updateNodes();
      });
  }

  function initializeTreatmentView() {
    const config = VIEW_CONFIGS.treatment;

    // Create treatment journey path
    const pathGroup = d3.select(svg).append('g')
      .attr('class', 'treatment-path');

    // Add journey stages
    const stages = ['No Condition', 'Identified', 'Seeking Treatment'];
    stages.forEach((stage, i) => {
      const x = width * (i * 0.3 + 0.2);
      
      pathGroup.append('circle')
        .attr('cx', x)
        .attr('cy', height/2)
        .attr('r', 5)
        .attr('fill', 'var(--color-bright-purple)')
        .attr('opacity', 0.3);

      pathGroup.append('text')
        .attr('class', 'axis-label')
        .attr('x', x)
        .attr('y', height/2 + 25)
        .attr('text-anchor', 'middle')
        .text(stage);
    });

    // Add connecting lines
    pathGroup.append('path')
      .attr('class', 'axis-line')
      .attr('d', `M ${width*0.2} ${height/2} L ${width*0.8} ${height/2}`)
      .attr('fill', 'none');

    // Initialize simulation
    simulation = d3.forceSimulation(processedData)
      .force('x', d3.forceX(d => {
        if (!d.treatmentStatus.hasCondition) return width * 0.2;
        return d.treatmentStatus.seeking ? width * 0.8 : width * 0.5;
      }).strength(config.forces.xStrength))
      .force('y', d3.forceY(d => height * (1 - d.treatmentStatus.accessScore))
        .strength(config.forces.yStrength))
      .force('charge', d3.forceManyBody().strength(config.forces.charge))
      .force('collision', d3.forceCollide().radius(config.forces.collision))
      .on('tick', () => {
        updateParticles();
        updateNodes();
      });
  }

  function initializeStressView() {
    const config = VIEW_CONFIGS.stress;

    // Create stress level bands
    const bandGroup = d3.select(svg).append('g')
      .attr('class', 'stress-bands');

    ['High', 'Medium', 'Low'].forEach((level, i) => {
      const y = height * (i * 0.3 + 0.2);
      
      bandGroup.append('rect')
        .attr('x', 0)
        .attr('y', y - 30)
        .attr('width', width)
        .attr('height', 60)
        .attr('fill', COLORS.STRESS[level.toUpperCase()])
        .attr('opacity', 0.1);

      bandGroup.append('text')
        .attr('class', 'cluster-label')
        .attr('x', 20)
        .attr('y', y)
        .text(`${level} Stress`);
    });

    // Add impact scale
    bandGroup.append('text')
      .attr('class', 'axis-label')
      .attr('x', width/2)
      .attr('y', height - 10)
      .attr('text-anchor', 'middle')
      .text('Stress Impact →');

    // Initialize simulation
    simulation = d3.forceSimulation(processedData)
      .force('x', d3.forceX(d => width * d.stressImpact.total).strength(config.forces.xStrength))
      .force('y', d3.forceY(d => {
        const stressY = d.stressLevel === 'High' ? 0.2 :
                       d.stressLevel === 'Medium' ? 0.5 : 0.8;
        return height * stressY;
      }).strength(config.forces.yStrength))
      .force('charge', d3.forceManyBody().strength(config.forces.charge))
      .force('collision', d3.forceCollide().radius(config.forces.collision))
      .on('tick', () => {
        updateParticles();
        updateNodes();
      });
  }

  function updateNodes() {
    const nodes = d3.select(svg)
      .selectAll('.node')
      .data(processedData);

    const nodesEnter = nodes.enter()
      .append('g')
      .attr('class', 'node')
      .on('mouseover', (event, d) => {
        hoveredNode = d;
      })
      .on('mouseout', () => {
        hoveredNode = null;
      })
      .on('click', (event, d) => {
        selectedNode = selectedNode === d ? null : d;
      })
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended));

    nodes.merge(nodesEnter)
      .attr('transform', d => `translate(${d.x},${d.y})`)
      .each(function(d) {
        if (!this.__icon) {
          this.__icon = new PersonIcon({
            target: this,
            props: {
              size: d.isUser ? 12 : 8,
              color: getNodeColor(d),
              isUser: d.isUser,
              wellbeing: d.worklifeScore.total
            }
          });
        } else {
          this.__icon.$set({
            color: getNodeColor(d)
          });
        }
      });

    nodes.exit().remove();
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

  function createClusterForce() {
    return alpha => {
      processedData.forEach(d => {
        const target = getNodePosition(d);
        d.vx += (target.x - d.x) * alpha * 0.1;
        d.vy += (target.y - d.y) * alpha * 0.1;
      });
    };
  }

  function setupGradients() {
    const defs = d3.select(svg).append('defs');

    // Add glow filter
    const filter = defs.append('filter')
      .attr('id', 'glow');

    filter.append('feGaussianBlur')
      .attr('stdDeviation', '2')
      .attr('result', 'coloredBlur');

    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode')
      .attr('in', 'coloredBlur');
    feMerge.append('feMergeNode')
      .attr('in', 'SourceGraphic');

    // Add gradients for different views
    Object.entries(COLORS).forEach(([key, value]) => {
      const gradient = defs.append('linearGradient')
        .attr('id', `gradient-${key.toLowerCase()}`)
        .attr('x1', '0%')
        .attr('y1', '0%')
        .attr('x2', '100%')
        .attr('y2', '100%');

      Object.values(value).forEach((color, i, arr) => {
        gradient.append('stop')
          .attr('offset', `${(i / (arr.length - 1)) * 100}%`)
          .attr('stop-color', color);
      });
    });
  }

  function updateVisualization() {
    // Stop current simulation if running
    if (simulation) simulation.stop();

    // Remove existing elements with transition
    d3.select(svg).selectAll('*')
      .transition()
      .duration(500)
      .style('opacity', 0)
      .remove()
      .on('end', () => {
        // Initialize new visualization
        initializeVisualization();
      });
  }

  function getNodePosition(d) {
    switch(currentDimension) {
      case 'clusters':
        const clusterPos = VIEW_CONFIGS.clusters.positions[d.cluster];
        return {
          x: clusterPos.x * width,
          y: clusterPos.y * height
        };
      
      case 'worklife':
        return {
          x: width * (d.worklifeScore.work),
          y: height * (1 - d.worklifeScore.sleep)
        };
      
      case 'treatment':
        let xPos;
        if (!d.treatmentStatus.hasCondition) {
          xPos = 0.2;
        } else {
          xPos = d.treatmentStatus.seeking ? 0.8 : 0.5;
        }
        return {
          x: width * xPos,
          y: height * (1 - d.treatmentStatus.accessScore)
        };
      
      case 'stress':
        const stressY = d.stressLevel === 'High' ? 0.2 :
                       d.stressLevel === 'Medium' ? 0.5 : 0.8;
        return {
          x: width * d.stressImpact.total,
          y: height * stressY
        };
    }
  }

  function updateParticles() {
    const time = Date.now() * 0.001;
    
    processedData.forEach(d => {
      d.particles.forEach(p => {
        const wobble = Math.sin(time * 0.5) * 0.3;
        p.offset.x = Math.cos(p.phase + time) * 20 * (1 + wobble);
        p.offset.y = Math.sin(p.phase + time) * 20 * (1 + wobble);
      });
    });

    const particleGroups = d3.select(svg)
      .selectAll('.particle-group')
      .data(processedData);

    // Enter + Update particles
    particleGroups.enter()
      .append('g')
      .attr('class', 'particle-group')
      .merge(particleGroups)
      .attr('transform', d => `translate(${d.x},${d.y})`)
      .each(function(d) {
        const particles = d3.select(this)
          .selectAll('.particle')
          .data(d.particles);

        particles.enter()
          .append('circle')
          .attr('class', 'particle')
          .merge(particles)
          .attr('r', p => p.radius)
          .attr('cx', p => p.offset.x)
          .attr('cy', p => p.offset.y)
          .attr('fill', getNodeColor(d))
          .attr('opacity', 0.6)
          .attr('filter', d.isUser ? 'url(#glow)' : null);

        particles.exit().remove();
      });

    particleGroups.exit().remove();
  }

  function getNodeColor(d) {
    switch(currentDimension) {
      case 'clusters':
        return d.cluster ? COLORS.WORKLIFE[d.cluster.split('-')[0].toUpperCase()] 
                       : COLORS.WORKLIFE.MODERATE;
      
      case 'worklife':
        const score = d.worklifeScore.total;
        return score > 0.7 ? COLORS.WORKLIFE.BALANCED :
               score > 0.4 ? COLORS.WORKLIFE.MODERATE :
               COLORS.WORKLIFE.INTENSE;
      
      case 'treatment':
        if (!d.treatmentStatus.hasCondition) return COLORS.TREATMENT.UNTREATED;
        return d.treatmentStatus.seeking ? COLORS.TREATMENT.TREATED 
                                       : COLORS.TREATMENT.IDENTIFIED;
      
      case 'stress':
        return COLORS.STRESS[d.stressLevel.toUpperCase()];
    }
  }

  onMount(() => {
    if (container) {
      const rect = container.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      processData();
      initializeVisualization();

      const resizeObserver = new ResizeObserver(() => {
        const rect = container.getBoundingClientRect();
        width = rect.width;
        height = rect.height;
        updateVisualization();
      });

      resizeObserver.observe(container);

      return () => {
        resizeObserver.disconnect();
        if (simulation) simulation.stop();
      };
    }
  });
</script>

<div class="dynamic-tribe-viz" bind:this={container}>
  <!-- Main Visualization -->
  <svg bind:this={svg} {width} {height} />

  <!-- Dimension Controls -->
  <DimensionControls
    dimension={currentDimension}
    on:change={e => {
      currentDimension = e.detail;
      updateVisualization();
    }}
  />

  <!-- Insight Panel -->
  <InsightPanel
    {processedData}
    {selectedNode}
    {hoveredNode}
    dimension={currentDimension}
  />
</div>

<style>
  .dynamic-tribe-viz {
    width: 100%;
    height: 100%;
    position: relative;
    background: var(--color-dark-purple);
    overflow: hidden;
  }

  :global(.particle) {
    transition: all 0.3s ease;
  }

  :global(.particle-group) {
    pointer-events: none;
  }

  :global(.node) {
    cursor: pointer;
    transition: transform 0.2s ease;
  }

  :global(.node:hover) {
    transform: scale(1.1);
  }

  :global(.axis-line) {
    stroke: var(--color-off-purple);
    stroke-opacity: 0.2;
    stroke-width: 1;
    stroke-dasharray: 4 4;
  }

  :global(.axis-label) {
    fill: var(--color-bright-purple);
    font-size: 12px;
    font-weight: 500;
  }

  :global(.cluster-label) {
    fill: var(--color-bright-purple);
    font-size: 14px;
    font-weight: 500;
    text-anchor: middle;
    pointer-events: none;
    opacity: 0.8;
  }

  @media (max-width: 768px) {
    :global(.axis-label) {
      font-size: 10px;
    }

    :global(.cluster-label) {
      font-size: 12px;
    }
  }
</style>


