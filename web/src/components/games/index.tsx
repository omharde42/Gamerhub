'use client';

import React from 'react';
import { ClashOfClansRenderer, GameRendererProps } from './clashofclans/ClashOfClansRenderer';
import { ClashRoyaleRenderer } from './clashroyale/ClashRoyaleRenderer';
import { BrawlStarsRenderer } from './brawlstars/BrawlStarsRenderer';
import { PubgRenderer } from './pubg/PubgRenderer';
import { ValorantRenderer } from './valorant/ValorantRenderer';
import { SteamRenderer } from './steam/SteamRenderer';
import { FreeFireRenderer } from './freefire/FreeFireRenderer';
import { BgmiRenderer } from './bgmi/BgmiRenderer';
import { GenericGameRenderer } from './GenericGameRenderer';

// Registry mapping gameKey -> Component
const GAME_RENDERERS: Record<string, React.ComponentType<GameRendererProps>> = {
  clashofclans: ClashOfClansRenderer,
  clash_of_clans: ClashOfClansRenderer,
  coc: ClashOfClansRenderer,
  pubg: PubgRenderer,
  pubg_pc: PubgRenderer,
  pubgpc: PubgRenderer,
  valorant: ValorantRenderer,
  steam: SteamRenderer,
  freefire: FreeFireRenderer,
  bgmi: BgmiRenderer,
  clashroyale: ClashRoyaleRenderer,
  clash_royale: ClashRoyaleRenderer,
  cr: ClashRoyaleRenderer,
  brawlstars: BrawlStarsRenderer,
  brawl_stars: BrawlStarsRenderer,
  bs: BrawlStarsRenderer,
};

/**
 * Dynamic Game Renderer Factory
 * Renders the dedicated game UI component for any gameKey
 */
export function GameRenderer({ gameKey, gameUid, isOwner }: GameRendererProps) {
  const rawKey = (gameKey || '').toLowerCase();
  const cleanKey = rawKey.replace(/[^a-z0-9]/g, '');

  const Component =
    GAME_RENDERERS[rawKey] ||
    GAME_RENDERERS[cleanKey] ||
    GenericGameRenderer;

  return <Component gameKey={gameKey} gameUid={gameUid} isOwner={isOwner} />;
}

export * from './clashofclans/ClashOfClansRenderer';
