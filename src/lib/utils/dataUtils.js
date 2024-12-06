// dataUtils.js
import _ from 'lodash';

export const STRESS_COLORS = {
  Low: '#43E8D8',
  Medium: '#9D4EDD',
  High: '#FF6B9C'
};

export const WORK_LIFE_COLORS = {
  Balanced: '#43E8D8',
  Moderate: '#9D4EDD',
  Intense: '#FF6B9C'
};

export const TREATMENT_COLORS = {
  Treated: '#43E8D8',
  Untreated: '#FF6B9C',
  NoCondition: '#4FACFF'
};

export function processInitialData(data) {
  return data.map(d => ({
    id: d.User_ID,
    age: parseInt(d.Age),
    gender: d.Gender,
    occupation: d.Occupation,
    country: d.Country,
    mentalHealth: d.Mental_Health_Condition === 'Yes',
    severity: d.Severity,
    consultation: d.Consultation_History === 'Yes',
    stressLevel: d.Stress_Level,
    sleepHours: parseFloat(d.Sleep_Hours),
    workHours: parseFloat(d.Work_Hours),
    physicalActivity: parseFloat(d.Physical_Activity_Hours)
  }));
}

export function generateClusterInsights(data) {
  const clusters = _.groupBy(data, d => {
    const workLifeBalance = calculateWorkLifeBalance(d);
    return `${workLifeBalance}-${d.stressLevel}`;
  });

  return _.mapValues(clusters, (group) => ({
    count: group.length,
    avgAge: _.meanBy(group, 'age'),
    avgSleep: _.meanBy(group, 'sleepHours'),
    avgWork: _.meanBy(group, 'workHours'),
    mentalHealthRate: _.filter(group, 'mentalHealth').length / group.length,
    consultationRate: _.filter(group, 'consultation').length / group.length,
    occupations: _.countBy(group, 'occupation'),
    countries: _.countBy(group, 'country'),
    riskScore: calculateGroupRiskScore(group)
  }));
}

export function generateWorkLifeInsights(data) {
  const groups = _.groupBy(data, calculateWorkLifeBalance);
  
  return _.mapValues(groups, (group) => ({
    count: group.length,
    avgStressDistribution: _.countBy(group, 'stressLevel'),
    mentalHealthRate: _.filter(group, 'mentalHealth').length / group.length,
    avgSleepHours: _.meanBy(group, 'sleepHours'),
    avgWorkHours: _.meanBy(group, 'workHours'),
    avgPhysicalActivity: _.meanBy(group, 'physicalActivity'),
    workHoursDistribution: generateHourDistribution(group, 'workHours'),
    sleepHoursDistribution: generateHourDistribution(group, 'sleepHours')
  }));
}

export function generateTreatmentInsights(data) {
  const withCondition = _.filter(data, 'mentalHealth');
  const treated = _.filter(withCondition, 'consultation');
  const untreated = _.filter(withCondition, d => !d.consultation);

  return {
    overall: {
      total: data.length,
      withCondition: withCondition.length,
      treated: treated.length,
      untreated: untreated.length
    },
    byOccupation: _.mapValues(_.groupBy(withCondition, 'occupation'), group => ({
      total: group.length,
      treated: _.filter(group, 'consultation').length,
      highStress: _.filter(group, d => d.stressLevel === 'High').length,
      avgWorkHours: _.meanBy(group, 'workHours')
    })),
    byAge: generateAgeGroupInsights(withCondition),
    treatmentGaps: calculateTreatmentGaps(data)
  };
}

export function generateStressInsights(data) {
  const byLevel = _.groupBy(data, 'stressLevel');
  
  return _.mapValues(byLevel, (group) => ({
    count: group.length,
    avgSleep: _.meanBy(group, 'sleepHours'),
    avgWork: _.meanBy(group, 'workHours'),
    avgPhysicalActivity: _.meanBy(group, 'physicalActivity'),
    mentalHealthRate: _.filter(group, 'mentalHealth').length / group.length,
    consultationRate: _.filter(group, 'consultation').length / group.length,
    workDistribution: generateWorkDistribution(group),
    occupationDistribution: _.countBy(group, 'occupation')
  }));
}

function calculateWorkLifeBalance(d) {
  const sleepScore = Math.min(Math.abs(d.sleepHours - 8) / 4, 1);
  const workScore = Math.min(Math.abs(d.workHours - 40) / 20, 1);
  const activityScore = Math.min(d.physicalActivity / 10, 1);
  const totalScore = (sleepScore + workScore + activityScore) / 3;
  
  return totalScore < 0.4 ? 'Balanced' :
         totalScore < 0.7 ? 'Moderate' : 'Intense';
}

function calculateGroupRiskScore(group) {
  return {
    highStress: _.filter(group, d => d.stressLevel === 'High').length / group.length,
    poorSleep: _.filter(group, d => d.sleepHours < 6).length / group.length,
    overwork: _.filter(group, d => d.workHours > 50).length / group.length,
    untreatedConditions: _.filter(group, d => d.mentalHealth && !d.consultation).length / group.length
  };
}

function generateHourDistribution(group, field) {
  return _.groupBy(group, d => {
    const hours = d[field];
    return hours < 6 ? 'veryLow' :
           hours < 7 ? 'low' :
           hours < 9 ? 'normal' :
           hours < 10 ? 'high' : 'veryHigh';
  });
}

function generateWorkDistribution(group) {
  return {
    underworked: _.filter(group, d => d.workHours < 35).length,
    normal: _.filter(group, d => d.workHours >= 35 && d.workHours <= 45).length,
    overworked: _.filter(group, d => d.workHours > 45).length
  };
}

function generateAgeGroupInsights(data) {
  const ageGroups = _.groupBy(data, d => {
    const age = d.age;
    return age < 30 ? 'young' :
           age < 50 ? 'middleAge' : 'senior';
  });
  
  return _.mapValues(ageGroups, group => ({
    count: group.length,
    treated: _.filter(group, 'consultation').length,
    highStress: _.filter(group, d => d.stressLevel === 'High').length,
    avgWorkHours: _.meanBy(group, 'workHours')
  }));
}

function calculateTreatmentGaps(data) {
  const byCountry = _.groupBy(data, 'country');
  
  return _.mapValues(byCountry, group => {
    const withCondition = _.filter(group, 'mentalHealth').length;
    const treated = _.filter(group, d => d.mentalHealth && d.consultation).length;
    return {
      total: group.length,
      gap: withCondition - treated,
      gapRate: (withCondition - treated) / withCondition
    };
  });
}