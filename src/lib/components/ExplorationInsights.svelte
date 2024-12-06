<!-- src/lib/components/ExplorationInsights.svelte -->
<script>
  import { onMount } from 'svelte';
  import * as d3 from 'd3';
  import _ from 'lodash';
  
  export let data; // mental health dataset
  export let userData; // user's data
  
  let container;
  let width = 1000;
  let height = 600;
  let currentSection = 0;

  // Process key insights
  const processedInsights = {
    workStressCorrelation: calculateWorkStressCorrelation(data),
    sleepPatterns: analyzeSleepPatterns(data),
    treatmentAccess: analyzeTreatmentAccess(data),
    userContext: compareUserContext(userData, data)
  };

  // 1. Work-Stress Correlation Analysis
  function calculateWorkStressCorrelation(data) {
    return {
      byWorkHours: _.chain(data)
        .groupBy(d => Math.floor(d.workHours / 10) * 10)
        .mapValues(group => ({
          totalCount: group.length,
          highStress: group.filter(d => d.stressLevel === 'High').length,
          avgSleep: _.meanBy(group, 'sleepHours')
        }))
        .value(),
      
      byOccupation: _.chain(data)
        .groupBy('occupation')
        .mapValues(group => ({
          avgWorkHours: _.meanBy(group, 'workHours'),
          highStressRate: group.filter(d => d.stressLevel === 'High').length / group.length,
          mentalHealthRate: group.filter(d => d.Mental_Health_Condition === 'Yes').length / group.length
        }))
        .value()
    };
  }

  // 2. Sleep Pattern Analysis
  function analyzeSleepPatterns(data) {
    return {
      distribution: _.chain(data)
        .groupBy(d => Math.floor(d.sleepHours))
        .mapValues(group => ({
          count: group.length,
          highStress: group.filter(d => d.stressLevel === 'High').length,
          mentalHealth: group.filter(d => d.Mental_Health_Condition === 'Yes').length
        }))
        .value(),
        
      byStressLevel: _.chain(data)
        .groupBy('stressLevel')
        .mapValues(group => ({
          avgSleep: _.meanBy(group, 'sleepHours'),
          mentalHealthRate: group.filter(d => d.Mental_Health_Condition === 'Yes').length / group.length
        }))
        .value()
    };
  }

  // 3. Treatment Access Analysis
  function analyzeTreatmentAccess(data) {
    const withConditions = data.filter(d => d.Mental_Health_Condition === 'Yes');
    
    return {
      overall: {
        identified: withConditions.length / data.length,
        seeking: withConditions.filter(d => d.Consultation_History === 'Yes').length / withConditions.length
      },
      
      byWorkload: _.chain(withConditions)
        .groupBy(d => d.workHours > 50 ? 'High' : d.workHours > 40 ? 'Medium' : 'Low')
        .mapValues(group => ({
          total: group.length,
          seeking: group.filter(d => d.Consultation_History === 'Yes').length
        }))
        .value(),
        
      byAge: _.chain(withConditions)
        .groupBy(d => d.age < 30 ? 'Young' : d.age < 50 ? 'Mid' : 'Senior')
        .mapValues(group => ({
          total: group.length,
          seeking: group.filter(d => d.Consultation_History === 'Yes').length
        }))
        .value()
    };
  }

  // 4. User Context Comparison
  function compareUserContext(user, data) {
    const userAgeGroup = user.age < 30 ? 'Young' : user.age < 50 ? 'Mid' : 'Senior';
    const userWorkload = user.workHours > 50 ? 'High' : user.workHours > 40 ? 'Medium' : 'Low';
    
    const similarProfiles = data.filter(d => {
      const sameAgeGroup = (d.age < 30 && userAgeGroup === 'Young') ||
                          (d.age >= 30 && d.age < 50 && userAgeGroup === 'Mid') ||
                          (d.age >= 50 && userAgeGroup === 'Senior');
      const sameWorkload = (d.workHours > 50 && userWorkload === 'High') ||
                          (d.workHours > 40 && d.workHours <= 50 && userWorkload === 'Medium') ||
                          (d.workHours <= 40 && userWorkload === 'Low');
      return sameAgeGroup && sameWorkload;
    });

    return {
      similarProfiles,
      comparisons: {
        sleepDiff: user.sleepHours - _.meanBy(similarProfiles, 'sleepHours'),
        workDiff: user.workHours - _.meanBy(similarProfiles, 'workHours'),
        stressComparison: {
          user: user.stressLevel,
          similar: _.chain(similarProfiles)
            .countBy('stressLevel')
            .toPairs()
            .maxBy('[1]')[0]
            .value()
        }
      }
    };
  }

  // Visualization Sections
  const sections = [
    {
      title: "Work-Stress Impact",
      description: "The relationship between work hours and stress levels reveals critical patterns in mental health.",
      render: (container) => renderWorkStressViz(container)
    },
    {
      title: "Sleep Patterns & Mental Health",
      description: "Sleep quality shows strong correlations with stress levels and mental health conditions.",
      render: (container) => renderSleepPatternsViz(container)
    },
    {
      title: "Treatment Access Insights",
      description: "Understanding who seeks help and the barriers they face.",
      render: (container) => renderTreatmentViz(container)
    },
    {
      title: "Your Context",
      description: "How your patterns compare to similar profiles.",
      render: (container) => renderUserContextViz(container)
    }
  ];

  function renderWorkStressViz(container) {
    const margin = { top: 40, right: 40, bottom: 60, left: 60 };
    const vizWidth = width - margin.left - margin.right;
    const vizHeight = height - margin.top - margin.bottom;

    // Clear previous
    d3.select(container).selectAll('*').remove();

    const svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Create scales
    const xScale = d3.scaleLinear()
      .domain([20, 80])
      .range([0, vizWidth]);

    const yScale = d3.scaleLinear()
      .domain([0, 1])
      .range([vizHeight, 0]);

    // Create line for stress rate
    const line = d3.line()
      .x(d => xScale(d[0]))
      .y(d => yScale(d[1].highStress / d[1].totalCount))
      .curve(d3.curveMonotoneX);

    // Plot data
    const data = Object.entries(processedInsights.workStressCorrelation.byWorkHours);

    // Add the line path
    svg.append('path')
      .datum(data)
      .attr('class', 'stress-line')
      .attr('d', line)
      .attr('fill', 'none')
      .attr('stroke', '#FF6B9C')
      .attr('stroke-width', 2)
      .attr('opacity', 0.8);

    // Add dots
    svg.selectAll('.dot')
      .data(data)
      .enter()
      .append('circle')
      .attr('class', 'dot')
      .attr('cx', d => xScale(d[0]))
      .attr('cy', d => yScale(d[1].highStress / d[1].totalCount))
      .attr('r', 4)
      .attr('fill', '#FF6B9C')
      .attr('opacity', 0.8);

    // Add axes
    svg.append('g')
      .attr('transform', `translate(0,${vizHeight})`)
      .call(d3.axisBottom(xScale).ticks(5))
      .attr('color', 'var(--color-off-purple)');

    svg.append('g')
      .call(d3.axisLeft(yScale).tickFormat(d3.format('.0%')))
      .attr('color', 'var(--color-off-purple)');

    // Add labels
    svg.append('text')
      .attr('x', vizWidth / 2)
      .attr('y', vizHeight + 40)
      .attr('text-anchor', 'middle')
      .attr('fill', 'var(--color-bright-purple)')
      .text('Work Hours per Week');

    svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -vizHeight / 2)
      .attr('y', -40)
      .attr('text-anchor', 'middle')
      .attr('fill', 'var(--color-bright-purple)')
      .text('High Stress Rate');

    // Add user's position if available
    if (userData) {
      svg.append('circle')
        .attr('cx', xScale(userData.workHours))
        .attr('cy', yScale(0))
        .attr('r', 6)
        .attr('fill', '#FFD700')
        .attr('stroke', 'white')
        .attr('stroke-width', 2);
    }
  }

  function renderSleepPatternsViz(container) {
    const margin = { top: 40, right: 40, bottom: 60, left: 60 };
    const vizWidth = width - margin.left - margin.right;
    const vizHeight = height - margin.top - margin.bottom;

    // Clear previous
    d3.select(container).selectAll('*').remove();

    const svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Process data
    const sleepData = Object.entries(processedInsights.sleepPatterns.distribution)
      .map(([hours, data]) => ({
        hours: +hours,
        total: data.count,
        mentalHealth: data.mentalHealth,
        highStress: data.highStress
      }));

    // Create scales
    const xScale = d3.scaleBand()
      .domain(sleepData.map(d => d.hours))
      .range([0, vizWidth])
      .padding(0.1);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(sleepData, d => d.total)])
      .range([vizHeight, 0]);

    // Create stacked bars
    const stackedData = d3.stack()
      .keys(['mentalHealth', 'highStress'])
      (sleepData);

    // Add bars
    const colorScale = d3.scaleOrdinal()
      .domain(['mentalHealth', 'highStress'])
      .range(['#9D4EDD', '#FF6B9C']);

    svg.selectAll('g.stack')
      .data(stackedData)
      .enter()
      .append('g')
      .attr('class', 'stack')
      .style('fill', d => colorScale(d.key))
      .selectAll('rect')
      .data(d => d)
      .enter()
      .append('rect')
      .attr('x', d => xScale(d.data.hours))
      .attr('y', d => yScale(d[1]))
      .attr('height', d => yScale(d[0]) - yScale(d[1]))
      .attr('width', xScale.bandwidth())
      .attr('opacity', 0.8);

    // Add axes
    svg.append('g')
      .attr('transform', `translate(0,${vizHeight})`)
      .call(d3.axisBottom(xScale))
      .attr('color', 'var(--color-off-purple)');

    svg.append('g')
      .call(d3.axisLeft(yScale))
      .attr('color', 'var(--color-off-purple)');

    // Add labels
    svg.append('text')
      .attr('x', vizWidth / 2)
      .attr('y', vizHeight + 40)
      .attr('text-anchor', 'middle')
      .attr('fill', 'var(--color-bright-purple)')
      .text('Hours of Sleep');

    svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -vizHeight / 2)
      .attr('y', -40)
      .attr('text-anchor', 'middle')
      .attr('fill', 'var(--color-bright-purple)')
      .text('Number of People');

    // Add user marker
    if (userData) {
      svg.append('line')
        .attr('x1', xScale(Math.floor(userData.sleepHours)))
        .attr('x2', xScale(Math.floor(userData.sleepHours)))
        .attr('y1', vizHeight)
        .attr('y2', 0)
        .attr('stroke', '#FFD700')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '4,4')
        .attr('opacity', 0.8);
    }
  }

  function renderTreatmentViz(container) {
    const margin = { top: 40, right: 120, bottom: 60, left: 60 };
    const vizWidth = width - margin.left - margin.right;
    const vizHeight = height - margin.top - margin.bottom;

    // Clear previous
    d3.select(container).selectAll('*').remove();

    const svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Process data for treatment by age
    const ageData = Object.entries(processedInsights.treatmentAccess.byAge)
      .map(([age, data]) => ({
        age,
        total: data.total,
        seeking: data.seeking,
        rate: data.seeking / data.total
      }));

    // Create scales
    const xScale = d3.scaleBand()
      .domain(ageData.map(d => d.age))
      .range([0, vizWidth])
      .padding(0.1);

    const yScale = d3.scaleLinear()
      .domain([0, 1])
       .range([vizHeight, 0]);

    // Create grouped bars
    const bars = svg.selectAll('.treatment-bars')
      .data(ageData)
      .enter()
      .append('g')
      .attr('class', 'treatment-bars')
      .attr('transform', d => `translate(${xScale(d.age)},0)`);

    // Add total bars
    bars.append('rect')
      .attr('y', d => yScale(d.total / d.total))
      .attr('width', xScale.bandwidth())
      .attr('height', d => vizHeight - yScale(d.total / d.total))
      .attr('fill', '#4FACFF')
      .attr('opacity', 0.3);

    // Add seeking treatment bars
    bars.append('rect')
      .attr('y', d => yScale(d.seeking / d.total))
      .attr('width', xScale.bandwidth())
      .attr('height', d => vizHeight - yScale(d.seeking / d.total))
      .attr('fill', '#4FACFF')
      .attr('opacity', 0.8);

    // Add percentages
    bars.append('text')
      .attr('x', xScale.bandwidth() / 2)
      .attr('y', d => yScale(d.rate) - 10)
      .attr('text-anchor', 'middle')
      .attr('fill', 'var(--color-bright-purple)')
      .text(d => `${Math.round(d.rate * 100)}%`)
      .attr('font-size', '12px');

    // Add axes and labels
    svg.append('g')
      .attr('transform', `translate(0,${vizHeight})`)
      .call(d3.axisBottom(xScale))
      .attr('color', 'var(--color-off-purple)');

    svg.append('g')
      .call(d3.axisLeft(yScale).tickFormat(d3.format('.0%')))
      .attr('color', 'var(--color-off-purple)');

    // Add legend
    const legend = svg.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${vizWidth + 20}, 20)`);

    legend.append('rect')
      .attr('width', 15)
      .attr('height', 15)
      .attr('fill', '#4FACFF')
      .attr('opacity', 0.3);

    legend.append('text')
      .attr('x', 25)
      .attr('y', 12)
      .text('Identified')
      .attr('fill', 'var(--color-off-purple)')
      .attr('font-size', '12px');

    legend.append('rect')
      .attr('width', 15)
      .attr('height', 15)
      .attr('y', 25)
      .attr('fill', '#4FACFF')
      .attr('opacity', 0.8);

    legend.append('text')
      .attr('x', 25)
      .attr('y', 37)
      .text('Seeking Help')
      .attr('fill', 'var(--color-off-purple)')
      .attr('font-size', '12px');
  }

  function renderUserContextViz(container) {
    const userContext = processedInsights.userContext;
    const margin = { top: 40, right: 40, bottom: 60, left: 60 };
    const vizWidth = width - margin.left - margin.right;
    const vizHeight = height - margin.top - margin.bottom;

    // Clear previous
    d3.select(container).selectAll('*').remove();

    // Create radar chart
    const metrics = [
      { name: 'Sleep', value: userData.sleepHours / 10 },
      { name: 'Work Balance', value: 1 - (userData.workHours - 40) / 40 },
      { name: 'Stress', value: userData.stressLevel === 'Low' ? 1 : 
                               userData.stressLevel === 'Medium' ? 0.5 : 0 }
    ];

    const angleScale = d3.scalePoint()
      .domain(metrics.map(d => d.name))
      .range([0, Math.PI * 2]);

    const radiusScale = d3.scaleLinear()
      .domain([0, 1])
      .range([0, vizHeight / 2]);

    const svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${width/2},${height/2})`);

    // Add axis lines and labels
    metrics.forEach(metric => {
      const angle = angleScale(metric.name);
      const lineEnd = {
        x: Math.cos(angle - Math.PI/2) * vizHeight/2,
        y: Math.sin(angle - Math.PI/2) * vizHeight/2
      };

      // Draw axis line
      svg.append('line')
        .attr('x1', 0)
        .attr('y1', 0)
        .attr('x2', lineEnd.x)
        .attr('y2', lineEnd.y)
        .attr('stroke', 'var(--color-off-purple)')
        .attr('stroke-opacity', 0.2);

      // Add label
      svg.append('text')
        .attr('x', lineEnd.x * 1.1)
        .attr('y', lineEnd.y * 1.1)
        .attr('text-anchor', 'middle')
        .attr('fill', 'var(--color-bright-purple)')
        .text(metric.name);
    });

    // Draw user's values
    const userLine = d3.lineRadial()
      .angle(d => angleScale(d.name) - Math.PI/2)
      .radius(d => radiusScale(d.value))
      .curve(d3.curveLinearClosed);

    svg.append('path')
      .datum(metrics)
      .attr('d', userLine)
      .attr('fill', '#FFD700')
      .attr('fill-opacity', 0.2)
      .attr('stroke', '#FFD700')
      .attr('stroke-width', 2);

    // Add dots at metric points
    svg.selectAll('.metric-point')
      .data(metrics)
      .enter()
      .append('circle')
      .attr('class', 'metric-point')
      .attr('cx', d => Math.cos(angleScale(d.name) - Math.PI/2) * radiusScale(d.value))
      .attr('cy', d => Math.sin(angleScale(d.name) - Math.PI/2) * radiusScale(d.value))
      .attr('r', 4)
      .attr('fill', '#FFD700');
  }

  onMount(() => {
    if (container) {
      const rect = container.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      sections[currentSection].render(container);
    }
  });

  function handleNext() {
    if (currentSection < sections.length - 1) {
      currentSection++;
      sections[currentSection].render(container);
    }
  }

  function handlePrev() {
    if (currentSection > 0) {
      currentSection--;
      sections[currentSection].render(container);
    }
  }
</script>

<div class="exploration-container">
  <div class="section-info">
    <h2>{sections[currentSection].title}</h2>
    <p>{sections[currentSection].description}</p>
  </div>

  <div class="viz-container" bind:this={container}></div>

  <div class="controls">
    <button 
      class="nav-button"
      disabled={currentSection === 0}
      on:click={handlePrev}
    >
      ← Previous
    </button>
    
    <div class="progress">
      {currentSection + 1} of {sections.length}
    </div>
    
    <button 
      class="nav-button"
      disabled={currentSection === sections.length - 1}
      on:click={handleNext}
    >
      Next →
    </button>
  </div>
</div>

<style>
  .exploration-container {
    width: 100%;
    height: 100vh;
    background: var(--color-dark-purple);
    display: flex;
    flex-direction: column;
    padding: 2rem;
  }

  .section-info {
    text-align: center;
    margin-bottom: 2rem;
  }

  h2 {
    color: var(--color-bright-purple);
    font-size: 1.75rem;
    margin-bottom: 0.5rem;
  }

  p {
    color: var(--color-off-purple);
    font-size: 1.125rem;
    max-width: 600px;
    margin: 0 auto;
  }

  .viz-container {
    flex: 1;
    min-height: 0;
  }

  .controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 2rem;
  }

  .nav-button {
    background: transparent;
    border: 1px solid var(--color-bright-purple);
    color: var(--color-bright-purple);
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .nav-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .nav-button:not(:disabled):hover {
    background: var(--color-bright-purple);
    color: var(--color-dark-purple);
  }

  .progress {
    color: var(--color-off-purple);
    font-size: 0.875rem;
  }
</style>