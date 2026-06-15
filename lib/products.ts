export type Product = {
  id: string;
  name: string;
  category: "premium" | "wellness" | "team" | "executive";
  description: string;
  priceFrom: number;
  minQuantity: number;
  leadTimeDays: number;
  tags: string[];
};

export const products: Product[] = [
  {
    id: "jade-lantern",
    name: "Jade Lantern Executive Box",
    category: "executive",
    description: "A polished executive hamper with mooncakes, tea, ceramic ware, and personalized greeting cards.",
    priceFrom: 68,
    minQuantity: 30,
    leadTimeDays: 12,
    tags: ["VIP clients", "custom card", "tea pairing"]
  },
  {
    id: "harvest-gold",
    name: "Harvest Gold Partner Set",
    category: "premium",
    description: "A premium corporate gifting set designed for partner appreciation and branded unboxing moments.",
    priceFrom: 44,
    minQuantity: 50,
    leadTimeDays: 10,
    tags: ["partners", "foil logo", "bulk ready"]
  },
  {
    id: "lotus-care",
    name: "Lotus Care Wellness Gift",
    category: "wellness",
    description: "Mooncakes, herbal tea, dried fruit, and a wellness note for employee recognition programs.",
    priceFrom: 29,
    minQuantity: 100,
    leadTimeDays: 8,
    tags: ["employees", "wellness", "budget friendly"]
  },
  {
    id: "team-moon",
    name: "Team Moon Celebration Pack",
    category: "team",
    description: "A scalable team gifting pack with assorted mooncakes and optional department-level personalization.",
    priceFrom: 19,
    minQuantity: 200,
    leadTimeDays: 7,
    tags: ["teams", "large volume", "fast lead time"]
  }
];
