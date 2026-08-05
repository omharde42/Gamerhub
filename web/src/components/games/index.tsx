'use client';

import React from 'react';
import { ClashOfClansRenderer, GameRendererProps } from './clashofclans/ClashOfClansRenderer';
import { ValorantRenderer } from './valorant/ValorantRenderer';
import { SteamRenderer } from './steam/SteamRenderer';
import { FreeFireRenderer } from './freefire/FreeFireRenderer';
import { BgmiRenderer } from './bgmi/BgmiRenderer';
import { GenericGameRenderer } from './GenericGameRenderer';

// Registry mapping gameKey -> Component
const GAME_RENDERERS: Record<string, React.ComponentType<GameRendererProps>> = {
  clashofclans: ClashOfClansRenderer,
  valorant: ValorantRenderer,
  steam: SteamRenderer,
  freefire: FreeFireRenderer,
  bgmi: BgmiRenderer,
  clashroyale: ClashOfClansRenderer,
  brawlstars: ClashOfClansRenderer,
};

/**
 * Dynamic Game Renderer Factory
 * Renders the dedicated game UI component for any gameKey
 */
export function GameRenderer({ gameKey, gameUid, isOwner }: GameRendererProps) {
  const Component = GAME_RENDERERS[gameKey.toLowerCase()] || GenericGameRenderer;
  return <Component gameKey={gameKey} gameUid={gameUid} isOwner={isOwner} />;
}

export * from './clashofclans/ClashOfClansRenderer';
