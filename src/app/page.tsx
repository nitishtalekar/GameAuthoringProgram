"use client";

import { useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Stack,
  TextField,
  Typography,
  Paper,
} from "@mui/material";
import { pipeline } from "@/lib/pipeline/pipeline";
import type { GameState } from "@/lib/gameState";

const initialGameState: GameState = {
  prompt: "",
  completedSteps: [],
};

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [gameState, setGameState] = useState<GameState>(initialGameState);
  const [lastResponse, setLastResponse] = useState<unknown>(null);
  const [loading, setLoading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runStep(stepId: number) {
    setLoading(stepId);
    setError(null);

    const stateToSend: GameState = { ...gameState, prompt };

    try {
      const res = await fetch("/api/pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: stepId, state: stateToSend }),
      });

      const data = (await res.json()) as { state?: GameState; error?: string };

      if (!res.ok || data.error) {
        setError(data.error ?? "Unknown error");
        return;
      }

      const newState = data.state!;
      setGameState(newState);

      // Show the output field for this step
      const stepDef = pipeline.find((s) => s.id === stepId);
      if (stepDef) {
        setLastResponse(newState[stepDef.outputField] ?? null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setLoading(null);
    }
  }

  function isStepEnabled(stepId: number): boolean {
    if (loading !== null) return false;
    if (stepId === 1) return prompt.trim().length > 0;
    return gameState.completedSteps.includes(stepId - 1);
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", p: 4 }}>
      <Stack spacing={3} sx={{ maxWidth: 800, mx: "auto" }}>
        <Typography variant="h4" fontWeight={600}>
          Game Authoring Pipeline
        </Typography>

        {/* Prompt input */}
        <TextField
          label="Prompt"
          multiline
          minRows={3}
          fullWidth
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter your prompt here..."
        />

        {/* Pipeline step buttons */}
        <Stack direction="row" spacing={2} flexWrap="wrap">
          {pipeline.map((step) => (
            <Button
              key={step.id}
              variant="contained"
              disabled={!isStepEnabled(step.id)}
              onClick={() => runStep(step.id)}
              endIcon={
                loading === step.id ? (
                  <CircularProgress size={16} color="inherit" />
                ) : null
              }
            >
              {step.label}
            </Button>
          ))}
        </Stack>

        {/* Error */}
        {error && (
          <Typography color="error" variant="body2">
            {error}
          </Typography>
        )}

        {/* Last step response */}
        {lastResponse !== null && (
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Last Step Response
            </Typography>
            <Box
              component="pre"
              sx={{
                m: 0,
                fontFamily: "var(--font-geist-mono, monospace)",
                fontSize: 13,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {JSON.stringify(lastResponse, null, 2)}
            </Box>
          </Paper>
        )}

        {/* GameState — always visible */}
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Game State
          </Typography>
          <Box
            component="pre"
            sx={{
              m: 0,
              fontFamily: "var(--font-geist-mono, monospace)",
              fontSize: 12,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              color: "text.secondary",
            }}
          >
            {JSON.stringify({ ...gameState, prompt }, null, 2)}
          </Box>
        </Paper>
      </Stack>
    </Box>
  );
}
