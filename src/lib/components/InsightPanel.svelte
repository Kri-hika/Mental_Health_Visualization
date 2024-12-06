<!-- InsightPanel.svelte -->
<script>
  import { onMount } from 'svelte';
  
  export let processedData;
  export let selectedNode;
  export let hoveredNode;
  export let dimension;

  // State for tab management
  let activeSection = 'overview';

  // Helper functions for insight generation
  function getClusterInsights(node) {
    if (!node) return null;
    
    const stressLevel = node.stressLevel;
    const workHours = node.workHours;
    const sleepHours = node.sleepHours;
    
    return {
      title: `${node.cluster} Cluster Analysis`,
      key_metrics: [
        { label: 'Sleep', value: `${sleepHours}hrs/day` },
        { label: 'Work', value: `${workHours}hrs/week` },
        { label: 'Stress', value: stressLevel }
      ],
      insights: [
        workHours > 50 ? 'High workload may contribute to stress' : 'Moderate workload',
        sleepHours < 6 ? 'Sleep deprivation risk detected' : 'Healthy sleep pattern',
        node.physicalActivity < 3 ? 'Limited physical activity' : 'Active lifestyle'
      ]
    };
  }

  function getWorklifeInsights(node) {
    if (!node) return null;
    
    const worklifeScore = node.worklifeScore?.total || 0;
    const assessment = worklifeScore > 0.7 ? 'Excellent' :
                      worklifeScore > 0.4 ? 'Moderate' : 'Needs Attention';
    
    return {
      title: 'Work-Life Balance Assessment',
      score: {
        value: Math.round(worklifeScore * 100),
        label: assessment
      },
      recommendations: [
        node.sleepHours < 7 ? 'Improve sleep schedule' : 'Maintain sleep routine',
        node.workHours > 45 ? 'Consider workload reduction' : 'Good work hours',
        node.physicalActivity < 5 ? 'Increase physical activity' : 'Good activity level'
      ]
    };
  }

  function getTreatmentInsights(node) {
    if (!node) return null;
    
    const hasMentalHealth = node.treatmentStatus?.hasCondition;
    const isSeeking = node.treatmentStatus?.seeking;
    
    return {
      title: 'Treatment & Support Analysis',
      status: {
        condition: hasMentalHealth ? 'Identified' : 'No Condition',
        seeking: isSeeking ? 'Seeking Help' : 'Not Seeking Help'
      },
      suggestions: [
        hasMentalHealth && !isSeeking ? 'Consider professional consultation' : '',
        node.stressLevel === 'High' ? 'High stress - support recommended' : '',
        node.worklifeScore?.total < 0.4 ? 'Work-life balance support needed' : ''
      ].filter(Boolean)
    };
  }

  function getStressInsights(node) {
    if (!node) return null;
    
    const riskFactors = [];
    if (node.sleepHours < 6) riskFactors.push('Sleep Deprivation');
    if (node.workHours > 50) riskFactors.push('High Workload');
    if (node.physicalActivity < 3) riskFactors.push('Low Physical Activity');
    
    return {
      title: 'Stress Pattern Analysis',
      level: node.stressLevel,
      riskFactors,
      metrics: {
        sleep: node.sleepHours,
        work: node.workHours,
        activity: node.physicalActivity
      }
    };
  }

  // Reactive insights based on dimension and selected/hovered node
  $: activeNode = selectedNode || hoveredNode;
  $: insights = dimension === 'clusters' ? getClusterInsights(activeNode) :
                dimension === 'worklife' ? getWorklifeInsights(activeNode) :
                dimension === 'treatment' ? getTreatmentInsights(activeNode) :
                dimension === 'stress' ? getStressInsights(activeNode) : null;
</script>

<div class="insight-panel">
  <div class="tabs">
    <button 
      class:active={activeSection === 'overview'}
      on:click={() => activeSection = 'overview'}
    >
      Overview
    </button>
    <button 
      class:active={activeSection === 'analysis'}
      on:click={() => activeSection = 'analysis'}
    >
      Detailed Analysis
    </button>
  </div>

  <div class="content">
    {#if activeSection === 'overview'}
      {#if insights}
        <div class="overview-section">
          <h3>{insights.title}</h3>
          
          {#if insights.key_metrics}
            <div class="metrics-grid">
              {#each insights.key_metrics as metric}
                <div class="metric-card">
                  <span class="label">{metric.label}</span>
                  <span class="value">{metric.value}</span>
                </div>
              {/each}
            </div>
          {/if}

          {#if insights.score}
            <div class="score-display">
              <div class="score">
                <span class="value">{insights.score.value}%</span>
                <span class="label">{insights.score.label}</span>
              </div>
            </div>
          {/if}

          {#if insights.status}
            <div class="status-section">
              <div class="status-item">
                <span class="label">Condition:</span>
                <span class="value">{insights.status.condition}</span>
              </div>
              <div class="status-item">
                <span class="label">Treatment:</span>
                <span class="value">{insights.status.seeking}</span>
              </div>
            </div>
          {/if}
        </div>
      {:else}
        <p class="placeholder">Select or hover over a node to see insights</p>
      {/if}
    {:else}
      {#if insights}
        <div class="analysis-section">
          {#if insights.insights}
            <div class="insights-list">
              {#each insights.insights as insight}
                <div class="insight-item">{insight}</div>
              {/each}
            </div>
          {/if}

          {#if insights.recommendations}
            <div class="recommendations">
              <h4>Recommendations</h4>
              {#each insights.recommendations as rec}
                <div class="recommendation-item">{rec}</div>
              {/each}
            </div>
          {/if}

          {#if insights.riskFactors}
            <div class="risk-analysis">
              <h4>Risk Factors</h4>
              {#each insights.riskFactors as factor}
                <div class="risk-factor">{factor}</div>
              {/each}
            </div>
          {/if}
        </div>
      {:else}
        <p class="placeholder">Select a node for detailed analysis</p>
      {/if}
    {/if}
  </div>
</div>

<style>
  .insight-panel {
    height: 100%;
    display: flex;
    flex-direction: column;
    background: rgba(20, 0, 40, 0.9);
    backdrop-filter: blur(8px);
  }

  .tabs {
    display: flex;
    gap: 1rem;
    padding: 1rem;
    border-bottom: 1px solid rgba(157, 78, 221, 0.2);
  }

  .tabs button {
    background: none;
    border: none;
    color: var(--color-text);
    padding: 0.5rem 1rem;
    cursor: pointer;
    opacity: 0.7;
    transition: all 0.2s ease;
  }

  .tabs button.active {
    opacity: 1;
    color: var(--color-bright-purple);
    border-bottom: 2px solid var(--color-bright-purple);
  }

  .content {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
  }

  .metrics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
    gap: 1rem;
    margin-top: 1rem;
  }

  .metric-card {
    background: rgba(157, 78, 221, 0.1);
    padding: 0.75rem;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .score-display {
    text-align: center;
    margin: 2rem 0;
  }

  .score {
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    background: rgba(157, 78, 221, 0.1);
    padding: 2rem;
    border-radius: 50%;
  }

  .score .value {
    font-size: 2rem;
    font-weight: bold;
    color: var(--color-bright-purple);
  }

  .insights-list, .recommendations, .risk-analysis {
    margin-top: 1.5rem;
  }

  .insight-item, .recommendation-item, .risk-factor {
    background: rgba(157, 78, 221, 0.1);
    padding: 0.75rem;
    border-radius: 6px;
    margin-bottom: 0.5rem;
  }

  .placeholder {
    text-align: center;
    opacity: 0.7;
    margin-top: 2rem;
  }

  h3, h4 {
    color: var(--color-bright-purple);
    margin: 0 0 1rem 0;
  }
</style>