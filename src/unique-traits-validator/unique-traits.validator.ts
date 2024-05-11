function booleanize(
  traits: (unknown | (unknown | undefined)[] | undefined)[],
): (boolean | boolean[])[] {
  return traits.map((trait) => {
    if (Array.isArray(trait)) {
      return booleanize(trait);
    }
    return trait !== undefined;
  }) as any;
}

export function areTheTraitsWellSpecified(
  traits: (unknown | (unknown | undefined)[] | undefined)[],
) {
  traits = booleanize(traits);

  const areThereMalformedTraits = traits.some(
    (trait) => Array.isArray(trait) && !trait.every((element) => element),
  );
  if (areThereMalformedTraits) {
    return false;
  }

  const numberOfPassedTraits = traits
    .map((trait) => (Array.isArray(trait) ? trait[0] : trait)) // because all the composite traits are well-formed, all the
    // elements of each one were passed or none of them were passed
    .filter((trait) => trait).length;
  return numberOfPassedTraits === 1;
}
