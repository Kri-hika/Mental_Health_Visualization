export function calculateStats(data) {
    const totalCount = data.length;
    const withCondition = data.filter(d => d.Mental_Health_Condition === 'Yes').length;
    
    return {
      totalCount,
      withCondition,
      percentage: (withCondition / totalCount) * 100,
      avgWorkHours: d3.mean(data, d => d.Work_Hours),
      avgSleepHours: d3.mean(data, d => d.Sleep_Hours)
    };
  }