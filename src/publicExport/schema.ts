export type ExportGear = {
  uniqueName: string;
  name: string;
  description: string;
  codexSecret: boolean;
  parentName: string;
};

export type ExportRecipe = {
  uniqueName: string;
  resultType: string;
  codexSecret: boolean;
  excludeFromCodex?: boolean;
  alwaysAvailable?: boolean;
  num: number;
  ingredients: {
    ItemType: string;
    ItemCount: number;
    ProductCategory: string;
  }[];
  secretIngredients: [];
  consumeOnUse: boolean;
  buildPrice: number;
  buildTime: number;
  skipBuildTimePrice: number;
  primeSellingPrice?: number;
};

export type ExportResource = {
  uniqueName: string;
  name: string;
  codexSecret: boolean;
  excludeFromCodex?: boolean;
  showInInventory?: boolean;
  description: string;
  longDescription?: string;
  parentName: string;
  primeSellingPrice?: number;
};

export type ExportWeapon = {
  name: string;
  uniqueName: string;
  description: string;
  omegaAttenuation: number;
  fireRate: number;
  procChance: number;
  totalDamage: number;
  masteryReq: number;
  criticalChance: number;
  criticalMultiplier: number;
} & (
  | {
      // regular guns
      productCategory: "LongGuns" | "OperatorAmps" | "Pistols" | "SentinelWeapons" | "SpaceGuns";
      slot: number;
      noise: "ALARMING" | "SILENT";
      damagePerShot: DamagePerShot;
    }
  | {
      // melee
      productCategory: "Melee" | "SpaceMelee";
      slot: number;
      followThrough: number;
      comboDuration: number;
      slideAttack: number;
      range: number;
      slamAttack: number;
      slamRadius: number;
      blockingAngle: number;
      slamRadialDamage: number;
      heavyAttackDamage: number;
      heavySlamAttack: number;
      // archmelee don't have heavy slam radius for whatever reason
      heavySlamRadialDamage?: number;
      heavySlamRadius?: number;
    }
  | {
      // hound melees
      productCategory: "SentinelWeapons";
      blockingAngle: number;
    }
  | {
      // Dark Split-Sword base stats depend on the equipped stance, so they don't appear in the schema
      uniqueName: "/Lotus/Weapons/Tenno/Melee/Swords/DarkSword/DarkSwordDaggerHybridWeapon";
      slot: number;
      productCategory: string;
    }
  | {
      // exalted weapons do not follow a consistent schema
      productCategory: "SpecialItems";
      slot: number;
    }
);

export type DamagePerShot = [
  number, // I
  number, // P
  number, // S
  number, // Heat
  number, // Cold
  number, // Electric
  number, // Toxin
  number, // Blast
  number, // Radiation
  number, // Gas
  number, // Mag
  number, // Viral
  number, // Corrosive
  number, // Void
  number, // Tau
  number, // Cinematic
  number, // Shield Drain
  number, // Health Drain
  number, // Energy Drain
  number, // True
];

export type ExportSentinel = {
  uniqueName: string;
  name: string;
  productCategory: string;
};
export type ExportWarframe = {
  uniqueName: string;
  name: string;
  productCategory: string;
};

export type ExportNightwave = {
  affiliationTag: string;
  challenges: {
    uniqueName: string;
    name: string;
    description: string;
    standing: number;
    required: number;
  }[];
  rewards: {
    uniqueName: string;
    [fieldName: string]: string;
  }[];
};
