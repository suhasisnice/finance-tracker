// Categorical palette shared by the donut and bar charts so a category keeps
// the same colour across both (colour follows the entity, assigned in the fixed
// sorted-by-total order the backend returns — never cycled per chart).
export const CATEGORY_PALETTE = [
  "#7c6ff7", "#34d399", "#f87171", "#fbbf24",
  "#60a5fa", "#a78bfa", "#fb923c", "#f472b6",
  "#2dd4bf", "#a3e635",
];

export const categoryColor = (i) => CATEGORY_PALETTE[i % CATEGORY_PALETTE.length];
