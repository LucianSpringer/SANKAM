import { Scenario } from '../types';

export const SCENARIOS: Scenario[] = [
  {
    id: 'free-chat',
    name: 'Just Chatting',
    description: 'Casual conversation practice about any topic you like.',
    emoji: '💬',
    role: 'Friendly Tutor',
    difficulty: 'All Levels'
  },
  {
    id: 'coffee-shop',
    name: 'Morning Coffee',
    description: 'Order a drink and a snack at a busy cafe in the city.',
    emoji: '☕',
    role: 'Barista',
    difficulty: 'Beginner'
  },
  {
    id: 'taxi-directions',
    name: 'Taxi Directions',
    description: 'Guide a taxi driver to your specific destination.',
    emoji: '🚕',
    role: 'Taxi Driver',
    difficulty: 'Intermediate'
  },
  {
    id: 'job-interview',
    name: 'Job Interview',
    description: 'Answer common interview questions for a role.',
    emoji: '💼',
    role: 'Hiring Manager',
    difficulty: 'Advanced'
  },
  {
    id: 'restaurant-reservation',
    name: 'Dinner Reservation',
    description: 'Call a restaurant to book a table for a group.',
    emoji: '🍽️',
    role: 'Restaurant Host',
    difficulty: 'Beginner'
  },
  {
    id: 'market-bargaining',
    name: 'Market Bargaining',
    description: 'Negotiate the price of a souvenir at a flea market.',
    emoji: '🏷️',
    role: 'Market Vendor',
    difficulty: 'Intermediate'
  },
  {
    id: 'doctor-visit',
    name: 'Doctor Visit',
    description: 'Describe your symptoms to a doctor during a check-up.',
    emoji: '🩺',
    role: 'Doctor',
    difficulty: 'Intermediate'
  },
  {
    id: 'tech-support',
    name: 'Tech Support',
    description: 'Explain a problem with your internet connection.',
    emoji: '🎧',
    role: 'Support Agent',
    difficulty: 'Advanced'
  }
];