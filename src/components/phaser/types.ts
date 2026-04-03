import type { EntityDef } from "@/lib/gameState";

export type EntityRuntime = {
  cfg: EntityDef;
  group: Phaser.Physics.Arcade.Group | Phaser.Physics.Arcade.StaticGroup;
  activeCount: number;
  spawnedCount: number;
  destroyedCount: number;
  collectedCount: number;
  spawnTimer: number; // ms accumulator for rate-based spawning
};
