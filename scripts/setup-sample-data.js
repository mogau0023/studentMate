// Firebase Admin SDK setup script
// Run this script to populate your Firestore database with sample data

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// You'll need to download your service account key from Firebase Console
// Go to Project Settings > Service Accounts > Generate new private key
const serviceAccount = require('./path-to-your-service-account-key.json');

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function setupSampleData() {
  try {
    // Categories
    const categories = [
      { id: 'march_tests', name: 'march_tests', display_name: 'March Tests', sort_order: 1 },
      { id: 'june_exams', name: 'june_exams', display_name: 'June Exams', sort_order: 2 },
      { id: 'preliminary_exams', name: 'preliminary_exams', display_name: 'Preliminary Exams', sort_order: 3 },
      { id: 'november_exams', name: 'november_exams', display_name: 'November Exams', sort_order: 4 },
      { id: 'practice_problems', name: 'practice_problems', display_name: 'Practice Problems', sort_order: 5 },
      { id: 'quiz_tests', name: 'quiz_tests', display_name: 'Quiz Tests', sort_order: 6 },
      { id: 'activities', name: 'activities', display_name: 'Activities', sort_order: 7 },
      { id: 'notes', name: 'notes', display_name: 'Notes', sort_order: 8 },
    ];

    for (const category of categories) {
      await db.collection('categories').doc(category.id).set(category);
    }
    console.log('Categories added successfully');

    // Sample Papers
    const papers = [
      {
        id: 'paper_2025_march_ec',
        category_id: 'march_tests',
        year: '2025',
        title: 'March Test (EC)',
        is_locked: true,
        total_marks: 100,
        created_at: new Date()
      },
      {
        id: 'paper_2024_june_exam',
        category_id: 'june_exams',
        year: '2024',
        title: 'June Exam',
        is_locked: false,
        total_marks: 150,
        created_at: new Date()
      },
      {
        id: 'paper_2023_march_kzn',
        category_id: 'march_tests',
        year: '2023',
        title: 'March Test (KZN)',
        is_locked: false,
        total_marks: 100,
        created_at: new Date()
      }
    ];

    for (const paper of papers) {
      await db.collection('papers').doc(paper.id).set(paper);
    }
    console.log('Papers added successfully');

    // Sample Questions
    const questions = [
      {
        id: 'question_1_1_1',
        paper_id: 'paper_2025_march_ec',
        question_number: '1.1.1',
        content: 'x² − 7x + 10 = 0',
        marks: 2,
        sort_order: 1
      },
      {
        id: 'question_1_1_2',
        paper_id: 'paper_2025_march_ec',
        question_number: '1.1.2',
        content: '3x² + 2x + 6 = 10 (correct to two decimal places)',
        marks: 4,
        sort_order: 2
      },
      {
        id: 'question_1_1_3',
        paper_id: 'paper_2025_march_ec',
        question_number: '1.1.3',
        content: 'x³ + 3x² − 28 = 0',
        marks: 4,
        sort_order: 3
      },
      {
        id: 'question_2_1_1',
        paper_id: 'paper_2024_june_exam',
        question_number: '2.1.1',
        content: 'Consider the sequence: 1; 4; 11; 22; 37; ... Calculate the nᵗʰ term.',
        marks: 4,
        sort_order: 1
      }
    ];

    for (const question of questions) {
      await db.collection('questions').doc(question.id).set(question);
    }
    console.log('Questions added successfully');

    // Sample Answers
    const answers = [
      {
        id: 'answer_1_1_1',
        question_id: 'question_1_1_1',
        content: 'Using the quadratic formula:\n\nx = (7 ± √(49 - 40)) / 2\nx = (7 ± √9) / 2\nx = (7 ± 3) / 2\n\nTherefore: x = 5 or x = 2',
        step_number: 1
      },
      {
        id: 'answer_1_1_2',
        question_id: 'question_1_1_2',
        content: 'Rearranging: 3x² + 2x - 4 = 0\n\nUsing quadratic formula:\nx = (-2 ± √(4 + 48)) / 6\nx = (-2 ± √52) / 6\nx = (-2 ± 7.21) / 6\n\nx = 0.87 or x = -1.54 (to 2 decimal places)',
        step_number: 1
      }
    ];

    for (const answer of answers) {
      await db.collection('answers').doc(answer.id).set(answer);
    }
    console.log('Answers added successfully');

    console.log('Sample data setup completed successfully!');

  } catch (error) {
    console.error('Error setting up sample data:', error);
  }
}

// Run the setup
setupSampleData();