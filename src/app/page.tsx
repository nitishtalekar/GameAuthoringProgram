"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import { pipeline } from "@/lib/pipeline/pipeline";
import type { GameState } from "@/lib/gameState";

const initialGameState: GameState = {
  prompt: "",
  completedSteps: [],
};

export default function Home() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [gameState, setGameState] = useState<GameState>(initialGameState);
  const [stepHistory, setStepHistory] = useState<
    { stepId: number; label: string; response: unknown; expanded: boolean }[]
  >([]);
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

      const stepDef = pipeline.find((s) => s.id === stepId);
      if (stepDef) {
        const response = newState[stepDef.outputField] ?? null;
        setStepHistory((prev) => [
          ...prev.map((e) => ({ ...e, expanded: false })),
          { stepId, label: stepDef.label, response, expanded: true },
        ]);
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

        {/* Sample prompt */}
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ cursor: "pointer", "&:hover": { color: "text.primary" } }}
          onClick={() =>
            setPrompt(
              "A knight patrols a dungeon. Fire traps line the corridor and damage anyone who walks through. A healing potion sits on a pedestal and restores the knight's health when collected. A locked door blocks the exit, and a key hidden in a chest unlocks it."
            )
          }
        >
          Sample: &quot;A knight patrols a dungeon. Fire traps line the corridor and damage anyone who walks through. A healing potion sits on a pedestal and restores the knight&apos;s health when collected. A locked door blocks the exit, and a key hidden in a chest unlocks it.&quot;
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
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 2 }}>
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
        </Box>

        {/* Play button — shown once gameJSON is ready */}
        {gameState.gameJSON && (
          <Button
            variant="contained"
            color="success"
            size="large"
            startIcon={<PlayArrowIcon />}
            onClick={() => {
              const encoded = btoa(JSON.stringify(gameState.gameJSON));
              router.push(`/play?game=${encoded}`);
            }}
          >
            Play Game
          </Button>
        )}

        {/* Error */}
        {error && (
          <Typography color="error" variant="body2">
            {error}
          </Typography>
        )}

        {/* Step response history */}
        {stepHistory.map((entry, i) => (
          <Accordion
            key={i}
            expanded={entry.expanded}
            onChange={(_, open) =>
              setStepHistory((prev) =>
                prev.map((e, j) => (j === i ? { ...e, expanded: open } : e))
              )
            }
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle2">
                {entry.label} — response #{i + 1}
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 1.5 }}>
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
                {JSON.stringify(entry.response, null, 2)}
              </Box>
            </AccordionDetails>
          </Accordion>
        ))}

        {/* GameState — collapsible */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle2">Game State</Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ p: 1.5 }}>
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
          </AccordionDetails>
        </Accordion>
      </Stack>
    </Box>
  );
}
