// Maps individual attribute keys to concrete Phaser behaviors.
// Each behavior has an `apply()` called once at spawn time and an optional
// `update()` called every frame for active sprites.

import type { EntityRuntime } from "./types";

type GameSceneRef = {
  playerSprite: Phaser.Physics.Arcade.Sprite | null;
  rt: Map<string, EntityRuntime>;
};

export interface AttributeBehavior {
  key: string;
  description: string;
  apply: (
    sprite: Phaser.Physics.Arcade.Sprite,
    rt: EntityRuntime,
    scene: GameSceneRef
  ) => void;
  update?: (
    sprite: Phaser.Physics.Arcade.Sprite,
    rt: EntityRuntime,
    scene: GameSceneRef,
    delta: number
  ) => void;
}

export const ATTRIBUTE_BEHAVIORS: Record<string, AttributeBehavior> = {
  isStatic: {
    key: "isStatic",
    description: "Entity uses a static physics body — no velocity, immovable.",
    apply: () => {
      // Static group creation handled at group level, nothing extra per-sprite
    },
  },

  isPlayer: {
    key: "isPlayer",
    description: "Entity is the player avatar — registered for WASD control.",
    apply: (sprite, _rt, scene) => {
      scene.playerSprite = sprite;
    },
    // Player movement is handled centrally in GameScene.updatePlayerMovement()
  },

  isEnemy: {
    key: "isEnemy",
    description: "Entity is an opponent — will chase the player.",
    apply: () => {
      // Enemy chase is handled centrally in GameScene.updateEnemyAI()
    },
  },

  hasMovement: {
    key: "hasMovement",
    description:
      "Entity moves autonomously. For enemies, chases the player. For others, wanders.",
    apply: () => {
      // Movement is driven by role-specific logic in update
    },
    update: (sprite, rt, scene) => {
      if (!sprite.active || rt.cfg.physics.isStatic) return;
      if (rt.cfg.role !== "enemy") return; // only enemies chase for now
      if (!scene.playerSprite?.active) return;

      const body = sprite.body as Phaser.Physics.Arcade.Body;
      const speed = rt.cfg.physics.speed;
      const dx = scene.playerSprite.x - sprite.x;
      const dy = scene.playerSprite.y - sprite.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 8) return;
      body.setVelocityX((dx / dist) * speed);
      body.setVelocityY((dy / dist) * speed);
    },
  },

  hasHealth: {
    key: "hasHealth",
    description: "Entity has a numeric health pool that can be reduced.",
    apply: (sprite, rt) => {
      sprite.setData(
        "health",
        rt.cfg.lifecycle.health > 0 ? rt.cfg.lifecycle.health : 1
      );
    },
  },

  isCollectible: {
    key: "isCollectible",
    description: "Entity can be picked up by the player.",
    apply: () => {},
  },

  isDestructible: {
    key: "isDestructible",
    description: "Entity can be destroyed by taking damage.",
    apply: () => {},
  },

  isHazard: {
    key: "isHazard",
    description: "Entity damages others on contact without being an active enemy.",
    apply: () => {},
  },

  isObject: {
    key: "isObject",
    description: "Passive inanimate world object.",
    apply: () => {},
  },
};
