
export type PetType = 'dog' | 'cat' | 'fish' | 'parrot';

export interface ClusterMetrics {
  health: number; // 0-100 (based on healthy pods)
  podsTotal: number;
  podsHealthy: number;
  rps: number; // Requests per second
  latency: number; // ms
  mood: number; // 0-100 (based on latency/rps stability)
  cpuUsage: number; // %
  memUsage: number; // %
  hunger: number; // 0-100 (based on resource saturation)
  cost: number; // Daily $ cost
  weight: number; // 0-100 (based on infrastructure size/cost)
}

export interface PetStatus {
  name: string;
  type: PetType;
  moodLabel: string;
  comment: string;
  level: number;
  xp: number;
}
