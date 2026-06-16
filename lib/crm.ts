export const leadStatuses = ["new", "contacted", "qualified", "quoted", "negotiating", "won", "lost"] as const;
export type LeadStatus = (typeof leadStatuses)[number];

export const leadStatusLabels: Record<LeadStatus, string> = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  quoted: "Quoted",
  negotiating: "Negotiating",
  won: "Won",
  lost: "Lost"
};

export const forecastWeights: Record<LeadStatus, number> = {
  new: 0.1,
  contacted: 0.2,
  qualified: 0.4,
  quoted: 0.6,
  negotiating: 0.8,
  won: 1,
  lost: 0
};
