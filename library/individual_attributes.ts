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
      "The entity does not move on its own and is not affected by gravity or physics forces. It forms part of the level geometry.",
    example: "A wall, floor, or platform.",
  },
  {
    key: "isKinematic",
    description:
      "The entity moves along a scripted or programmatic path but is not affected by external physics forces.",
    example: "A moving platform or patrolling guard on a fixed route.",
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
    example: "A monster, guard, or rival faction unit.",
  },
  {
    key: "isNPC",
    description:
      "The entity is a non-hostile autonomous character that can be interacted with but does not attack the player.",
    example: "A shopkeeper, quest-giver, or bystander.",
  },
  {
    key: "isProjectile",
    description:
      "The entity travels through the world at speed and is typically destroyed on impact.",
    example: "An arrow, bullet, or fireball.",
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
      "The entity can be broken, destroyed, or removed from the world by taking enough damage or meeting a condition.",
    example: "A breakable crate, destructible wall, or mortal enemy.",
  },
  {
    key: "isHazard",
    description:
      "The entity damages or kills the player or other entities on contact without being an active enemy.",
    example: "Spikes, lava, or an electric fence.",
  },
  {
    key: "hasTriggerZone",
    description:
      "The entity has an invisible area; when another entity enters it, an event fires (cutscene, door opens, etc.).",
    example: "A checkpoint zone, dialogue trigger, or level-exit region.",
  },
  {
    key: "hasInventory",
    description:
      "The entity can hold and manage a collection of items or resources.",
    example: "The player's bag, a chest, or a merchant.",
  },
  {
    key: "growsOverTime",
    description:
      "The entity increases in size, strength, or population autonomously as time passes.",
    example: "A spreading fire, growing vine, or multiplying bacteria.",
  },
  {
    key: "shrinksOverTime",
    description:
      "The entity decreases in size, power, or number autonomously as time passes.",
    example: "A melting snowman, fading power-up, or decaying resource.",
  },
  {
    key: "hasHealth",
    description:
      "The entity has a numeric health value that can be reduced and that determines when it is destroyed.",
    example: "A player character, enemy, or destructible object.",
  },
  {
    key: "hasShield",
    description:
      "The entity has a secondary layer of protection that absorbs damage before health is reduced.",
    example: "A knight with a shield or a spaceship with an energy barrier.",
  },
  {
    key: "canJump",
    description:
      "The entity can leave the ground vertically under player or AI control.",
    example: "A platformer hero or a leaping enemy.",
  },
  {
    key: "canFly",
    description:
      "The entity moves freely in two or three dimensions, ignoring gravity.",
    example: "A bird, dragon, or spaceship.",
  },
  {
    key: "canSwim",
    description:
      "The entity moves through liquid without sinking or taking damage.",
    example: "A fish, swimmer, or submarine.",
  },
  {
    key: "isInvisible",
    description:
      "The entity is not rendered on screen but still participates in game logic.",
    example: "A hidden trigger collider or an invisible wall.",
  },
  {
    key: "isTransparent",
    description:
      "The entity is visible but partially see-through; other entities can overlap it visually.",
    example: "A ghost, a frosted window, or a holographic display.",
  },
  {
    key: "emitsLight",
    description:
      "The entity produces a light source that illuminates surrounding objects.",
    example: "A torch, lantern, or glowing crystal.",
  },
  {
    key: "emitsSound",
    description:
      "The entity continuously produces an ambient or looping sound.",
    example: "A waterfall, a humming machine, or a crackling fire.",
  },
  {
    key: "isInteractable",
    description:
      "The player can press a button to perform a specific action with this entity.",
    example: "A lever, NPC dialogue target, or pickable object.",
  },
  {
    key: "respawns",
    description:
      "The entity reappears at its origin point after a delay when destroyed.",
    example: "A respawning enemy, a regenerating resource node.",
  },
  {
    key: "hasGravity",
    description:
      "The entity is pulled downward by a gravity force and will fall if unsupported.",
    example: "A falling boulder, a dropped item, or a physics-driven character.",
  },
  {
    key: "isBoss",
    description:
      "The entity is a major, high-difficulty enemy with special mechanics, typically gating progression.",
    example: "A dungeon boss or final-level antagonist.",
  },
];

export const INDIVIDUAL_ATTRIBUTE_KEYS = INDIVIDUAL_ATTRIBUTES.map(
  (a) => a.key
) as string[];
