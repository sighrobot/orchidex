import { formatName, repairMalformedNaturalHybridEpithet } from "./string";

export class Grex {
  constructor(body) {
    this.__raw = body;

    const {
      id,
      genus,
      epithet,
      synonym_flag,
      synonym_genus_name,
      synonym_epithet_name,
      registrant_name,
      originator_name,
      date_of_registration,
      seed_parent_genus,
      seed_parent_epithet,
      pollen_parent_genus,
      pollen_parent_epithet,
    } = body;

    this.id = id;

    this.genus = genus;
    this.epithet = repairMalformedNaturalHybridEpithet({ epithet });

    this.registrant = registrant_name;
    this.originator = originator_name;
    this.date = date_of_registration;

    this.isSynonym = synonym_flag.includes("is  a");
    this.isPrimary = false;
    this.isNatural = false;
    this.isIntergeneric = false;

    const name = formatName({ genus: this.genus, epithet: this.epithet });
    this.name = `${name.genus} ${name.epithet}`;

    const seedParentEpithet = repairMalformedNaturalHybridEpithet({
      epithet: seed_parent_epithet,
    });
    const seedParentName = formatName({
      genus: seed_parent_genus,
      epithet: seedParentEpithet,
    });

    this.seedParent = {
      genus: seed_parent_genus,
      epithet: seedParentEpithet,
      name: `${seedParentName.genus} ${seedParentName.epithet}`,
    };

    const pollenParentEpithet = repairMalformedNaturalHybridEpithet({
      epithet: pollen_parent_epithet,
    });
    const pollenParentName = formatName({
      genus: pollen_parent_genus,
      epithet: pollenParentEpithet,
    });

    this.pollenParent = {
      genus: pollen_parent_genus,
      epithet: repairMalformedNaturalHybridEpithet({
        epithet: pollen_parent_epithet,
      }),
      name: `${pollenParentName.genus} ${pollenParentName.epithet}`,
    };

    const synonymEpithet = repairMalformedNaturalHybridEpithet({
      epithet: synonym_epithet_name,
    });

    const synonymName = formatName({
      genus: synonym_genus_name,
      epithet: synonymEpithet,
    });
    this.synonym = {
      genus: synonym_genus_name,
      epithet: synonymEpithet,
    };

    if (this.synonym.genus && this.synonym.epithet) {
      this.synonym.name = `${this.synonym.genus} ${this.synonym.epithet}`;
    }
  }

  toString() {
    return "foo";
  }
}
