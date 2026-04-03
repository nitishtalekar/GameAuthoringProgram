"use client";

import { useEffect, useRef } from "react";
import type { GameJSON } from "@/lib/gameState";
import { buildScene } from "@/components/phaser/GameScene";

interface PhaserGameProps {
  gameJSON: GameJSON;
}

export default function PhaserGame({ gameJSON }: PhaserGameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<import("phaser").Game | null>(null);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;

    import("phaser").then((Phaser) => {
      const SceneClass = buildScene(gameJSON);

      const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        width: gameJSON.layout.widthPx,
        height: gameJSON.layout.heightPx,
        backgroundColor: gameJSON.layout.backgroundColor,
        parent: containerRef.current!,
        physics: {
          default: "arcade",
          arcade: {
            gravity: { x: 0, y: 0 },
            debug: false,
          },
        },
        scene: [SceneClass],
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
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    />
  );
}
