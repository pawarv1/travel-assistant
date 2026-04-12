export enum EventType {
  TRANSPORT = "transport",
  LODGING = "lodging",
  ACTIVITY = "activity",
  FOOD = "food",
}

export interface TravelEvent {
  event_type: EventType;
  title: string;
  start_time: string;
  end_time: string;
  location: string;
  latitude: number;
  longitude: number;
  cost_usd: number;
  url: string;
  notes: string;
}

export interface DayPlan {
  day_number: number;
  date: string;
  summary: string;
  events: TravelEvent[];
}

export interface TravelItinerary {
  title: string;
  destination: string;
  origin: string;
  travelers: number;
  days: DayPlan[];
  general_tips: string[];
}
