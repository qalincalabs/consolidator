import { EJSON } from 'bson'

// unless rules applied one after the other
// only setIfEmpty and setUnlessSourceEmpty
// TODO add "keep", "set" actions
// TODO only isRoot supported
export const protectiveConsolidation = {
  action: "setIfEmpty",
  unless: [
    {
      filter: { regex: /status$/, isRoot: true },
      action: "setUnlessSourceEmpty",
    },
  ],
};

export const defensiveConsolidation = {
  action: "setIfEmpty",
  unless: [
    {
      filter: { regex: /status$/, isRoot: true },
      action: "setUnlessSourceEmpty",
    },
    {
      filter: { regex: /^name$/, isRoot: true },
      action: "setUnlessSourceEmpty",
    },

    {
      filter: { regex: /^description$/, isRoot: true },
      action: "setUnlessSourceEmpty",
    },
  ],
};

export const aggressiveConsolidation = {
  action: "setUnlessSourceEmpty",
};

export class Consolidator {
  constructor(value, current) {
    this.value = value;
    this.current = current;
  }

  get combinedIds() {
    return [...new Set(this.current.ids.concat(this.value.ids))];
  }

  get sameIds() {
    var setB = new Set(this.value.ids);
    return [...new Set(this.current.ids)].filter((x) => setB.has(x));
  }

  get aggressiveConsolidation() {
    return this.consolidate(aggressiveConsolidation);
  }

  get defensiveConsolidation() {
    return this.consolidate(defensiveConsolidation);
  }

  get protectiveConsolidation() {
    return this.consolidate(protectiveConsolidation);
  }

  isSameAsAggressiveConsolidation() {
    this.isSameAsConsolidation(aggressiveConsolidation);
  }

  isSameAsDefensiveConsolidation() {
    this.isSameAsConsolidation(defensiveConsolidation);
  }

  isSameAsProtectiveConsolidation() {
    this.isSameAsConsolidation(protectiveConsolidation);
  }

  isSameAsConsolidation(profile) {
    return (
      EJSON.stringify(this.current) ===
      EJSON.stringify(this.consolidate(profile))
    );
  }

  canConsolidate() {
    return this.sameIds.length > 0;
  }

  consolidate(profile) {
    let consolidation = {};

    switch (profile.action) {
      case "setIfEmpty":
        consolidation = {
          ...this.value,
          ...this.current,
        };
        break;
      case "setUnlessSourceEmpty":
        consolidation = {
          ...this.current,
          ...this.value,
        };
        break;
      default:
      // TODO return error
    }

    // TODO unless implementation incomplete
    if (profile.unless != null) {
      for (const p of Object.keys(this.value)) {
        for (const r of profile.unless) {
          if (
            r.action == "setUnlessSourceEmpty" &&
            p.match(r.filter.regex) &&
            this.value[p] != null
          )
            consolidation[p] = this.value[p];
        }
      }
    }

    consolidation._id = this.current._id;
    consolidation.ids = this.combinedIds;

    return consolidation;
  }
}
