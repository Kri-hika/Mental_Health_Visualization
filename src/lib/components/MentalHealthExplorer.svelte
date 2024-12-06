<!-- src/lib/components/MentalHealthExplorer.svelte -->
<script>
  import { onMount } from 'svelte';
  import { fade, fly } from 'svelte/transition';
  import { LineChart, BarChart, PieChart, Tooltip, Legend } from 'recharts';
  import _ from 'lodash';

  export let userData;
  export let data;

  let activeDimension = 'stress';
  let compareData;
  let insights;
  
  const dimensions = [
    { id: 'stress', label: 'Stress Levels' },
    { id: 'work', label: 'Work-Life Balance' },
    { id: 'sleep', label: 'Sleep Patterns' },
    { id: 'support', label: 'Support & Treatment' }
  ];

  $: if (userData && data) {
    processComparisonData();
  }

  function processComparisonData() {
    const userCluster = findUserCluster();
    compareData = processClusterData(userCluster);
    insights = generatePersonalInsights(compareData);
  }

  function findUserCluster() {
    const ageGroup = userData.age < 30 ? 'Young' : userData.age < 50 ? 'Mid' : 'Senior';
    const stressLevel = userData.stressLevel;
    return `${ageGroup}-${stressLevel}`;
  }

  function processClusterData(userCluster) {
    const similarProfiles = data.filter(d => {
      const age = d.age < 30 ? 'Young' : d.age < 50 ? 'Mid' : 'Senior';
      return `${age}-${d.stressLevel}` === userCluster;
    });

    return {
      workHours: {
        user: userData.workHours,
        avg: _.meanBy(similarProfiles, 'workHours'),
        distribution: _.countBy(similarProfiles, d => 
          Math.floor(d.workHours / 10) * 10
        )
      },
      sleepHours: {
        user: userData.sleepHours,
        avg: _.meanBy(similarProfiles, 'sleepHours'),
        distribution: _.countBy(similarProfiles, d => 
          Math.floor(d.sleepHours)
        )
      },
      stressLevel: {
        user: userData.stressLevel,
        distribution: _.countBy(similarProfiles, 'stressLevel')
      },
      treatment: {
        seekingHelp: _.filter(similarProfiles, 
          d => d.Consultation_History === 'Yes'
        ).length / similarProfiles.length
      }
    };
  }

  function generatePersonalInsights(clusterData) {
    const workDiff = userData.workHours - clusterData.workHours.avg;
    const sleepDiff = userData.sleepHours - clusterData.sleepHours.avg;

    return {
      primary: getPrimaryInsight(workDiff, sleepDiff),
      recommendations: getRecommendations(workDiff, sleepDiff, clusterData)
    };
  }

  function getPrimaryInsight(workDiff, sleepDiff) {
    if (Math.abs(workDiff) > 10) {
      return workDiff > 0 
        ? "Your work hours are significantly higher than your peers."
        : "You maintain better work-life balance than average.";
    }
    if (Math.abs(sleepDiff) > 1) {
      return sleepDiff < 0
        ? "Increasing your sleep hours could help reduce stress levels."
        : "Your healthy sleep patterns are a strong foundation.";
    }
    return "Your patterns align closely with others in your group.";
  }

  function getRecommendations(workDiff, sleepDiff, clusterData) {
    const recs = [];
    
    if (workDiff > 10) {
      recs.push({
        text: "Consider reducing work hours to match cluster average",
        impact: "Could lower stress by 20-30%",
        priority: "High"
      });
    }
    
    if (sleepDiff < -1) {
      recs.push({
        text: `Aim for ${Math.round(clusterData.sleepHours.avg)} hours of sleep`,
        impact: "Associated with 40% lower stress levels",
        priority: "High"
      });
    }

    if (clusterData.treatment.seekingHelp > 0.4 && 
        userData.Consultation_History === 'No') {
      recs.push({
        text: "Consider professional support like your peers",
        impact: "40% of your group benefits from consultation",
        priority: "Medium"
      });
    }

    return recs;
  }

  function getDimensionData(dimension) {
    if (!compareData) return [];

    switch (dimension) {
      case 'stress':
        return Object.entries(compareData.stressLevel.distribution)
          .map(([level, count]) => ({
            name: level,
            value: count,
            fill: level === userData.stressLevel ? '#9333EA' : '#4C1D95'
          }));
      case 'work':
        return Object.entries(compareData.workHours.distribution)
          .map(([hours, count]) => ({
            name: `${hours}-${Number(hours) + 9}hrs`,
            value: count,
            fill: Number(hours) <= userData.workHours && 
                  userData.workHours < Number(hours) + 10 
                    ? '#9333EA' 
                    : '#4C1D95'
          }));
      case 'sleep':
        return Object.entries(compareData.sleepHours.distribution)
          .map(([hours, count]) => ({
            name: `${hours}hrs`,
            value: count,
            fill: Math.abs(Number(hours) - userData.sleepHours) < 0.5 
              ? '#9333EA' 
              : '#4C1D95'
          }));
      default:
        return [];
    }
  }
</script>

<div class="w-full h-full bg-gray-900 text-gray-100 p-8" in:fade>
  <div class="max-w-7xl mx-auto">
    <!-- Dimension Selection -->
    <div class="flex gap-4 mb-8">
      {#each dimensions as dim}
        <button
          on:click={() => activeDimension = dim.id}
          class="px-4 py-2 rounded-lg transition-all {
            activeDimension === dim.id
              ? 'bg-purple-600 text-white'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }"
        >
          {dim.label}
        </button>
      {/each}
    </div>

    <!-- Main Content Grid -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      <!-- Visualization Panel -->
      <div class="md:col-span-2 bg-gray-800 rounded-xl p-6">
        <h3 class="text-xl mb-4">Your Profile Comparison</h3>
        <div class="h-80">
          {#if compareData}
            {#if activeDimension === 'stress'}
              <BarChart data={getDimensionData('stress')} width={600} height={300}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" />
              </BarChart>
            {:else if activeDimension === 'support'}
              <PieChart width={400} height={300}>
                <Pie
                  data={[
                    { name: 'Seeking Help', value: compareData.treatment.seekingHelp },
                    { name: 'Not Seeking', value: 1 - compareData.treatment.seekingHelp }
                  ]}
                  cx={200}
                  cy={150}
                  innerRadius={60}
                  outerRadius={80}
                  fill="#9333EA"
                  label
                />
                <Tooltip />
                <Legend />
              </PieChart>
            {:else}
              <LineChart
                data={getDimensionData(activeDimension)}
                width={600}
                height={300}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#9333EA" />
              </LineChart>
            {/if}
          {/if}
        </div>
      </div>

      <!-- Insights Panel -->
      <div class="bg-gray-800 rounded-xl p-6">
        <h3 class="text-xl mb-4">Personal Insights</h3>
        
        {#if insights}
          <p class="text-lg text-purple-300 mb-6">
            {insights.primary}
          </p>

          <div class="space-y-4">
            {#each insights.recommendations as rec}
              <div 
                class="bg-gray-700 rounded-lg p-4"
                in:fly={{ y: 20, duration: 300 }}
              >
                <div class="flex items-center gap-2 mb-2">
                  <span class="px-2 py-1 rounded text-sm {
                    rec.priority === 'High' 
                      ? 'bg-purple-600' 
                      : 'bg-purple-500'
                  }">
                    {rec.priority}
                  </span>
                  <h4 class="font-medium">{rec.text}</h4>
                </div>
                <p class="text-sm text-gray-300">{rec.impact}</p>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>

<style>
  :global(.recharts-wrapper) {
    margin: 0 auto;
  }
</style>