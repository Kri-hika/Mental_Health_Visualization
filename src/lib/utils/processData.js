// src/lib/utils/processData.js
import _ from 'lodash';

export function processMentalHealthData(data, treatmentData) {
  return {
    baseData: enhanceBaseData(data),
    treatmentInsights: processTreatmentData(treatmentData),
    summaryMetrics: calculateSummaryMetrics(data)
  };
}

function enhanceBaseData(data) {
  return data.map(d => ({
    ...d,
    worklifeScore: calculateWorklifeScore(d),
    stressMetrics: calculateStressMetrics(d),
    treatmentAccess: calculateTreatmentAccess(d),
    cluster: determineCluster(d)
  }));
}

function calculateWorklifeScore(d) {
  const sleepScore = calculateSleepScore(d.sleepHours);
  const workScore = calculateWorkScore(d.workHours);
  const activityScore = d.physicalActivity / 10; // Normalized to 0-1

  return {
    total: (sleepScore * 0.4 + workScore * 0.4 + activityScore * 0.2),
    sleep: sleepScore,
    work: workScore,
    activity: activityScore
  };
}

function calculateSleepScore(hours) {
  const ideal = 8;
  const deviation = Math.abs(hours - ideal);
  return Math.max(0, 1 - (deviation / 6)); // Normalize on a 6-hour deviation
}

function calculateWorkScore(hours) {
  const ideal = 40;
  const deviation = Math.abs(hours - ideal);
  return Math.max(0, 1 - (deviation / 40)); // Normalize on a 40-hour deviation
}

function calculateStressMetrics(d) {
  const stressLevels = {
    'Low': 0.3,
    'Medium': 0.6,
    'High': 0.9
  };

  const baseStress = stressLevels[d.stressLevel] || 0.6;
  const workImpact = d.workHours > 50 ? 0.2 : 0;
  const sleepImpact = d.sleepHours < 6 ? 0.2 : 0;

  return {
    level: d.stressLevel,
    score: Math.min(1, baseStress + workImpact + sleepImpact),
    factors: {
      workload: workImpact > 0,
      sleep: sleepImpact > 0
    }
  };
}

function calculateTreatmentAccess(d) {
  let accessScore = 0;
  
  // Base score from consultation history
  if (d.consultation === 'Yes') accessScore += 0.5;
  
  // Adjust based on work hours (potential barrier)
  if (d.workHours > 60) accessScore -= 0.2;
  else if (d.workHours > 50) accessScore -= 0.1;
  
  // Factor in stress level
  if (d.stressLevel === 'High') accessScore += 0.2;
  
  return {
    hasCondition: d.mentalHealth === 'Yes',
    seeking: d.consultation === 'Yes',
    accessScore: Math.max(0, Math.min(1, accessScore))
  };
}

function determineCluster(d) {
  const worklife = d.worklifeScore.total > 0.7 ? 'Balanced' :
                   d.worklifeScore.total > 0.4 ? 'Moderate' : 'Strained';
  
  const stress = d.stressMetrics.score > 0.7 ? 'High' :
                 d.stressMetrics.score > 0.4 ? 'Medium' : 'Low';
  
  return `${worklife}-${stress}`;
}

function processTreatmentData(treatmentData) {
  if (!treatmentData) return null;
  
  const grouped = _.groupBy(treatmentData, 'Group');
  return {
    byAge: processAgeGroups(grouped['By Age']),
    byGender: processGenderGroups(grouped['By Sex']),
    byState: processStateGroups(grouped['By State'])
  };
}

function calculateSummaryMetrics(data) {
  return {
    mentalHealthRate: data.filter(d => d.mentalHealth === 'Yes').length / data.length,
    consultationRate: data.filter(d => d.consultation === 'Yes').length / data.length,
    stressLevels: _.countBy(data, 'stressLevel'),
    averageWorkHours: _.meanBy(data, 'workHours'),
    averageSleepHours: _.meanBy(data, 'sleepHours')
  };
}

export function findSimilarProfiles(data, profile, options = {
  workHoursDiff: 5,
  sleepHoursDiff: 1,
  stressMatch: true,
  limit: 10
}) {
  return data
    .filter(d => 
      Math.abs(d.workHours - profile.workHours) <= options.workHoursDiff &&
      Math.abs(d.sleepHours - profile.sleepHours) <= options.sleepHoursDiff &&
      (!options.stressMatch || d.stressLevel === profile.stressLevel)
    )
    .sort((a, b) => {
      const aScore = calculateSimilarityScore(a, profile);
      const bScore = calculateSimilarityScore(b, profile);
      return bScore - aScore;
    })
    .slice(0, options.limit);
}

function calculateSimilarityScore(a, b) {
  const workDiff = Math.abs(a.workHours - b.workHours) / 40;
  const sleepDiff = Math.abs(a.sleepHours - b.sleepHours) / 8;
  const stressMatch = a.stressLevel === b.stressLevel ? 1 : 0;
  
  return 1 - ((workDiff + sleepDiff) / 2) + stressMatch;
}

export function generateInsights(data, profile) {
  const similarProfiles = findSimilarProfiles(data, profile);
  const cluster = determineCluster(profile);
  const clusterProfiles = data.filter(d => determineCluster(d) === cluster);
  
  return {
    personal: generatePersonalInsights(profile),
    similar: generateSimilarProfileInsights(similarProfiles),
    cluster: generateClusterInsights(clusterProfiles),
    recommendations: generateRecommendations(profile, similarProfiles)
  };
}

function generatePersonalInsights(profile) {
  return {
    worklife: {
      score: profile.worklifeScore.total,
      strengths: identifyStrengths(profile),
      challenges: identifyChallenges(profile)
    },
    stress: profile.stressMetrics,
    treatment: profile.treatmentAccess
  };
}

function generateSimilarProfileInsights(profiles) {
  return {
    count: profiles.length,
    averageWorkHours: _.meanBy(profiles, 'workHours'),
    averageSleepHours: _.meanBy(profiles, 'sleepHours'),
    stressDistribution: _.countBy(profiles, 'stressLevel')
  };
}

function generateClusterInsights(profiles) {
    return {
      size: profiles.length,
      averageStats: {
        workHours: _.meanBy(profiles, 'workHours'),
        sleepHours: _.meanBy(profiles, 'sleepHours'),
        physicalActivity: _.meanBy(profiles, 'physicalActivity')
      },
      mentalHealthRate: profiles.filter(d => d.mentalHealth === 'Yes').length / profiles.length,
      consultationRate: profiles.filter(d => d.consultation === 'Yes').length / profiles.length,
      commonPatterns: identifyCommonPatterns(profiles)
    };
  }
  
  function identifyCommonPatterns(profiles) {
    const patterns = [];
    
    // Work patterns
    const avgWorkHours = _.meanBy(profiles, 'workHours');
    if (avgWorkHours > 50) {
      patterns.push('High work hours');
    } else if (avgWorkHours < 35) {
      patterns.push('Flexible work schedule');
    }
  
    // Sleep patterns
    const avgSleepHours = _.meanBy(profiles, 'sleepHours');
    if (avgSleepHours < 6) {
      patterns.push('Sleep deficit');
    } else if (avgSleepHours > 8) {
      patterns.push('Good sleep habits');
    }
  
    // Stress patterns
    const stressLevels = _.countBy(profiles, 'stressLevel');
    const dominantStress = Object.entries(stressLevels)
      .reduce((a, b) => a[1] > b[1] ? a : b)[0];
    patterns.push(`Predominantly ${dominantStress.toLowerCase()} stress`);
  
    return patterns;
  }
  
  function generateRecommendations(profile, similarProfiles) {
    const recommendations = [];
  
    // Work-life balance recommendations
    if (profile.workHours > 50) {
      recommendations.push({
        category: 'work',
        title: 'Consider work hour reduction',
        description: 'Long work hours correlate with higher stress levels',
        action: 'Try to limit overtime and set clear boundaries'
      });
    }
  
    // Sleep recommendations
    if (profile.sleepHours < 7) {
      recommendations.push({
        category: 'sleep',
        title: 'Improve sleep duration',
        description: 'Increased sleep is linked to better mental health outcomes',
        action: 'Aim for 7-9 hours of sleep per night'
      });
    }
  
    // Stress management
    if (profile.stressLevel === 'High') {
      const lowStressProfiles = similarProfiles.filter(p => p.stressLevel === 'Low');
      if (lowStressProfiles.length > 0) {
        const avgActivity = _.meanBy(lowStressProfiles, 'physicalActivity');
        recommendations.push({
          category: 'stress',
          title: 'Learn from low-stress peers',
          description: `Similar profiles with lower stress average ${avgActivity.toFixed(1)} hours of weekly physical activity`,
          action: 'Consider increasing physical activity'
        });
      }
    }
  
    // Treatment access
    if (profile.mentalHealth === 'Yes' && !profile.consultation) {
      recommendations.push({
        category: 'treatment',
        title: 'Consider professional support',
        description: 'Many professionals benefit from counseling or therapy',
        action: 'Explore available mental health resources'
      });
    }
  
    return recommendations;
  }
  
  function identifyStrengths(profile) {
    const strengths = [];
    
    if (profile.worklifeScore.work > 0.7) {
      strengths.push('Balanced work hours');
    }
    
    if (profile.worklifeScore.sleep > 0.7) {
      strengths.push('Healthy sleep pattern');
    }
    
    if (profile.worklifeScore.activity > 0.7) {
      strengths.push('Active lifestyle');
    }
  
    if (profile.stressMetrics.score < 0.4) {
      strengths.push('Good stress management');
    }
  
    return strengths;
  }
  
  function identifyChallenges(profile) {
    const challenges = [];
    
    if (profile.worklifeScore.work < 0.4) {
      challenges.push('Work hour management');
    }
    
    if (profile.worklifeScore.sleep < 0.4) {
      challenges.push('Sleep quality');
    }
    
    if (profile.worklifeScore.activity < 0.4) {
      challenges.push('Physical activity');
    }
  
    if (profile.stressMetrics.score > 0.7) {
      challenges.push('Stress management');
    }
  
    return challenges;
  }
  
  // Export utility functions for component use
  export const utils = {
    calculateWorklifeScore,
    calculateStressMetrics,
    calculateTreatmentAccess,
    determineCluster,
    findSimilarProfiles,
    generateInsights
  };