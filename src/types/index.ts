export interface User {
  id: string;
  name: string;
  color: string;
  joinedAt: number;
}

export interface Message {
  id: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: number;
}

export interface Connection {
  source: string;
  target: string;
  strength: number; // 0-1
  topics: string[];
}

export interface BridgeSuggestion {
  id: string;
  users: string[];
  topic: string;
  suggestion: string;
  timestamp: number;
}

export interface InclusionAlert {
  id: string;
  userId: string;
  userName: string;
  type: 'quiet' | 'excluded' | 'dominant';
  message: string;
  timestamp: number;
}

export interface RoomState {
  users: User[];
  messages: Message[];
  connections: Connection[];
  suggestions: BridgeSuggestion[];
  alerts: InclusionAlert[];
  vibeScore: number; // 0-100
}

export interface PlanPlace {
  name: string;
  lat: number;
  lon: number;
  street: string | null;
  distanceMi: number;
}

export interface Plan {
  suggestionId: string;
  place: PlanPlace;
  line: string;
  source: 'osm' | 'curated';
}

export interface AnalysisResult {
  connections: Connection[];
  suggestions: BridgeSuggestion[];
  alerts: InclusionAlert[];
  vibeScore: number;
  insights: string[];
}
