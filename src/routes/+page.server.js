// src/routes/+page.server.js
import { promises as fs } from 'fs';
import path from 'path';
import { processData } from '$lib/utils/dataProcessing';

export async function load() {
  try {
    const cwd = process.cwd();
    const mentalHealthPath = path.join(cwd, 'static', 'data', 'mental_health_dataset.csv');
    const treatmentPath = path.join(cwd, 'static', 'data', 'Mental_Health_Care_in_the_Last_4_Weeks.csv');

    const [mentalHealthData, weeklyTreatmentData] = await Promise.all([
      fs.readFile(mentalHealthPath, 'utf-8'),
      fs.readFile(treatmentPath, 'utf-8')
    ]);

    // Parse mental health dataset
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
          User_ID,
          Age: +Age,
          Gender,
          Occupation,
          Country,
          Mental_Health_Condition,
          Severity,
          Consultation_History,
          Stress_Level,
          Sleep_Hours: +Sleep_Hours,
          Work_Hours: +Work_Hours,
          Physical_Activity_Hours: +Physical_Activity_Hours
        };
      });

    // Process and structure the data
    const processedData = processData(parsedMentalHealth);

    // Parse treatment dataset
    const parsedTreatment = weeklyTreatmentData
      .trim()
      .split('\n')
      .slice(1)
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

    return {
      // Original data structure for backward compatibility
      data: processedData.fullData,
      
      // Enhanced data structures
      clusters: processedData.clusteredData,
      occupationStats: processedData.aggregatedData,
      treatmentData: parsedTreatment,
      
      // Metadata
      dataStats: {
        totalParticipants: processedData.fullData.length,
        totalTribes: processedData.clusteredData.length,
        dateProcessed: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('Error loading data:', error);
    return {
      data: [],
      clusters: [],
      occupationStats: [],
      treatmentData: [],
      error: {
        message: `Failed to load data: ${error.message}`,
        code: error.code || 'UNKNOWN',
        path: error.path || 'unknown'
      }
    };
  }
}