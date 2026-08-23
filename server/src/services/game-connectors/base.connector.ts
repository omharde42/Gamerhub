export interface IGameConnector {
  gameKey: string;
  connect(userId: string, payload: Record<string, any>): Promise<any>;
  disconnect(userId: string): Promise<boolean>;
  validate(payload: Record<string, any>): Promise<boolean>;
  fetchProfile(gameUid: string, region?: string): Promise<any>;
  fetchStats(gameUid: string, region?: string): Promise<any>;
  fetchAchievements?(gameUid: string): Promise<any>;
}
