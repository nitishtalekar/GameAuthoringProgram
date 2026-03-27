"use client";

import { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  TextField,
  Typography,
} from "@mui/material";

export default function TestPage() {
  const [input, setInput] = useState("");
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const res = await fetch("/api/pirate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }

      const lastMessage = data.messages?.findLast(
        (m: { role: string; content: unknown }) => m.role === "ai"
      );
      setResponse(
        typeof lastMessage?.content === "string"
          ? lastMessage.content
          : JSON.stringify(lastMessage?.content ?? "")
      );
    } catch {
      setError("Failed to reach the server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom color="text.primary">
          🏴‍☠️ Pirate Agent Test
        </Typography>
        <Typography variant="body1" mb={4} color="text.secondary">
          Type anything and the pirate will respond.
        </Typography>

        <Box component="form" onSubmit={handleSubmit} display="flex" flexDirection="column" gap={2}>
          <TextField
            label="Your message"
            variant="outlined"
            fullWidth
            multiline
            minRows={3}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            size="large"
            disabled={loading || !input.trim()}
            startIcon={loading ? <CircularProgress size={18} color="inherit" /> : null}
          >
            {loading ? "Waiting..." : "Send"}
          </Button>
        </Box>

        {error && (
          <Card sx={{ mt: 4, bgcolor: "error.dark" }}>
            <CardContent>
              <Typography variant="subtitle2" fontWeight={600} color="error.contrastText">
                Error
              </Typography>
              <Typography variant="body2" color="error.contrastText">
                {error}
              </Typography>
            </CardContent>
          </Card>
        )}

        {response && (
          <Card sx={{ mt: 4, bgcolor: "background.paper" }} elevation={2}>
            <CardContent>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom color="text.secondary">
                Pirate says:
              </Typography>
              <Typography variant="body1" color="text.primary" sx={{ whiteSpace: "pre-wrap" }}>
                {response}
              </Typography>
            </CardContent>
          </Card>
        )}
      </Container>
    </Box>
  );
}
