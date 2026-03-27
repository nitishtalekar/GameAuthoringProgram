"use client";

import { useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Box, Button, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import type { GameJSON } from "@/lib/gameState";

// Load PhaserGame with no SSR — Phaser requires browser APIs
const PhaserGame = dynamic(() => import("./PhaserGame"), { ssr: false });

export default function PlayPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const gameJSON = useMemo<GameJSON | null>(() => {
    const raw = searchParams.get("game");
    if (!raw) return null;
    try {
      return JSON.parse(atob(raw)) as GameJSON;
    } catch {
      return null;
    }
  }, [searchParams]);

  if (!gameJSON) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          bgcolor: "background.default",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
        }}
      >
        <Typography variant="h5" color="error">
          No game data found.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Run the pipeline and click &quot;Play&quot; to launch the game.
        </Typography>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push("/")}
        >
          Back to Editor
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#111", display: "flex", flexDirection: "column" }}>
      {/* Top bar */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          px: 2,
          py: 1,
          bgcolor: "background.paper",
          borderBottom: "1px solid",
          borderColor: "divider",
          flexShrink: 0,
        }}
      >
        <Button
          size="small"
          variant="text"
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push("/")}
        >
          Editor
        </Button>
        <Typography variant="subtitle1" fontWeight={600} sx={{ flexGrow: 1 }}>
          {gameJSON.title}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Arrow keys / WASD to move · R to restart
        </Typography>
      </Box>

      {/* Game canvas */}
      <Box sx={{ flexGrow: 1, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
        <PhaserGame gameJSON={gameJSON} />
      </Box>
    </Box>
  );
}
