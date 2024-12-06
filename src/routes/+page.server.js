// src/routes/+page.server.js
import { promises as fs } from 'fs';
import path from 'path';

export async function load() {
  try {
    const cwd = process.cwd();
    const mentalHealthPath = path.join(cwd, 'static', 'data', 'mental_health_dataset.csv');
    const treatmentPath = path.join(cwd, 'static', 'data', 'Mental_Health_Care_in_the_Last_4_Weeks.csv');

    const [mentalHealthData, weeklyTreatmentData] = await Promise.all([
      fs.readFile(mentalHealthPath, 'utf-8'),
      fs.readFile(treatmentPath, 'utf-8')
    ]);

    // Parse mental health dataset for visualization
    const parsedMentalHealth = mentalHealthData
      .trim()
      .split('\n')
      .slice(1) // Remove header
      .map(line => {
        const [
          User_ID, Age, Gender, Occupation, Country,
          Mental_Health_Condition, Severity, Consultation_History,
          Stress_Level, Sleep_Hours, Work_Hours, Physical_Activity_Hours
        ] = line.split(',');

        return {
          id: User_ID,
          age: +Age,
          gender: Gender,
          occupation: Occupation,
          country: Country,
          mentalHealth: Mental_Health_Condition,
          severity: Severity,
          consultation: Consultation_History,
          stressLevel: Stress_Level,
          sleepHours: +Sleep_Hours,
          workHours: +Work_Hours,
          physicalActivity: +Physical_Activity_Hours
        };
      });

    // Parse treatment dataset
    const parsedTreatment = weeklyTreatmentData
      .trim()
      .split('\n')
      .slice(1) // Remove header
      .map(line => {
        const parts = line.split(',');
        return {
          indicator: parts[0].replace(/"/g, ''),
          group: parts[1],
          state: parts[2],
          timePeriod: parts[7],
          value: +parts[9],
          lowCI: +parts[10],
          highCI: +parts[11]
        };
      });

    // Filter out any invalid entries
    const cleanMentalHealthData = parsedMentalHealth.filter(d => 
      d.occupation && 
      d.mentalHealth && 
      !isNaN(d.workHours) && 
      !isNaN(d.sleepHours)
    );

    return {
      data: cleanMentalHealthData,  // This maintains compatibility with existing visualization
      mentalHealthData: cleanMentalHealthData,  // Full mental health dataset
      treatmentData: parsedTreatment  // Treatment dataset for future use
    };
  } catch (error) {
    console.error('Error loading data:', error);
    return {
      data: [],
      mentalHealthData: [],
      treatmentData: [],
      error: {
        message: `Failed to load data: ${error.message}`,
        code: error.code || 'UNKNOWN',
        path: error.path || 'unknown'
      }
    };
  }
}