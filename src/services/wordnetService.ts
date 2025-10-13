import type { GraphData } from '@/types/wordnet'

// Mock data service - Replace with real API calls later
export const mockGraphData: GraphData = {
  nodes: [
    {
      data: {
        id: 'dog',
        label: 'dog',
        pos: 'noun',
        definition: '驯养的食肉哺乳动物',
        examples: ['The dog barked loudly.', 'She walked her dog in the park.'],
      },
    },
    {
      data: {
        id: 'canine',
        label: 'canine',
        pos: 'noun',
        definition: '犬科动物',
        examples: ['Wolves are canines.'],
      },
    },
    {
      data: {
        id: 'animal',
        label: 'animal',
        pos: 'noun',
        definition: '动物',
        examples: ['All dogs are animals.'],
      },
    },
    {
      data: {
        id: 'mammal',
        label: 'mammal',
        pos: 'noun',
        definition: '哺乳动物',
        examples: ['Mammals nurse their young.'],
      },
    },
    {
      data: {
        id: 'puppy',
        label: 'puppy',
        pos: 'noun',
        definition: '幼犬',
        examples: ['The puppy is so cute!'],
      },
    },
    {
      data: {
        id: 'hound',
        label: 'hound',
        pos: 'noun',
        definition: '猎犬',
        examples: ['The hound tracked the scent.'],
      },
    },
    {
      data: {
        id: 'bulldog',
        label: 'bulldog',
        pos: 'noun',
        definition: '斗牛犬',
        examples: ['Bulldogs have a distinctive appearance.'],
      },
    },
    {
      data: {
        id: 'tail',
        label: 'tail',
        pos: 'noun',
        definition: '尾巴',
        examples: ['The dog wagged its tail.'],
      },
    },
    {
      data: {
        id: 'paw',
        label: 'paw',
        pos: 'noun',
        definition: '爪子',
        examples: ['The dog hurt its paw.'],
      },
    },
    {
      data: {
        id: 'cat',
        label: 'cat',
        pos: 'noun',
        definition: '猫',
        examples: ['The cat meowed.'],
      },
    },
  ],
  edges: [
    { data: { source: 'dog', target: 'canine', relation: 'hypernym' } },
    { data: { source: 'canine', target: 'mammal', relation: 'hypernym' } },
    { data: { source: 'mammal', target: 'animal', relation: 'hypernym' } },
    { data: { source: 'dog', target: 'puppy', relation: 'hyponym' } },
    { data: { source: 'dog', target: 'hound', relation: 'hyponym' } },
    { data: { source: 'dog', target: 'bulldog', relation: 'hyponym' } },
    { data: { source: 'dog', target: 'tail', relation: 'meronym' } },
    { data: { source: 'dog', target: 'paw', relation: 'meronym' } },
    { data: { source: 'cat', target: 'mammal', relation: 'hypernym' } },
  ],
}

export class WordNetService {
  // Simulates API call with delay
  static async fetchWordGraph(_word: string): Promise<GraphData> {
    return new Promise((resolve) => {
      setTimeout(() => {
        // In a real app, this would make an API call
        // For now, return mock data
        resolve(mockGraphData)
      }, 500)
    })
  }

  // Future: Add more API methods
  // static async searchWords(query: string): Promise<string[]>
  // static async getWordDetails(wordId: string): Promise<WordNode>
}
