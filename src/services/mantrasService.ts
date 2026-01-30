import type { Mantra } from '@/types';

// Curated collection of daily mantras - short, inspirational phrases
const MANTRAS: Mantra[] = [
  { id: 'm1', text: 'I am capable of achieving great things.' },
  { id: 'm2', text: 'Today I choose joy.' },
  { id: 'm3', text: 'I am enough, just as I am.' },
  { id: 'm4', text: 'My potential is limitless.' },
  { id: 'm5', text: 'I embrace the journey, not just the destination.' },
  { id: 'm6', text: 'I am the architect of my life.' },
  { id: 'm7', text: 'Every day is a fresh start.' },
  { id: 'm8', text: 'I radiate positivity and confidence.' },
  { id: 'm9', text: 'I am worthy of success and happiness.' },
  { id: 'm10', text: 'I trust the process of life.' },
  { id: 'm11', text: 'My thoughts create my reality.' },
  { id: 'm12', text: 'I am resilient and can overcome anything.' },
  { id: 'm13', text: 'I attract abundance into my life.' },
  { id: 'm14', text: 'I am grateful for this moment.' },
  { id: 'm15', text: 'I release what no longer serves me.' },
  { id: 'm16', text: 'I am in charge of how I feel today.' },
  { id: 'm17', text: 'My voice matters and my ideas are valuable.' },
  { id: 'm18', text: 'I choose progress over perfection.' },
  { id: 'm19', text: 'I am surrounded by love and support.' },
  { id: 'm20', text: 'Today I will make a difference.' },
  { id: 'm21', text: 'I believe in my dreams and myself.' },
  { id: 'm22', text: 'I am open to new possibilities.' },
  { id: 'm23', text: 'My challenges help me grow stronger.' },
  { id: 'm24', text: 'I am at peace with who I am.' },
  { id: 'm25', text: 'I create my own opportunities.' },
  { id: 'm26', text: 'I deserve all the good things coming my way.' },
  { id: 'm27', text: 'I am becoming the best version of myself.' },
  { id: 'm28', text: 'My energy is contagious and inspiring.' },
  { id: 'm29', text: 'I focus on what I can control.' },
  { id: 'm30', text: 'I am brave, bold, and beautiful.' },
];

/**
 * Get today's mantra based on date, excluding hidden mantras
 */
export function getTodayMantra(hiddenIds: string[] = []): Mantra {
  const availableMantras = MANTRAS.filter(m => !hiddenIds.includes(m.id));

  // If all mantras are hidden, return from full list
  if (availableMantras.length === 0) {
    const today = new Date();
    const dayOfYear = Math.floor(
      (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000
    );
    const index = dayOfYear % MANTRAS.length;
    return MANTRAS[index];
  }

  const today = new Date();
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000
  );
  const index = dayOfYear % availableMantras.length;
  return availableMantras[index];
}

/**
 * Get a different random mantra, excluding current and hidden
 */
export function getNextMantra(currentId: string | null, hiddenIds: string[] = []): Mantra {
  const availableMantras = MANTRAS.filter(
    m => m.id !== currentId && !hiddenIds.includes(m.id)
  );

  // If no other mantras available, return current or any
  if (availableMantras.length === 0) {
    return MANTRAS.find(m => m.id === currentId) || MANTRAS[0];
  }

  const randomIndex = Math.floor(Math.random() * availableMantras.length);
  return availableMantras[randomIndex];
}

/**
 * Get a mantra by its ID
 */
export function getMantraById(id: string): Mantra | undefined {
  return MANTRAS.find(m => m.id === id);
}

/**
 * Get all mantras (for settings)
 */
export function getAllMantras(): Mantra[] {
  return [...MANTRAS];
}
