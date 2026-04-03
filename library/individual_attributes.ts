// Individual (per-entity) attributes that describe the entity's own behaviour,
// physics properties, and lifecycle — independent of any other entity.
// The agent uses `description` and `example` to pick the best match for a given entity.

export interface IndividualAttributeDefinition {
  key: string;
  description: string;
  example: string; // a sample entity type that typically has this attribute
}

export const INDIVIDUAL_ATTRIBUTES: IndividualAttributeDefinition[] = [
  {
    key: "isStatic",
    description:
      "The entity does not move. It forms part of the level geometry (walls, barriers, obstacles).",
    example: "A wall, barrier, or obstacle.",
  },
  {
    key: "isPlayer",
    description:
      "The entity is directly controlled by the human player's input.",
    example: "The hero or avatar the user steers.",
  },
  {
    key: "isEnemy",
    description:
      "The entity is an autonomous agent that opposes or threatens the player.",
    example: "A monster or guard.",
  },
  {
    key: "isCollectible",
    description:
      "The entity exists to be picked up by the player, granting a reward or resource.",
    example: "A coin, health pack, or power-up.",
  },
  {
    key: "isDestructible",
    description:
      "The entity can be destroyed or removed from the world by taking damage.",
    example: "A breakable crate or destructible wall.",
  },
  {
    key: "isHazard",
    description:
      "The entity damages or kills the player on contact without being an active enemy.",
    example: "Spikes or lava.",
  },
  {
    key: "hasHealth",
    description:
      "The entity has a numeric health value that can be reduced and determines when it is destroyed.",
    example: "A player character or enemy.",
  },
  {
    key: "isObject",
    description:
      "The entity is an inanimate object with no consciousness, agency, or autonomous behaviour. Use this to distinguish passive world objects from living or player-controlled entities.",
    example: "A chest, barrel, or door.",
  },
  {
    key: "hasMovement",
    description:
      "The entity can move autonomously (patrol, chase, wander) without player input.",
    example: "A patrolling guard or wandering creature.",
  },
];

export const INDIVIDUAL_ATTRIBUTE_KEYS = INDIVIDUAL_ATTRIBUTES.map(
  (a) => a.key
) as string[];
