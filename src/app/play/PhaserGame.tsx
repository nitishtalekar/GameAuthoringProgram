"use client";

import { useEffect, useRef } from "react";
import type { GameJSON, EntityConfig, GameCondition, PropertyCondition, InteractionCondition } from "@/lib/gameState";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isPropertyCondition(c: GameCondition): c is PropertyCondition {
  return "property" in c;
}

function isInteractionCondition(c: GameCondition): c is InteractionCondition {
  return "attribute" in c;
}

// Resolve a normalised [0,1] spawn coordinate to canvas pixels
function resolveSpawn(
  normX: number,
  normY: number,
  worldW: number,
  worldH: number
): { x: number; y: number } {
  return { x: normX * worldW, y: normY * worldH };
}

// ---------------------------------------------------------------------------
// Phaser Scene factory
// ---------------------------------------------------------------------------

function buildScene(gameJSON: GameJSON, onEnd: (won: boolean) => void) {
  // Imported lazily so the import never runs on the server
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Phaser = require("phaser") as typeof import("phaser");

  // Runtime tracker per entity id
  type EntityRuntime = {
    config: EntityConfig;
    group: Phaser.Physics.Arcade.Group | Phaser.Physics.Arcade.StaticGroup;
    // For spawnRate entities: accumulated time since last spawn (ms)
    spawnTimer: number;
    // How many are alive/active
    activeCount: number;
    // track total destroyed / collected for condition checks
    destroyedCount: number;
    collectedCount: number;
    // total spawned (for count condition)
    spawnedCount: number;
  };

  class GameScene extends Phaser.Scene {
    private runtimes: Map<string, EntityRuntime> = new Map();
    private playerSprite: Phaser.Physics.Arcade.Sprite | null = null;
    private playerEntityId: string = "";
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private wasd!: {
      up: Phaser.Input.Keyboard.Key;
      down: Phaser.Input.Keyboard.Key;
      left: Phaser.Input.Keyboard.Key;
      right: Phaser.Input.Keyboard.Key;
    };
    private gameOver = false;
    private gameOverText: Phaser.GameObjects.Text | null = null;
    // player health display
    private healthText: Phaser.GameObjects.Text | null = null;
    private playerHealth: number = 0;
    // timer for surviveUntilTime / outOfTime conditions
    private elapsedMs: number = 0;
    // overlap pairs already registered (avoid duplicates)
    private registeredOverlaps: Set<string> = new Set();

    constructor() {
      super({ key: "GameScene" });
    }

    preload() {
      // We draw everything as coloured shapes – no external assets needed
    }

    create() {
      const { world, entities, winCondition, loseCondition } = gameJSON;

      this.cameras.main.setBackgroundColor(world.backgroundColor);

      // world bounds
      this.physics.world.setBounds(0, 0, world.widthPx, world.heightPx);
      this.physics.world.gravity.y = world.gravityY;

      this.cursors = this.input.keyboard!.createCursorKeys();
      this.wasd = {
        up: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        down: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        left: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        right: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      };

      // ── Spawn zones lookup ──────────────────────────────────────────────
      const spawnZoneMap = new Map(
        gameJSON.world
          ? []
          : []
      );
      // Build from entities' lifecycle spawnZoneIds via the layout
      // (layout is embedded in the entities' lifecycle.spawnZoneId; actual
      //  coordinates come from the GameLayout which is not in GameJSON directly,
      //  so we fall back to the entity's individual spawn zone from the pipeline)
      // The GameJSON entities have lifecycle.spawnZoneId but the actual coordinates
      // are in the original GameLayout. Since GameJSON doesn't carry the full layout
      // object, we derive approximate positions from entity roles:
      const roleDefaults: Record<string, { x: number; y: number }> = {
        player:      { x: 0.15, y: 0.75 },
        enemy:       { x: 0.80, y: 0.25 },
        collectible: { x: 0.50, y: 0.20 },
        goal:        { x: 0.90, y: 0.75 },
        hazard:      { x: 0.50, y: 0.75 },
        static:      { x: 0.50, y: 0.90 },
      };
      void spawnZoneMap; // unused after refactor

      // ── Create groups and initial sprites ──────────────────────────────
      for (const entity of entities) {
        const isStatic = entity.physics.isStatic;
        const group = isStatic
          ? this.physics.add.staticGroup()
          : this.physics.add.group();

        const runtime: EntityRuntime = {
          config: entity,
          group,
          spawnTimer: 0,
          activeCount: 0,
          destroyedCount: 0,
          collectedCount: 0,
          spawnedCount: 0,
        };
        this.runtimes.set(entity.id, runtime);

        // Determine how many to spawn at start
        // spawnRate === 0 means "spawn once", spawnRate > 0 means timed spawning
        const initialCount = entity.lifecycle.spawnRate === 0 ? 1 : 0;
        for (let i = 0; i < initialCount; i++) {
          this.spawnEntity(entity, runtime);
        }
      }

      // ── Camera follow ──────────────────────────────────────────────────
      if (this.playerSprite && world.scrolling) {
        this.cameras.main.setBounds(0, 0, world.widthPx, world.heightPx);
        this.cameras.main.startFollow(this.playerSprite, true, 0.08, 0.08);
      }

      // ── Register physics overlaps for all interaction pairs ────────────
      for (const entity of entities) {
        for (const interaction of entity.interactions) {
          this.registerInteractionOverlap(entity.id, interaction.target, interaction.attributeKey);
        }
      }

      // ── Colliders: all non-static groups collide with static groups ────
      const staticRTs = [...this.runtimes.values()].filter(r => r.config.physics.isStatic);
      const dynamicRTs = [...this.runtimes.values()].filter(r => !r.config.physics.isStatic);
      for (const drt of dynamicRTs) {
        for (const srt of staticRTs) {
          this.physics.add.collider(drt.group, srt.group);
        }
        // dynamic entities collide with each other only if both have gravity
        for (const drt2 of dynamicRTs) {
          if (drt.config.id !== drt2.config.id) {
            // Only add collider for non-overlapping pairs (overlaps handle interactions)
            const pairKey = [drt.config.id, drt2.config.id].sort().join("|");
            // Colliders are needed for blocking; overlaps handle attribute interactions
            // We'll add colliders for entity pairs not handled by isDamagedBy / isDestroyedBy etc
            const hasDirectInteraction = drt.config.interactions.some(i => i.target === drt2.config.id)
              || drt2.config.interactions.some(i => i.target === drt.config.id);
            if (!hasDirectInteraction && !this.registeredOverlaps.has(pairKey)) {
              // let them pass through unless they are both solid
            }
          }
        }
      }

      // ── HUD ────────────────────────────────────────────────────────────
      const playerEntity = entities.find(e => e.role === "player");
      if (playerEntity && playerEntity.lifecycle.health > 0) {
        this.playerHealth = playerEntity.lifecycle.health;
        this.healthText = this.add.text(12, 12, `HP: ${this.playerHealth}`, {
          fontSize: "18px",
          color: "#ffffff",
          backgroundColor: "#00000088",
          padding: { x: 6, y: 4 },
        }).setScrollFactor(0).setDepth(100);
      }

      // ── Condition check: timer-based ───────────────────────────────────
      // outOfTime / surviveUntilTime handled in update()

      // ── Win condition: playerReachesGoal or allCollectiblesCollected ───
      // These are handled via overlap callbacks registered above

      // ── Lose condition: similar ────────────────────────────────────────
    }

    // ── Spawn a single instance of an entity ─────────────────────────────
    private spawnEntity(entity: EntityConfig, runtime: EntityRuntime) {
      const { world } = gameJSON;
      const maxCount = entity.lifecycle.maxCount;
      if (maxCount !== -1 && runtime.activeCount >= maxCount) return;

      const roleDefaults: Record<string, { x: number; y: number }> = {
        player:      { x: 0.15, y: 0.75 },
        enemy:       { x: 0.80, y: 0.25 },
        collectible: { x: 0.50, y: 0.20 },
        goal:        { x: 0.90, y: 0.75 },
        hazard:      { x: 0.50, y: 0.70 },
        static:      { x: 0.50, y: 0.90 },
      };

      // Slightly randomise enemy/collectible spawn positions
      const base = roleDefaults[entity.role] ?? { x: 0.5, y: 0.5 };
      let nx = base.x;
      let ny = base.y;
      if (entity.role === "enemy" || entity.role === "collectible") {
        nx = 0.3 + Math.random() * 0.6;
        ny = entity.role === "collectible" ? 0.1 + Math.random() * 0.4 : base.y;
      }

      const { x, y } = resolveSpawn(nx, ny, world.widthPx, world.heightPx);
      const { appearance, physics } = entity;
      const size = appearance.size;

      // Draw entity as a coloured rectangle/circle texture
      const texKey = `tex_${entity.id}`;
      if (!this.textures.exists(texKey)) {
        const gfx = this.make.graphics({ x: 0, y: 0 });
        gfx.fillStyle(parseInt(appearance.color.replace("#", ""), 16));
        if (appearance.shape === "circle") {
          gfx.fillCircle(size / 2, size / 2, size / 2);
        } else {
          gfx.fillRect(0, 0, size, size);
        }
        gfx.generateTexture(texKey, size, size);
        gfx.destroy();
      }

      let sprite: Phaser.Physics.Arcade.Sprite;
      if (physics.isStatic) {
        sprite = (runtime.group as Phaser.Physics.Arcade.StaticGroup).create(x, y, texKey) as Phaser.Physics.Arcade.Sprite;
      } else {
        sprite = (runtime.group as Phaser.Physics.Arcade.Group).create(x, y, texKey) as Phaser.Physics.Arcade.Sprite;
        const body = sprite.body as Phaser.Physics.Arcade.Body;
        body.setCollideWorldBounds(true);
        if (!physics.hasGravity) {
          body.setAllowGravity(false);
        }
        body.setMaxVelocity(physics.speed * 3, 2000);
      }

      sprite.setData("entityId", entity.id);
      sprite.setData("health", entity.lifecycle.health);

      // Add label text above sprite
      const label = this.add.text(x, y - size / 2 - 4, entity.label, {
        fontSize: "11px",
        color: "#ffffffcc",
      }).setOrigin(0.5, 1).setDepth(10);
      sprite.setData("label", label);

      if (entity.role === "player") {
        this.playerSprite = sprite;
        this.playerEntityId = entity.id;
      }

      // Basic AI for enemies: move toward player
      if (entity.role === "enemy" && !physics.isStatic) {
        sprite.setData("isEnemy", true);
      }

      runtime.activeCount++;
      runtime.spawnedCount++;
    }

    // ── Register overlap callback for an interaction pair ─────────────────
    private registerInteractionOverlap(sourceId: string, targetId: string, attributeKey: string) {
      const pairKey = `${sourceId}:${targetId}:${attributeKey}`;
      if (this.registeredOverlaps.has(pairKey)) return;
      this.registeredOverlaps.add(pairKey);

      const sourceRT = this.runtimes.get(sourceId);
      const targetRT = this.runtimes.get(targetId);
      if (!sourceRT || !targetRT) return;

      this.physics.add.overlap(sourceRT.group, targetRT.group, (objA, objB) => {
        const source = objA as Phaser.Physics.Arcade.Sprite;
        const target = objB as Phaser.Physics.Arcade.Sprite;
        this.handleInteraction(source, sourceId, target, targetId, attributeKey);
      });
    }

    // ── Apply an interaction between two sprites ──────────────────────────
    private handleInteraction(
      source: Phaser.Physics.Arcade.Sprite,
      sourceId: string,
      target: Phaser.Physics.Arcade.Sprite,
      targetId: string,
      attributeKey: string
    ) {
      if (this.gameOver) return;
      if (!source.active || !target.active) return;

      const sourceRT = this.runtimes.get(sourceId)!;
      const targetRT = this.runtimes.get(targetId)!;

      switch (attributeKey) {
        case "isDamagedBy": {
          // source is damaged by target — apply damage to source once per 500ms
          const lastHit: number = source.getData("lastHit") ?? 0;
          if (this.time.now - lastHit < 500) return;
          source.setData("lastHit", this.time.now);
          const hp: number = source.getData("health") - 1;
          source.setData("health", hp);
          this.flashSprite(source);
          if (sourceId === this.playerEntityId) {
            this.playerHealth = hp;
            this.healthText?.setText(`HP: ${this.playerHealth}`);
          }
          if (hp <= 0) {
            this.destroySprite(source, sourceRT);
            if (sourceId === this.playerEntityId) this.endGame(false);
          }
          this.checkConditions();
          break;
        }
        case "isDestroyedBy": {
          // source is destroyed by target
          const lastHit: number = source.getData("lastHit") ?? 0;
          if (this.time.now - lastHit < 300) return;
          source.setData("lastHit", this.time.now);
          this.destroySprite(source, sourceRT);
          if (sourceId === this.playerEntityId) this.endGame(false);
          this.checkConditions();
          break;
        }
        case "isCollectedBy": {
          // source is collected by target (source disappears)
          this.destroySprite(source, sourceRT, true);
          sourceRT.collectedCount++;
          this.checkConditions();
          break;
        }
        case "isHealedBy": {
          // source is healed by target
          const maxHp = gameJSON.entities.find(e => e.id === sourceId)?.lifecycle.health ?? 0;
          const hp: number = Math.min((source.getData("health") as number) + 1, maxHp);
          source.setData("health", hp);
          if (sourceId === this.playerEntityId) {
            this.playerHealth = hp;
            this.healthText?.setText(`HP: ${this.playerHealth}`);
          }
          // consume the healing item
          this.destroySprite(target, targetRT, true);
          break;
        }
        case "isBlockedBy": {
          // handled by physics collider; nothing extra needed
          break;
        }
        case "isActivatedBy": {
          // source activates when touched by target — mark activated
          if (!source.getData("activated")) {
            source.setData("activated", true);
            source.setAlpha(0.4);
            this.checkConditions();
          }
          break;
        }
        case "isSpawnedBy": {
          // target spawns source — spawn a new instance
          this.spawnEntity(sourceRT.config, sourceRT);
          break;
        }
      }
    }

    private destroySprite(
      sprite: Phaser.Physics.Arcade.Sprite,
      runtime: EntityRuntime,
      collected = false
    ) {
      // Remove floating label
      const label = sprite.getData("label") as Phaser.GameObjects.Text | undefined;
      label?.destroy();
      sprite.destroy();
      runtime.activeCount = Math.max(0, runtime.activeCount - 1);
      if (!collected) runtime.destroyedCount++;
    }

    private flashSprite(sprite: Phaser.Physics.Arcade.Sprite) {
      this.tweens.add({
        targets: sprite,
        alpha: 0.2,
        duration: 80,
        yoyo: true,
        repeat: 2,
      });
    }

    // ── Check win/lose conditions ─────────────────────────────────────────
    private checkConditions() {
      if (this.gameOver) return;
      if (this.evaluateCondition(gameJSON.winCondition)) this.endGame(true);
      else if (this.evaluateCondition(gameJSON.loseCondition)) this.endGame(false);
    }

    private evaluateCondition(cond: GameCondition): boolean {
      const entityId = gameJSON.entities.find(
        e => e.label.toLowerCase() === cond.entity.toLowerCase() || e.id === cond.entity.toLowerCase()
      )?.id;
      const rt = entityId ? this.runtimes.get(entityId) : undefined;
      if (!rt) return false;

      if (isPropertyCondition(cond)) {
        if (cond.property === "health") {
          // Check the first active sprite's health
          const sprites = rt.group.getChildren() as Phaser.Physics.Arcade.Sprite[];
          if (sprites.length === 0) return rt.destroyedCount > 0; // if no sprites, already destroyed
          const hp = sprites[0].getData("health") as number;
          return hp <= cond.value;
        }
        if (cond.property === "count") {
          return rt.activeCount <= cond.value;
        }
        if (cond.property === "timer") {
          return this.elapsedMs >= cond.value * 1000;
        }
      } else if (isInteractionCondition(cond)) {
        const targetId = gameJSON.entities.find(
          e => e.label.toLowerCase() === cond.target.toLowerCase() || e.id === cond.target.toLowerCase()
        )?.id;
        const targetRT = targetId ? this.runtimes.get(targetId) : undefined;

        if (cond.attribute === "isDestroyedBy" || cond.attribute === "isCollectedBy") {
          // "all X destroyed/collected" means none left
          return rt.activeCount === 0 && rt.spawnedCount > 0;
        }
        if (cond.attribute === "isCollectedBy") {
          return rt.activeCount === 0 && rt.spawnedCount > 0;
        }
        if (cond.attribute === "isActivatedBy" || cond.attribute === "isBlockedBy") {
          // check if the interaction target has been activated
          const sprites = targetRT?.group.getChildren() as Phaser.Physics.Arcade.Sprite[] | undefined;
          return sprites?.some(s => s.getData("activated")) ?? false;
        }
      }
      return false;
    }

    private endGame(won: boolean) {
      if (this.gameOver) return;
      this.gameOver = true;
      onEnd(won);

      const cx = this.cameras.main.scrollX + this.cameras.main.width / 2;
      const cy = this.cameras.main.scrollY + this.cameras.main.height / 2;

      this.gameOverText = this.add.text(cx, cy, won ? "YOU WIN!" : "GAME OVER", {
        fontSize: "48px",
        color: won ? "#00ff88" : "#ff4444",
        backgroundColor: "#000000cc",
        padding: { x: 20, y: 12 },
      }).setOrigin(0.5).setDepth(200);

      this.add.text(cx, cy + 70, "Press R to restart", {
        fontSize: "20px",
        color: "#aaaaaa",
      }).setOrigin(0.5).setDepth(200);
    }

    update(time: number, delta: number) {
      if (this.gameOver) {
        const r = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.R);
        if (Phaser.Input.Keyboard.JustDown(r)) this.scene.restart();
        return;
      }

      this.elapsedMs += delta;

      // ── Player movement ─────────────────────────────────────────────────
      if (this.playerSprite?.active) {
        const player = this.playerSprite;
        const body = player.body as Phaser.Physics.Arcade.Body;
        const speed = gameJSON.entities.find(e => e.id === this.playerEntityId)!.physics.speed;
        const jumpForce = gameJSON.entities.find(e => e.id === this.playerEntityId)!.physics.jumpForce;
        const movement = gameJSON.world.movement;

        const leftKey = this.cursors.left.isDown || this.wasd.left.isDown;
        const rightKey = this.cursors.right.isDown || this.wasd.right.isDown;
        const upKey = this.cursors.up.isDown || this.wasd.up.isDown;
        const downKey = this.cursors.down.isDown || this.wasd.down.isDown;

        if (movement === "horizontal" || movement === "both") {
          if (leftKey) body.setVelocityX(-speed);
          else if (rightKey) body.setVelocityX(speed);
          else body.setVelocityX(0);
        }

        if (movement === "vertical" || movement === "both") {
          if (upKey) {
            // platformer jump when gravity is on
            if (gameJSON.world.gravityY > 0) {
              if (body.blocked.down) body.setVelocityY(-jumpForce);
            } else {
              body.setVelocityY(-speed);
            }
          } else if (downKey && gameJSON.world.gravityY === 0) {
            body.setVelocityY(speed);
          } else if (gameJSON.world.gravityY === 0) {
            body.setVelocityY(0);
          }
        }
      }

      // ── Update floating labels ──────────────────────────────────────────
      for (const rt of this.runtimes.values()) {
        for (const child of rt.group.getChildren()) {
          const sprite = child as Phaser.Physics.Arcade.Sprite;
          const label = sprite.getData("label") as Phaser.GameObjects.Text | undefined;
          if (label) {
            label.setPosition(sprite.x, sprite.y - sprite.height / 2 - 4);
          }
        }
      }

      // ── Enemy AI: simple chase ──────────────────────────────────────────
      if (this.playerSprite?.active) {
        for (const rt of this.runtimes.values()) {
          if (rt.config.role !== "enemy" || rt.config.physics.isStatic) continue;
          const speed = rt.config.physics.speed;
          for (const child of rt.group.getChildren()) {
            const enemy = child as Phaser.Physics.Arcade.Sprite;
            if (!enemy.active) continue;
            const body = enemy.body as Phaser.Physics.Arcade.Body;
            body.setAllowGravity(rt.config.physics.hasGravity);
            const dx = this.playerSprite!.x - enemy.x;
            const dy = this.playerSprite!.y - enemy.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 8) {
              const movement = gameJSON.world.movement;
              if (movement === "horizontal") {
                body.setVelocityX((dx / dist) * speed);
              } else if (movement === "vertical") {
                body.setVelocityY((dy / dist) * speed);
              } else {
                body.setVelocityX((dx / dist) * speed);
                body.setVelocityY((dy / dist) * speed);
              }
            }
          }
        }
      }

      // ── Timed spawning ──────────────────────────────────────────────────
      for (const rt of this.runtimes.values()) {
        if (rt.config.lifecycle.spawnRate === 0) continue;
        rt.spawnTimer += delta;
        const interval = 1000 / rt.config.lifecycle.spawnRate;
        if (rt.spawnTimer >= interval) {
          rt.spawnTimer -= interval;
          this.spawnEntity(rt.config, rt);
        }
      }

      // ── Timer-based conditions ──────────────────────────────────────────
      this.checkConditions();
    }
  }

  return GameScene;
}

// ---------------------------------------------------------------------------
// React component
// ---------------------------------------------------------------------------

interface PhaserGameProps {
  gameJSON: GameJSON;
}

export default function PhaserGame({ gameJSON }: PhaserGameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<import("phaser").Game | null>(null);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;

    const onEnd = (_won: boolean) => {
      // win/lose overlay is rendered inside the Phaser scene
    };

    // Dynamically import Phaser only on the client
    import("phaser").then((Phaser) => {
      const GameScene = buildScene(gameJSON, onEnd);

      const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        width: gameJSON.world.widthPx,
        height: gameJSON.world.heightPx,
        backgroundColor: gameJSON.world.backgroundColor,
        parent: containerRef.current!,
        physics: {
          default: "arcade",
          arcade: {
            gravity: { x: 0, y: gameJSON.world.gravityY },
            debug: false,
          },
        },
        scene: [GameScene],
        scale: {
          mode: Phaser.Scale.FIT,
          autoCenter: Phaser.Scale.CENTER_BOTH,
        },
      };

      gameRef.current = new Phaser.Game(config);
    });

    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, [gameJSON]);

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}
    />
  );
}
