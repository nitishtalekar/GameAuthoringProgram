// Extracted Phaser GameScene for top-down games.
// Reads from GameJSON with entities, interactionMatrix, and layout.

import type {
  GameJSON,
  EntityDef,
  GameCondition,
  PropertyCondition,
  InteractionCondition,
} from "@/lib/gameState";
import type { EntityRuntime } from "./types";
import { ATTRIBUTE_BEHAVIORS } from "./attributeBehaviors";
import { INTERACTION_HANDLERS } from "./interactionHandlers";

// ─── Type guards ──────────────────────────────────────────────────────────────

function isPropertyCondition(c: GameCondition): c is PropertyCondition {
  return "property" in c;
}
function isInteractionCondition(c: GameCondition): c is InteractionCondition {
  return "attribute" in c;
}

// ─── Scene factory ────────────────────────────────────────────────────────────
// Called inside useEffect (client only), so require() is safe here.

export function buildScene(gameJSON: GameJSON) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Phaser = require("phaser") as typeof import("phaser");

  const { entities, interactionMatrix, layout } = gameJSON;

  // ── helpers ──────────────────────────────────────────────────────────────────

  function ensureTexture(
    scene: Phaser.Scene,
    key: string,
    w: number,
    h: number,
    hex: string,
    shape: "rectangle" | "circle" = "rectangle"
  ) {
    if (scene.textures.exists(key)) return;
    const g = scene.make.graphics({ x: 0, y: 0 });
    g.fillStyle(parseInt(hex.replace("#", ""), 16), 1);
    if (shape === "circle") {
      g.fillCircle(w / 2, h / 2, Math.min(w, h) / 2);
    } else {
      g.fillRect(0, 0, w, h);
    }
    g.generateTexture(key, w, h);
    g.destroy();
  }

  // ── scene ────────────────────────────────────────────────────────────────────

  class GameScene extends Phaser.Scene {
    // sprite tracking
    rt = new Map<string, EntityRuntime>();
    playerSprite: Phaser.Physics.Arcade.Sprite | null = null;
    playerCfg: EntityDef | null = null;

    // input
    private keyW!: Phaser.Input.Keyboard.Key;
    private keyA!: Phaser.Input.Keyboard.Key;
    private keyS!: Phaser.Input.Keyboard.Key;
    private keyD!: Phaser.Input.Keyboard.Key;
    private keyR!: Phaser.Input.Keyboard.Key;

    // state
    over = false;
    private elapsed = 0;

    // HUD
    hpText!: Phaser.GameObjects.Text;
    playerHp = 0;
    private playerMaxHp = 0;

    // inventory
    inventory = new Set<string>();

    // overlap dedup
    private overlapsRegistered = new Set<string>();

    constructor() {
      super({ key: "GameScene" });
    }

    // ── preload ──────────────────────────────────────────────────────────────
    preload() {
      // all visuals are procedural
    }

    // ── create ───────────────────────────────────────────────────────────────
    create() {
      this.over = false;
      this.elapsed = 0;
      this.inventory.clear();
      this.overlapsRegistered.clear();
      this.rt.clear();
      this.playerSprite = null;
      this.playerCfg = null;

      this.physics.world.setBounds(0, 0, layout.widthPx, layout.heightPx);
      this.physics.world.gravity.y = 0;
      this.cameras.main.setBackgroundColor(layout.backgroundColor);

      // ── input ────────────────────────────────────────────────────────────
      this.keyW = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W);
      this.keyA = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A);
      this.keyS = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S);
      this.keyD = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D);
      this.keyR = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.R);

      // ── spawn entities from layout ───────────────────────────────────────
      this.buildLevel();

      // ── camera ───────────────────────────────────────────────────────────
      if (this.playerSprite) {
        this.cameras.main.setBounds(0, 0, layout.widthPx, layout.heightPx);
        this.cameras.main.startFollow(this.playerSprite, true, 0.1, 0.1);
      }

      // ── physics overlaps from interaction matrix ─────────────────────────
      this.registerAllOverlaps();

      // ── HUD ──────────────────────────────────────────────────────────────
      const playerCfg = entities.find((e) => e.role === "player");
      if (playerCfg) {
        this.playerMaxHp = playerCfg.lifecycle.health;
        this.playerHp = this.playerMaxHp;
      }
      this.hpText = this.add
        .text(12, 12, this.hpString(), {
          fontSize: "16px",
          color: "#ffffff",
          backgroundColor: "#00000099",
          padding: { x: 8, y: 4 },
        })
        .setScrollFactor(0)
        .setDepth(100);
    }

    // ── level builder ────────────────────────────────────────────────────────
    private buildLevel() {
      for (const cfg of entities) {
        // Find this entity's spawn point from layout
        const sp = layout.spawnPoints.find((s) => s.entityId === cfg.id);
        const spawnX = sp ? sp.x * layout.widthPx : layout.widthPx / 2;
        const spawnY = sp ? sp.y * layout.heightPx : layout.heightPx / 2;

        this.spawnEntityAt(cfg, spawnX, spawnY);
      }

      // Add colliders between all dynamic groups and static groups
      for (const [, rt] of this.rt) {
        if (rt.cfg.physics.isStatic) continue;
        for (const [, otherRt] of this.rt) {
          if (!otherRt.cfg.physics.isStatic) continue;
          this.physics.add.collider(rt.group, otherRt.group);
        }
      }
    }

    // ── Spawn a single sprite ────────────────────────────────────────────────
    spawnEntityAt(
      cfg: EntityDef,
      x: number,
      y: number
    ): Phaser.Physics.Arcade.Sprite | null {
      const { appearance, physics } = cfg;
      const s = appearance.size;
      const texKey = `tex_${cfg.id}`;
      ensureTexture(this, texKey, s, s, appearance.color, appearance.shape);

      if (!this.rt.has(cfg.id)) {
        const group = physics.isStatic
          ? this.physics.add.staticGroup()
          : this.physics.add.group();
        this.rt.set(cfg.id, {
          cfg,
          group,
          activeCount: 0,
          spawnedCount: 0,
          destroyedCount: 0,
          collectedCount: 0,
          spawnTimer: 0,
        });
      }

      const rt = this.rt.get(cfg.id)!;
      const maxCount = cfg.lifecycle.maxCount;
      if (maxCount !== -1 && rt.activeCount >= maxCount) return null;

      let sprite: Phaser.Physics.Arcade.Sprite;

      if (physics.isStatic) {
        sprite = (rt.group as Phaser.Physics.Arcade.StaticGroup).create(
          x,
          y,
          texKey
        ) as Phaser.Physics.Arcade.Sprite;
      } else {
        sprite = (rt.group as Phaser.Physics.Arcade.Group).create(
          x,
          y,
          texKey
        ) as Phaser.Physics.Arcade.Sprite;
        const body = sprite.body as Phaser.Physics.Arcade.Body;
        body.setCollideWorldBounds(true);
        body.setAllowGravity(false);
      }

      sprite.setData("entityId", cfg.id);
      sprite.setData(
        "health",
        cfg.lifecycle.health > 0 ? cfg.lifecycle.health : 1
      );

      // floating label
      const lbl = this.add
        .text(x, y - s / 2 - 2, cfg.label, {
          fontSize: "10px",
          color: "#ffffffbb",
        })
        .setOrigin(0.5, 1)
        .setDepth(50);
      sprite.setData("lbl", lbl);

      // Apply attribute behaviors
      if (cfg.role === "player") {
        ATTRIBUTE_BEHAVIORS.isPlayer.apply(sprite, rt, this as never);
        this.playerCfg = cfg;
        this.playerHp = cfg.lifecycle.health;
      }

      rt.activeCount++;
      rt.spawnedCount++;
      return sprite;
    }

    // ── Register all overlaps from interactionMatrix ─────────────────────────
    private registerAllOverlaps() {
      for (const entry of interactionMatrix) {
        this.registerOverlap(entry.source, entry.target, entry.effect);
      }
    }

    private registerOverlap(sourceId: string, targetId: string, effect: string) {
      const key = `${sourceId}|${targetId}|${effect}`;
      if (this.overlapsRegistered.has(key)) return;
      this.overlapsRegistered.add(key);

      const srcRT = this.resolveRT(sourceId);
      const tgtRT = this.resolveRT(targetId);
      if (!srcRT || !tgtRT) return;

      // For isBlockedBy, use a physics collider instead of overlap
      if (effect === "isBlockedBy") {
        this.physics.add.collider(srcRT.group, tgtRT.group);
        return;
      }

      this.physics.add.overlap(srcRT.group, tgtRT.group, (a, b) => {
        this.handleInteraction(
          a as Phaser.Physics.Arcade.Sprite,
          srcRT,
          b as Phaser.Physics.Arcade.Sprite,
          tgtRT,
          effect
        );
      });
    }

    // ── Interaction handler ──────────────────────────────────────────────────
    private handleInteraction(
      srcSprite: Phaser.Physics.Arcade.Sprite,
      srcRT: EntityRuntime,
      tgtSprite: Phaser.Physics.Arcade.Sprite,
      tgtRT: EntityRuntime,
      effect: string
    ) {
      if (this.over) return;
      if (!srcSprite?.active || !tgtSprite?.active) return;

      const handler = INTERACTION_HANDLERS[effect];
      if (!handler) return;

      handler.handle(srcSprite, tgtSprite, srcRT, tgtRT, this as never);
    }

    // ── Remove a sprite ──────────────────────────────────────────────────────
    removeSprite(
      sprite: Phaser.Physics.Arcade.Sprite,
      rt: EntityRuntime,
      collected = false
    ) {
      const lbl = sprite.getData("lbl") as Phaser.GameObjects.Text | undefined;
      lbl?.destroy();
      sprite.destroy();
      rt.activeCount = Math.max(0, rt.activeCount - 1);
      if (!collected) rt.destroyedCount++;
    }

    private flash(sprite: Phaser.Physics.Arcade.Sprite) {
      this.tweens.add({
        targets: sprite,
        alpha: 0.15,
        duration: 60,
        yoyo: true,
        repeat: 3,
        onComplete: () => {
          if (sprite.active) sprite.setAlpha(1);
        },
      });
    }

    // ── Win / lose condition evaluation ──────────────────────────────────────
    checkConditions() {
      if (this.over) return;
      if (this.evalCondition(gameJSON.winCondition)) this.endGame(true);
      else if (this.evalCondition(gameJSON.loseCondition)) this.endGame(false);
    }

    private resolveRT(nameOrId: string): EntityRuntime | undefined {
      return (
        this.rt.get(nameOrId) ??
        this.rt.get(nameOrId.toLowerCase()) ??
        [...this.rt.values()].find(
          (r) => r.cfg.label.toLowerCase() === nameOrId.toLowerCase()
        )
      );
    }

    private evalCondition(cond: GameCondition): boolean {
      const rt = this.resolveRT(cond.entity);
      if (!rt) return false;

      if (isPropertyCondition(cond)) {
        if (cond.property === "health") {
          if (rt.cfg.role === "player") return this.playerHp <= cond.value;
          const sprites =
            rt.group.getChildren() as Phaser.Physics.Arcade.Sprite[];
          if (sprites.length === 0) return rt.destroyedCount > 0;
          return (sprites[0].getData("health") as number) <= cond.value;
        }
        if (cond.property === "count") return rt.activeCount <= cond.value;
        if (cond.property === "timer")
          return this.elapsed >= cond.value * 1000;
      }

      if (isInteractionCondition(cond)) {
        if (cond.attribute === "isActivatedBy") {
          const sprites =
            rt.group.getChildren() as Phaser.Physics.Arcade.Sprite[];
          return sprites.some((s) => s.getData("activated") === true);
        }
        if (
          cond.attribute === "isDestroyedBy" ||
          cond.attribute === "isCollectedBy"
        ) {
          return rt.activeCount === 0 && rt.spawnedCount > 0;
        }
      }

      return false;
    }

    // ── End game overlay ─────────────────────────────────────────────────────
    endGame(won: boolean) {
      if (this.over) return;
      this.over = true;

      const cx = this.cameras.main.width / 2;
      const cy = this.cameras.main.height / 2;

      this.add
        .text(cx, cy, won ? "YOU WIN!" : "GAME OVER", {
          fontSize: "52px",
          color: won ? "#00ff88" : "#ff4444",
          backgroundColor: "#000000cc",
          padding: { x: 24, y: 14 },
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(200);

      this.add
        .text(cx, cy + 80, "Press R to restart", {
          fontSize: "20px",
          color: "#cccccc",
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(200);
    }

    // ── update ───────────────────────────────────────────────────────────────
    update(_time: number, delta: number) {
      this.elapsed += delta;

      // Restart
      if (this.over) {
        if (Phaser.Input.Keyboard.JustDown(this.keyR)) this.scene.restart();
        return;
      }

      // Player movement (always WASD, top-down)
      this.updatePlayerMovement();

      // Enemy AI + autonomous movement
      this.updateAutonomousMovement();

      // Floating labels
      for (const rt of this.rt.values()) {
        for (const child of rt.group.getChildren()) {
          const sp = child as Phaser.Physics.Arcade.Sprite;
          const lbl = sp.getData("lbl") as
            | Phaser.GameObjects.Text
            | undefined;
          if (lbl) lbl.setPosition(sp.x, sp.y - sp.height / 2 - 2);
        }
      }

      // Timed spawning
      for (const rt of this.rt.values()) {
        if (rt.cfg.lifecycle.spawnRate <= 0) continue;
        rt.spawnTimer += delta;
        const interval = 1000 / rt.cfg.lifecycle.spawnRate;
        if (rt.spawnTimer >= interval) {
          rt.spawnTimer -= interval;
          const existing = rt.group.getChildren()[0] as
            | Phaser.Physics.Arcade.Sprite
            | undefined;
          const sx = existing?.x ?? layout.widthPx * 0.8;
          const sy = existing?.y ?? layout.heightPx * 0.5;
          this.spawnEntityAt(
            rt.cfg,
            sx + (Math.random() - 0.5) * 80,
            sy + (Math.random() - 0.5) * 80
          );
        }
      }

      // Timer conditions
      this.checkConditions();
    }

    private updatePlayerMovement() {
      if (!this.playerSprite?.active || !this.playerCfg) return;

      const body = this.playerSprite.body as Phaser.Physics.Arcade.Body;
      const speed = this.playerCfg.physics.speed;

      const left = this.keyA.isDown;
      const right = this.keyD.isDown;
      const up = this.keyW.isDown;
      const down = this.keyS.isDown;

      // Horizontal
      if (left) body.setVelocityX(-speed);
      else if (right) body.setVelocityX(speed);
      else body.setVelocityX(0);

      // Vertical (top-down: free movement)
      if (up) body.setVelocityY(-speed);
      else if (down) body.setVelocityY(speed);
      else body.setVelocityY(0);
    }

    private updateAutonomousMovement() {
      if (!this.playerSprite?.active) return;
      const px = this.playerSprite.x;
      const py = this.playerSprite.y;

      for (const rt of this.rt.values()) {
        if (!rt.cfg.physics.hasMovement || rt.cfg.physics.isStatic) continue;
        if (rt.cfg.role !== "enemy") continue; // only enemies chase for now

        for (const child of rt.group.getChildren()) {
          const enemy = child as Phaser.Physics.Arcade.Sprite;
          if (!enemy.active) continue;
          const body = enemy.body as Phaser.Physics.Arcade.Body;
          const speed = rt.cfg.physics.speed;
          const dx = px - enemy.x;
          const dy = py - enemy.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 8) continue;
          body.setVelocityX((dx / dist) * speed);
          body.setVelocityY((dy / dist) * speed);
        }
      }
    }

    hpString() {
      const filled = Math.max(0, this.playerHp);
      const total = this.playerMaxHp;
      return `HP: ${"♥".repeat(filled)}${"♡".repeat(
        Math.max(0, total - filled)
      )}`;
    }
  }

  return GameScene;
}
