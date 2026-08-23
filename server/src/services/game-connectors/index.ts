import { IGameConnector } from './base.connector';
import { ClashOfClansConnector } from './clashofclans.connector';
import { ClashRoyaleConnector } from './clashroyale.connector';
import { BrawlStarsConnector } from './brawlstars.connector';
import { PubgConnector } from './pubg.connector';
import { ValorantConnector } from './valorant.connector';
import { SteamConnector } from './steam.connector';
import { FreeFireConnector } from './freefire.connector';
import { BgmiConnector } from './bgmi.connector';
import { AppError } from '../../utils/errors';

export * from './base.connector';

class GameConnectorRegistry {
  private connectors = new Map<string, IGameConnector>();

  constructor() {
    this.register(new ClashOfClansConnector());
    this.register(new ClashRoyaleConnector());
    this.register(new BrawlStarsConnector());
    this.register(new PubgConnector());
    this.register(new ValorantConnector());
    this.register(new SteamConnector());
    this.register(new FreeFireConnector());
    this.register(new BgmiConnector());
  }

  public register(connector: IGameConnector) {
    this.connectors.set(connector.gameKey.toLowerCase(), connector);
  }

  public getConnector(gameKey: string): IGameConnector {
    const connector = this.connectors.get(gameKey.toLowerCase());
    if (!connector) {
      throw new AppError(`Game connector for '${gameKey}' is not supported yet`, 400);
    }
    return connector;
  }

  public getAllConnectors(): IGameConnector[] {
    return Array.from(this.connectors.values());
  }
}

export const gameConnectorRegistry = new GameConnectorRegistry();
