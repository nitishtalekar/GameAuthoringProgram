// Maps interaction attribute keys to collision handlers.
// Each handler is invoked when source overlaps target.

import type { EntityRuntime } from "./types";

type GameSceneRef = {
  playerSprite: Phaser.Physics.Arcade.Sprite | null;
  playerCfg: import("@/lib/gameState").EntityDef | null;
  playerHp: number;
  inventory: Set<string>;
  hpText: Phaser.GameObjects.Text;
  over: boolean;
  removeSprite: (
    sprite: Phaser.Physics.Arcade.Sprite,
    rt: EntityRuntime,
    collected?: boolean
  ) => void;
  hpString: () => string;
  spawnEntityAt: (
    cfg: import("@/lib/gameState").EntityDef,
    x: number,
    y: number
  ) => Phaser.Physics.Arcade.Sprite | null;
  endGame: (won: boolean) => void;
  checkConditions: () => void;
  time: { now: number };
};

export interface InteractionHandler {
  key: string;
  description: string;
  cooldownMs: number;
  handle: (
    srcSprite: Phaser.Physics.Arcade.Sprite,
    tgtSprite: Phaser.Physics.Arcade.Sprite,
    srcRT: EntityRuntime,
    tgtRT: EntityRuntime,
    scene: GameSceneRef
  ) => void;
}

export const INTERACTION_HANDLERS: Record<string, InteractionHandler> = {
  isDamagedBy: {
    key: "isDamagedBy",
    description: "Source loses 1 health when hit by target. 600ms cooldown.",
    cooldownMs: 600,
    handle: (srcSprite, _tgtSprite, srcRT, _tgtRT, scene) => {
      const now = scene.time.now;
      const lastHit: number = srcSprite.getData("lastHit") ?? 0;
      if (now - lastHit < 600) return;
      srcSprite.setData("lastHit", now);

      const hp = (srcSprite.getData("health") as number) - 1;
      srcSprite.setData("health", hp);

      if (srcRT.cfg.id === scene.playerCfg?.id) {
        scene.playerHp = hp;
        scene.hpText.setText(scene.hpString());
      }
      if (hp <= 0) {
        scene.removeSprite(srcSprite, srcRT);
        if (srcRT.cfg.id === scene.playerCfg?.id) scene.endGame(false);
      }
      scene.checkConditions();
    },
  },

  isDestroyedBy: {
    key: "isDestroyedBy",
    description: "Source is instantly destroyed by target. 300ms cooldown.",
    cooldownMs: 300,
    handle: (srcSprite, _tgtSprite, srcRT, _tgtRT, scene) => {
      const now = scene.time.now;
      const lastHit: number = srcSprite.getData("lastHit") ?? 0;
      if (now - lastHit < 300) return;
      srcSprite.setData("lastHit", now);

      scene.removeSprite(srcSprite, srcRT);
      if (srcRT.cfg.id === scene.playerCfg?.id) scene.endGame(false);
      scene.checkConditions();
    },
  },

  isCollectedBy: {
    key: "isCollectedBy",
    description: "Source is picked up by target (player). Removed from world.",
    cooldownMs: 0,
    handle: (srcSprite, tgtSprite, srcRT, tgtRT, scene) => {
      // Only the player can collect
      if (tgtSprite !== scene.playerSprite && tgtRT.cfg.role !== "player")
        return;
      scene.removeSprite(srcSprite, srcRT, true);
      srcRT.collectedCount++;
      scene.inventory.add(srcRT.cfg.id);
      scene.checkConditions();
    },
  },

  isHealedBy: {
    key: "isHealedBy",
    description: "Source regains 1 health. Target (healing item) is consumed.",
    cooldownMs: 0,
    handle: (srcSprite, tgtSprite, srcRT, tgtRT, scene) => {
      if (!tgtSprite.active) return;
      const maxHp = srcRT.cfg.lifecycle.health;
      const curHp = srcSprite.getData("health") as number;
      const newHp = Math.min(curHp + 1, maxHp);
      srcSprite.setData("health", newHp);

      if (srcRT.cfg.id === scene.playerCfg?.id) {
        scene.playerHp = newHp;
        scene.hpText.setText(scene.hpString());
      }
      // consume the healing item
      scene.removeSprite(tgtSprite, tgtRT, true);
      tgtRT.collectedCount++;
      scene.inventory.add(tgtRT.cfg.id);
    },
  },

  isBlockedBy: {
    key: "isBlockedBy",
    description:
      "Source cannot pass through target. Handled by physics collider — no-op in overlap.",
    cooldownMs: 0,
    handle: () => {},
  },

  isActivatedBy: {
    key: "isActivatedBy",
    description:
      "Source is activated when player has collected the activator (target). Sets alpha to 0.5.",
    cooldownMs: 0,
    handle: (srcSprite, _tgtSprite, _srcRT, tgtRT, scene) => {
      const activatorId = tgtRT.cfg.id;
      if (!scene.inventory.has(activatorId)) return;
      if (!srcSprite.getData("activated")) {
        srcSprite.setData("activated", true);
        srcSprite.setAlpha(0.5);
        scene.checkConditions();
      }
    },
  },

  isSpawnedBy: {
    key: "isSpawnedBy",
    description: "Source is spawned near target when they overlap.",
    cooldownMs: 0,
    handle: (_srcSprite, tgtSprite, srcRT, _tgtRT, scene) => {
      const spawnX = tgtSprite.x + (Math.random() - 0.5) * 60;
      const spawnY = tgtSprite.y + (Math.random() - 0.5) * 60;
      scene.spawnEntityAt(srcRT.cfg, spawnX, spawnY);
    },
  },
};
