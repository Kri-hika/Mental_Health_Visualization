// src/lib/utils/dataProcessing.js
import _ from 'lodash';

export function processData(rawData) {
  // Clean and transform the data
  const cleanData = rawData
    .filter(d => (
      d.Age && 
      d.Work_Hours && 
      d.Sleep_Hours && 
      d.Stress_Level && 
      !isNaN(d.Age) && 
      !isNaN(d.Work_Hours) && 
      !isNaN(d.Sleep_Hours)
    ))
    .map(d => ({
      id: d.User_ID,
      age: +d.Age,
      gender: d.Gender,
      occupation: d.Occupation,
      country: d.Country,
      mentalHealth: d.Mental_Health_Condition,
      severity: d.Severity,
      consultation: d.Consultation_History,
      stressLevel: d.Stress_Level,
      sleepHours: +d.Sleep_Hours,
      workHours: +d.Work_Hours,
      physicalActivity: +d.Physical_Activity_Hours,
      tribe: calculateTribe(d)
    }));

  return {
    fullData: cleanData,
    clusteredData: generateClusters(cleanData),
    aggregatedData: aggregateByOccupation(cleanData)
  };
}

function calculateTribe(person) {
  // Age grouping
  const ageGroup = person.Age < 30 ? 'Young' :
                  person.Age < 50 ? 'Mid-Career' : 
                  'Senior';
                  
  // Sleep pattern
  const sleepPattern = person.Sleep_Hours < 6 ? 'Irregular' :
                      person.Sleep_Hours > 8 ? 'Long' :
                      'Normal';
                      
  // Work intensity
  const workIntensity = person.Work_Hours < 35 ? 'Part-Time' :
                       person.Work_Hours > 50 ? 'High-Intensity' :
                       'Standard';

  return `${ageGroup}/${sleepPattern}/${workIntensity}`;
}

function generateClusters(data) {
  // Group data by tribes
  const tribes = _.groupBy(data, 'tribe');
  
  // Calculate statistics for each tribe
  return Object.entries(tribes).map(([tribeName, members]) => ({
    name: tribeName,
    members,
    count: members.length,
    mentalHealthRate: members.filter(m => m.mentalHealth === 'Yes').length / members.length,
    averageStats: {
      age: _.meanBy(members, 'age'),
      sleepHours: _.meanBy(members, 'sleepHours'),
      workHours: _.meanBy(members, 'workHours')
    },
    stressDistribution: _.countBy(members, 'stressLevel')
  }));
}

export function aggregateByOccupation(data) {
  const grouped = _.groupBy(data, 'occupation');
  
  return Object.entries(grouped).map(([occupation, group]) => ({
    occupation,
    count: group.length,
    averageWorkHours: _.meanBy(group, 'workHours'),
    averageSleepHours: _.meanBy(group, 'sleepHours'),
    mentalHealthPercentage: (group.filter(d => d.mentalHealth === 'Yes').length / group.length) * 100,
    stressDistribution: _.countBy(group, 'stressLevel'),
    tribes: _.countBy(group, 'tribe')
  }));
}

export function findSimilarProfiles(data, userProfile) {
  const userTribe = calculateTribe(userProfile);
  
  // Find others in the same tribe
  const tribeMembers = data.filter(d => d.tribe === userTribe);
  
  // Calculate similarity scores
  const similarProfiles = tribeMembers.map(member => ({
    ...member,
    similarityScore: calculateSimilarity(userProfile, member)
  }));
  
  // Return top 10 most similar profiles
  return _.orderBy(similarProfiles, ['similarityScore'], ['desc']).slice(0, 10);
}

function calculateSimilarity(user, other) {
  // Normalize and weight different factors
  const ageDiff = Math.abs(user.age - other.age) / 50;  // Normalize by max age difference
  const sleepDiff = Math.abs(user.sleepHours - other.sleepHours) / 12;  // Normalize by 24 hours
  const workDiff = Math.abs(user.workHours - other.workHours) / 40;  // Normalize by standard work week
  const stressMatch = user.stressLevel === other.stressLevel ? 1 : 0;
  
  // Weighted sum (adjust weights as needed)
  return (
    (1 - ageDiff) * 0.3 +
    (1 - sleepDiff) * 0.25 +
    (1 - workDiff) * 0.25 +
    stressMatch * 0.2
  );
}


