import { groupBy, meanBy } from 'lodash';

export function aggregateByOccupation(data) {
  const grouped = groupBy(data, 'Occupation');
  return Object.entries(grouped).map(([occupation, group]) => ({
    occupation,
    count: group.length,
    averageWorkHours: meanBy(group, 'Work_Hours'),
    averageSleepHours: meanBy(group, 'Sleep_Hours'),
    mentalHealthPercentage: (group.filter(d => d.Mental_Health_Condition === 'Yes').length / group.length) * 100
  }));
}

export function findSimilarProfiles(data, profile, tolerance = {
  age: 5,
  workHours: 10
}) {
  return data.filter(d => 
    Math.abs(d.Age - profile.age) <= tolerance.age &&
    Math.abs(d.Work_Hours - profile.workHours) <= tolerance.workHours &&
    d.Occupation === profile.occupation
  );
}

export function calculateCorrelations(data) {
  const workHours = data.map(d => d.Work_Hours);
  const sleepHours = data.map(d => d.Sleep_Hours);
  const stressLevels = data.map(d => d.Stress_Level === 'High' ? 3 : d.Stress_Level === 'Medium' ? 2 : 1);
  
  return {
    workSleep: calculateCorrelation(workHours, sleepHours),
    workStress: calculateCorrelation(workHours, stressLevels),
    sleepStress: calculateCorrelation(sleepHours, stressLevels)
  };
}

function calculateCorrelation(x, y) {
  const n = x.length;
  const sum1 = x.reduce((a, b) => a + b) * y.reduce((a, b) => a + b);
  const sum2 = x.reduce((a, b) => a + b * b) * y.reduce((a, b) => a + b * b);
  const sum3 = x.map((_, i) => x[i] * y[i]).reduce((a, b) => a + b);
  return (n * sum3 - sum1) / Math.sqrt((n * sum2 - sum1 * sum1));
}