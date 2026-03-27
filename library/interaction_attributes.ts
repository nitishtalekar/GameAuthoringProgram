// Relational interaction attributes between two entities.
// Each entry describes a directional relationship: subject → object.
// The agent uses `description` and `example` to pick the best match for a given SVO relation.

export interface InteractionAttributeDefinition {
  key: string;
  description: string;
  example: string; // a sample natural-language relation that maps to this attribute
}

export const INTERACTION_ATTRIBUTES: InteractionAttributeDefinition[] = [
  {
    key: "isDamagedBy",
    description:
      "The subject loses health when it contacts or is acted upon by the object.",
    example: "The player is hurt by the fire.",
  },
  {
    key: "isDestroyedBy",
    description:
      "The subject is permanently removed or killed when it contacts or is acted upon by the object.",
    example: "The enemy is killed by the sword.",
  },
  {
    key: "isHealedBy",
    description:
      "The subject regains health when it contacts or receives the object.",
    example: "The player is healed by the potion.",
  },
  {
    key: "isBlockedBy",
    description:
      "The subject cannot pass through the object; movement is halted.",
    example: "The character is stopped by the wall.",
  },
  {
    key: "isCollectedBy",
    description:
      "The subject is picked up and removed from the world by the object.",
    example: "The coin is collected by the player.",
  },
  {
    key: "isActivatedBy",
    description:
      "The subject begins an action or state change when triggered by the object.",
    example: "The door is opened by the key.",
  },
  {
    key: "isSpawnedBy",
    description:
      "The subject is created into the world by the object.",
    example: "The enemy is spawned by the portal.",
  },
];

export const INTERACTION_ATTRIBUTE_KEYS = INTERACTION_ATTRIBUTES.map(
  (a) => a.key
) as string[];
