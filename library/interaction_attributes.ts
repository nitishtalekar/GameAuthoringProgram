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
      "The subject loses health, integrity, or is harmed when it contacts or is acted upon by the object.",
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
      "The subject regains health or is restored when it contacts or receives the object.",
    example: "The player is healed by the potion.",
  },
  {
    key: "isBlockedBy",
    description:
      "The subject cannot pass through or move past the object; movement is halted.",
    example: "The character is stopped by the wall.",
  },
  {
    key: "isPushedBy",
    description:
      "The subject is moved in a direction away from or caused by the object's force.",
    example: "The crate is pushed by the wind.",
  },
  {
    key: "isAtractedTo",
    description:
      "The subject moves toward or is pulled in the direction of the object.",
    example: "The metal fragment is pulled toward the magnet.",
  },
  {
    key: "isCollectedBy",
    description:
      "The subject is picked up, consumed, or absorbed by the object, removing it from the world.",
    example: "The coin is collected by the player.",
  },
  {
    key: "isActivatedBy",
    description:
      "The subject begins an action, state change, or ability when triggered by the object.",
    example: "The door is opened by the key.",
  },
  {
    key: "isDeactivatedBy",
    description:
      "The subject stops functioning or is turned off when acted upon by the object.",
    example: "The trap is disarmed by the hero.",
  },
  {
    key: "isSpawnedBy",
    description:
      "The subject is created or summoned into the world by the object.",
    example: "The enemy is spawned by the portal.",
  },
  {
    key: "isConsumedBy",
    description:
      "The subject is used up, eaten, or burned as a resource by the object.",
    example: "The fuel is consumed by the engine.",
  },
  {
    key: "isTransformedBy",
    description:
      "The subject changes its form, type, or state as a result of the object's action.",
    example: "The seed is grown into a plant by water.",
  },
  {
    key: "isCarriedBy",
    description:
      "The subject moves with the object; its position is coupled to the object's position.",
    example: "The rider is carried by the horse.",
  },
  {
    key: "isScaredBy",
    description:
      "The subject flees from or avoids the object due to a fear response.",
    example: "The prey is scared by the predator.",
  },
  {
    key: "isChasedBy",
    description:
      "The subject is actively pursued by the object, moving away to escape.",
    example: "The player is chased by the enemy.",
  },
  {
    key: "growsOnContact",
    description:
      "The subject increases in size, population, or power when it touches or interacts with the object.",
    example: "The plant grows when touched by sunlight.",
  },
  {
    key: "shrinksOnContact",
    description:
      "The subject decreases in size or diminishes when it contacts the object.",
    example: "The snowball shrinks when exposed to heat.",
  },
  {
    key: "bounceOffOf",
    description:
      "The subject reverses or redirects its velocity when it hits the object.",
    example: "The ball bounces off the wall.",
  },
  {
    key: "sticksTo",
    description:
      "The subject adheres to the object's surface and does not separate without a force.",
    example: "The web sticks to the fly.",
  },
  {
    key: "ignites",
    description:
      "The subject sets the object on fire or causes it to begin burning.",
    example: "The torch ignites the oil.",
  },
  {
    key: "freezes",
    description:
      "The subject causes the object to become frozen, slowed, or immobilized.",
    example: "The ice spell freezes the enemy.",
  },
  {
    key: "unlocks",
    description:
      "The subject grants access to or enables a previously inaccessible state in the object.",
    example: "The key unlocks the chest.",
  },
  {
    key: "spawns",
    description:
      "The subject creates a new instance of the object into the game world.",
    example: "The factory spawns soldiers.",
  },
  {
    key: "controls",
    description:
      "The subject directs, steers, or governs the behavior of the object.",
    example: "The player controls the character.",
  },
  {
    key: "defends",
    description:
      "The subject reduces or absorbs damage or threats directed at the object.",
    example: "The shield defends the knight.",
  },
];

export const INTERACTION_ATTRIBUTE_KEYS = INTERACTION_ATTRIBUTES.map(
  (a) => a.key
) as string[];
