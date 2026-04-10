export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  lastLoginAt: string;
}

export interface AppSettings {
  id: string;
  appName: string;
  appLogoUrl?: string;
  globalSponsors: Sponsor[];
}

export interface Tournament {
  id: string;
  name: string;
  description: string;
  type: 'league' | 'knockout' | 'group_stage';
  status: 'draft' | 'active' | 'completed';
  organizerId: string;
  createdAt: string;
  startDate?: string;
  endDate?: string;
  logoUrl?: string;
  sponsors?: Sponsor[];
}

export interface Sponsor {
  id: string;
  name: string;
  logoUrl: string;
  link?: string;
  tier: 'gold' | 'silver' | 'bronze';
}

export interface Team {
  id: string;
  name: string;
  logoUrl?: string;
  tournamentId: string;
  points: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
}

export interface Player {
  id: string;
  name: string;
  lastName: string;
  cedula: string;
  nationality: string;
  birthDate: string;
  jerseyNumber: string;
  teamId: string;
  tournamentId: string;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  photoUrl?: string;
  videoUrl?: string;
  position: string;
  metrics?: {
    pace?: number;
    shooting?: number;
    passing?: number;
    dribbling?: number;
    defending?: number;
    physical?: number;
  };
}

export interface Match {
  id: string;
  tournamentId: string;
  homeTeamId: string;
  awayTeamId: string;
  homeScore?: number;
  awayScore?: number;
  status: 'scheduled' | 'live' | 'finished';
  date: string;
  round: number;
  events?: MatchEvent[];
}

export interface MatchEvent {
  id: string;
  type: 'goal' | 'yellow' | 'red' | 'sub';
  minute: number;
  playerId: string;
  teamId: string;
}
