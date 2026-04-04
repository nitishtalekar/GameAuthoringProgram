// PlayPage.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Box, Button, Stack, TextField, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import type { GameJSON } from "@/lib/gameState";

const PhaserGame = dynamic(() => import("./PhaserGame"), { ssr: false });

export default function PlayPage() {
  const router = useRouter();
  const [jsonInput, setJsonInput] = useState("");
  const [gameJSON, setGameJSON] = useState<GameJSON | null>(null);
  const [error, setError] = useState<string | null>(null);

  function loadGame() {
    try {
      const parsed = JSON.parse(jsonInput) as GameJSON;

      if (
        !parsed.title ||
        !parsed.entities ||
        !parsed.interactionMatrix ||
        !parsed.layout
      ) {
        throw new Error(
          "Invalid GameJSON — must have title, entities, interactionMatrix, and layout."
        );
      }

      setGameJSON(parsed);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid JSON");
      setGameJSON(null);
    }
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", p: 4 }}>
      <Stack spacing={3} sx={{ maxWidth: 900, mx: "auto" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Button
            size="small"
            variant="text"
            startIcon={<ArrowBackIcon />}
            onClick={() => router.push("/")}
          >
            Editor
          </Button>

          <Typography variant="h4" fontWeight={600}>
            Game Player
          </Typography>
        </Box>

        <Typography variant="body2" color="text.secondary">
          Paste a GameJSON below and press Ctrl+Enter or click &quot;Load
          Game&quot; to play.
        </Typography>

        <TextField
          label="Paste GameJSON here"
          multiline
          minRows={6}
          maxRows={15}
          fullWidth
          value={jsonInput}
          onChange={(e) => setJsonInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && e.ctrlKey) {
              e.preventDefault();
              loadGame();
            }
          }}
          placeholder='{"title": "...", "entities": [...], "interactionMatrix": [...], "layout": {...}, ...}'
        />

        <Button
          variant="contained"
          onClick={loadGame}
          disabled={!jsonInput.trim()}
        >
          Load Game
        </Button>

        {error && (
          <Typography color="error" variant="body2">
            {error}
          </Typography>
        )}

        {gameJSON && (
          <Box
            sx={{
              width: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 1,
            }}
          >
            <Typography variant="subtitle1" fontWeight={600}>
              {gameJSON.title}
            </Typography>

            <Typography variant="caption" color="text.secondary">
              WASD to move · R to restart
            </Typography>

            <Box
              sx={{
                width: "100%",
                display: "flex",
                justifyContent: "center",
              }}
            >
              <PhaserGame gameJSON={gameJSON} />
            </Box>
          </Box>
        )}
      </Stack>
    </Box>
  );
}