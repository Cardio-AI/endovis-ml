
// TODO: convert to service
export class SetMethods {
  public static setEquality(set1: Set<string>, set2: Set<string>): boolean {
    return set1.size === set2.size &&
      [...set1].every((x) => set2.has(x));
  }

  public static setIntersection(set1: Set<string>, set2: Set<string>): Set<string> {
    return new Set([...set1].filter((x) => set2.has(x)));
  }

  public static isSubset(set: Set<string>, subset: Set<string>): boolean {
    for (let e of subset) {
      if (!set.has(e)) {
        return false;
      }
    }
    return true;
  }
}
