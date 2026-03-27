import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@langchain/core",
    "@langchain/openai",
    "@langchain/google-genai",
    "@langchain/langgraph",
  ],
  turbopack: {},
};

export default nextConfig;
