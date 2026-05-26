export type LineType = "tradicional" | "arabe";

export type CostSettings = {
  liquidCostPerBottle: number;
  traditionalBottleCost: number;
  arabBottleCost: number;
  traditionalExtraCost: number;
  arabExtraCost: number;
  cardFeePercent: number;
};

export const DEFAULT_COST_SETTINGS: CostSettings = {
  liquidCostPerBottle: 10,
  traditionalBottleCost: 14.75,
  arabBottleCost: 31.4,
  traditionalExtraCost: 5.25,
  arabExtraCost: 8.6,
  cardFeePercent: 3.5,
};

export function getEstimatedUnitCost(
  lineType: LineType,
  settings: CostSettings = DEFAULT_COST_SETTINGS
) {
  if (lineType === "arabe") {
    return (
      settings.liquidCostPerBottle +
      settings.arabBottleCost +
      settings.arabExtraCost
    );
  }

  return (
    settings.liquidCostPerBottle +
    settings.traditionalBottleCost +
    settings.traditionalExtraCost
  );
}

export function calculateCardFee(
  total: number,
  paymentMethod: string,
  settings: CostSettings = DEFAULT_COST_SETTINGS
) {
  if (paymentMethod !== "cartão") {
    return 0;
  }

  return total * (settings.cardFeePercent / 100);
}

export function calculateSaleProfit(
  sale: {
    lineType: LineType;
    unitPrice: number;
    quantity: number;
    paymentMethod: string;
  },
  settings: CostSettings = DEFAULT_COST_SETTINGS
) {
  const revenue = sale.unitPrice * sale.quantity;
  const estimatedCost = getEstimatedUnitCost(sale.lineType, settings) * sale.quantity;
  const cardFee = calculateCardFee(revenue, sale.paymentMethod, settings);
  const grossProfit = revenue - estimatedCost;
  const netProfit = grossProfit - cardFee;
  const marginPercent = revenue > 0 ? (netProfit / revenue) * 100 : 0;

  return {
    revenue,
    estimatedCost,
    cardFee,
    grossProfit,
    netProfit,
    marginPercent,
  };
}
