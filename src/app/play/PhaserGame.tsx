// PhaserGame.tsx
"use client";

import { useEffect, useRef } from "react";
import type PhaserType from "phaser";
import type { GameJSON } from "@/lib/gameState";
import { buildScene } from "@/components/phaser/GameScene";

interface PhaserGameProps {
  gameJSON: GameJSON;
}

export default function PhaserGame({ gameJSON }: PhaserGameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<PhaserType.Game | null>(null);

  useEffect(() => {
    let mounted = true;

    async function initGame() {
      if (!containerRef.current) return;

      gameRef.current?.destroy(true);
      gameRef.current = null;
      containerRef.current.innerHTML = "";

      const Phaser = await import("phaser");
      if (!mounted || !containerRef.current) return;

      const SceneClass = buildScene(gameJSON);

      const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        width: gameJSON.layout.widthPx,
        height: gameJSON.layout.heightPx,
        backgroundColor: gameJSON.layout.backgroundColor,
        parent: containerRef.current,
        physics: {
          default: "arcade",
          arcade: {
            gravity: { x: 0, y: 0 },
            debug: false,
          },
        },
        scene: [SceneClass],
        scale: {
          mode: Phaser.Scale.NONE,
          autoCenter: Phaser.Scale.NO_CENTER,
        },
        render: {
          pixelArt: true,
          antialias: false,
        },
      };

      gameRef.current = new Phaser.Game(config);
    }

    initGame();

    return () => {
      mounted = false;
      gameRef.current?.destroy(true);
      gameRef.current = null;

      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [gameJSON]);

  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        ref={containerRef}
        style={{
          width: `${gameJSON.layout.widthPx}px`,
          height: `${gameJSON.layout.heightPx}px`,
          display: "block",
          overflow: "hidden",
          lineHeight: 0,
          flexShrink: 0,
        }}
      />
    </div>
  );
}