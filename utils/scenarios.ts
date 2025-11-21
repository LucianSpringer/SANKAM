
import { Scenario } from '../types';

// --- Data Structures for Context-Aware Generation ---

interface RoleDef {
  id: string;
  text: string;
  emoji: string;
}

interface ObjectiveDef {
  id: string;
  text: string;
  difficulty: number; // 1: Beginner, 2: Intermediate, 3: Advanced
  keywords: string[]; // Vocabulary required to win
  aiBehavior: string; // Specific instruction for AI personality
}

interface ContextDef {
  id: string;
  locationName: string;
  description: string;
  allowedRoles: RoleDef[];
  possibleObjectives: ObjectiveDef[];
}

// --- The Relational Database ---

const CONTEXT_DB: ContextDef[] = [
  {
    id: 'general',
    locationName: 'General Conversation',
    description: 'A relaxed chat about everyday topics without a specific mission.',
    allowedRoles: [
      { id: 'friend', text: 'Friendly Local', emoji: '👋' },
      { id: 'partner', text: 'Language Partner', emoji: '🗣️' }
    ],
    possibleObjectives: [
      { 
        id: 'daily_life', 
        text: 'Talk about daily routine', 
        difficulty: 1, 
        keywords: ['Morning', 'Work', 'School', 'Time'],
        aiBehavior: 'Ask about their day and share simple details about yours. Keep it casual.'
      },
       { 
        id: 'interests', 
        text: 'Discuss shared interests', 
        difficulty: 2, 
        keywords: ['Like', 'Hobby', 'Fun', 'Why'],
        aiBehavior: 'Find out what the user likes and ask enthusiastic follow-up questions.'
      },
      { 
        id: 'freestyle', 
        text: 'Chat freely about anything', 
        difficulty: 1, 
        keywords: [],
        aiBehavior: 'Be friendly, open, and follow the user\'s lead. Ask open-ended questions.'
      }
    ]
  },
  {
    id: 'cafe',
    locationName: 'City Coffee Shop',
    description: 'A busy, noisy hipster cafe in the city center.',
    allowedRoles: [
      { id: 'barista', text: 'Barista', emoji: '☕' },
      { id: 'manager', text: 'Cafe Manager', emoji: '📋' },
      { id: 'customer', text: 'Impatient Customer', emoji: '⌚' }
    ],
    possibleObjectives: [
      { 
        id: 'order_drink', 
        text: 'Order a specific customized drink', 
        difficulty: 1, 
        keywords: ['Large', 'Milk', 'Sugar', 'Please'],
        aiBehavior: 'You are busy and speaking fast. Ask for specific details (size, milk type).'
      },
      { 
        id: 'wifi_issue', 
        text: 'Ask why the WiFi is not working', 
        difficulty: 2, 
        keywords: ['Connection', 'Password', 'Slow', 'Network'],
        aiBehavior: 'Apologize but explain the policy requires a purchase first.'
      },
      { 
        id: 'wrong_order', 
        text: 'Complain that you received the wrong item', 
        difficulty: 2, 
        keywords: ['Mistake', 'Ordered', 'Receipt', 'Change'],
        aiBehavior: 'Be slightly defensive at first, then offer a replacement if they are polite.'
      }
    ]
  },
  {
    id: 'hospital',
    locationName: 'Hospital ER Reception',
    description: 'A sterile, white waiting room in a hospital.',
    allowedRoles: [
      { id: 'nurse', text: 'Triage Nurse', emoji: '🩺' },
      { id: 'receptionist', text: 'Front Desk Clerk', emoji: '🏥' },
      { id: 'doctor', text: 'Rushing Doctor', emoji: '🥼' }
    ],
    possibleObjectives: [
      { 
        id: 'check_in', 
        text: 'Check in for an appointment', 
        difficulty: 1, 
        keywords: ['Appointment', 'Name', 'Time', 'ID'],
        aiBehavior: 'Ask for their ID card and insurance information politely.'
      },
      { 
        id: 'symptoms', 
        text: 'Describe a sudden illness', 
        difficulty: 2, 
        keywords: ['Pain', 'Fever', 'Since', 'Hurt'],
        aiBehavior: 'Act concerned. Ask 3 diagnostic questions (Where does it hurt? How long?).'
      },
      { 
        id: 'bill_dispute', 
        text: 'Argue about an expensive bill', 
        difficulty: 3, 
        keywords: ['Expensive', 'Insurance', 'Mistake', 'Pay'],
        aiBehavior: 'Be bureaucratic and strict. Refer to hospital policy. Do not give in easily.'
      }
    ]
  },
  {
    id: 'taxi',
    locationName: 'Inside a Moving Taxi',
    description: 'The back seat of a taxi stuck in traffic.',
    allowedRoles: [
      { id: 'driver', text: 'Chatty Driver', emoji: '🚕' },
      { id: 'driver_angry', text: 'Grumpy Driver', emoji: '😤' }
    ],
    possibleObjectives: [
      { 
        id: 'directions', 
        text: 'Give directions to a specific landmark', 
        difficulty: 1, 
        keywords: ['Left', 'Right', 'Straight', 'Stop'],
        aiBehavior: 'Pretend to not know the area well. Ask for clarification on every turn.'
      },
      { 
        id: 'small_talk', 
        text: 'Make small talk about the city', 
        difficulty: 2, 
        keywords: ['Weather', 'Traffic', 'Food', 'From'],
        aiBehavior: 'Be very friendly and ask personal questions about where the user is from.'
      },
      { 
        id: 'payment_method', 
        text: 'Negotiate paying with credit card when the machine is broken', 
        difficulty: 3, 
        keywords: ['Cash', 'Card', 'Machine', 'ATM'],
        aiBehavior: 'Insist on cash. Claim the machine is broken. Be annoyed.'
      }
    ]
  },
  {
    id: 'market',
    locationName: 'Open Air Flea Market',
    description: 'A crowded market with many stalls selling goods.',
    allowedRoles: [
      { id: 'vendor', text: 'Antique Seller', emoji: '🏺' },
      { id: 'farmer', text: 'Fruit Seller', emoji: '🍎' }
    ],
    possibleObjectives: [
      { 
        id: 'price', 
        text: 'Ask for the price of an item', 
        difficulty: 1, 
        keywords: ['How much', 'Cost', 'Expensive', 'Cheap'],
        aiBehavior: 'Start with a very high price. Act offended if they offer too low.'
      },
      { 
        id: 'haggling', 
        text: 'Negotiate a 50% discount', 
        difficulty: 3, 
        keywords: ['Lower', 'Deal', 'Offer', 'Discount'],
        aiBehavior: 'Refuse the first two offers. Make a counter-offer. Only agree if they are persistent.'
      }
    ]
  }
];

// --- Procedural Generator Engine ---

class ScenarioGenerator {
  
  /**
   * Generates a Context-Aware Scenario.
   * 1. Selects a Context (Location).
   * 2. Selects a Role ALLOWED in that context.
   * 3. Selects an Objective POSSIBLE in that context (filtered by difficulty).
   */
  public generateScenario(level: 'Beginner' | 'Intermediate' | 'Advanced'): Scenario {
    // Filter out 'general' from random generation to keep it special/distinct if desired,
    // or keep it in the mix. For now, let's keep it in the mix but give it low weight? 
    // Actually, pure random is fine.
    const context = this.pickRandom(CONTEXT_DB);
    return this.buildScenarioFromContext(context, level);
  }

  /**
   * specifically generates a General/Free Talk scenario.
   */
  public generateGeneralScenario(level: 'Beginner' | 'Intermediate' | 'Advanced'): Scenario {
    const context = CONTEXT_DB.find(c => c.id === 'general');
    if (!context) return this.generateScenario(level); // Fallback
    return this.buildScenarioFromContext(context, level);
  }

  public generateBatch(count: number, level: 'Beginner' | 'Intermediate' | 'Advanced'): Scenario[] {
    const batch: Scenario[] = [];
    for (let i = 0; i < count; i++) {
      // We filter out 'general' from the random batch so it doesn't duplicate the static card
      // that we will likely show in the UI.
      const nonGeneralContexts = CONTEXT_DB.filter(c => c.id !== 'general');
      const context = this.pickRandom(nonGeneralContexts);
      batch.push(this.buildScenarioFromContext(context, level));
    }
    return batch;
  }

  private buildScenarioFromContext(context: ContextDef, level: 'Beginner' | 'Intermediate' | 'Advanced'): Scenario {
    const levelScore = level === 'Beginner' ? 1 : level === 'Intermediate' ? 2 : 3;
    const role = this.pickRandom(context.allowedRoles);

    let validObjectives = context.possibleObjectives.filter(o => Math.abs(o.difficulty - levelScore) <= 1);
    if (validObjectives.length === 0) validObjectives = context.possibleObjectives;
    
    const objective = this.pickRandom(validObjectives);

    const name = context.id === 'general' ? 'Free Talk' : `${role.text} at ${context.locationName}`;
    const description = `Location: ${context.description}\nSituation: You are speaking to a ${role.text}. Your goal is to ${objective.text.toLowerCase()}.`;
    
    const objectives = this.generateWinningConditions(objective, level);

    const aiSecretGoal = `
      ROLEPLAY INSTRUCTION: You are a ${role.text} at ${context.locationName}.
      CONTEXT: ${context.description}
      USER GOAL: The user is trying to ${objective.text}.
      
      YOUR BEHAVIOR: ${objective.aiBehavior}
      
      Depending on user level (${level}), adjust your vocabulary complexity.
      If the user achieves the goal "${objective.text}", congratulate them and end the interaction naturally.
    `;

    return {
      id: `scen-${context.id}-${role.id}-${Date.now()}`,
      name,
      description,
      emoji: role.emoji,
      role: role.text,
      difficulty: level,
      objectives,
      aiSecretGoal
    };
  }

  private pickRandom<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  private generateWinningConditions(objective: ObjectiveDef, level: string): string[] {
    const conditions: string[] = [];

    // 1. The Primary Goal
    conditions.push(`Goal: ${objective.text}`);

    // 2. Vocabulary Challenge (from keywords)
    if (objective.keywords.length > 0) {
      const keywordsToShow = objective.keywords.slice(0, 3).join(', ');
      conditions.push(`Vocabulary: Use words like "${keywordsToShow}"`);
    }

    // 3. Level-Specific Constraint
    if (level === 'Beginner') {
      conditions.push('Constraint: Use polite greetings (Hello, Please)');
    } else if (level === 'Intermediate') {
      conditions.push('Constraint: Speak in full sentences');
    } else {
      conditions.push('Constraint: Use complex sentence structures');
    }

    return conditions;
  }
}

export const scenarioGenerator = new ScenarioGenerator();
export const DEFAULT_SCENARIO = scenarioGenerator.generateGeneralScenario('Beginner');
