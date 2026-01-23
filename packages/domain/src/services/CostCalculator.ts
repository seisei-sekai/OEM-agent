import { Price } from '../value-objects/Price.js';

export interface CostCalculationInput {
  basePrice: Price;
  quantity: number;
  printMethod?: string;
  additionalCosts?: Price[];
}

export class CostCalculator {
  calculateTotalCost(input: CostCalculationInput): Price {
    let total = input.basePrice.getAmount() * input.quantity;

    // Add volume discounts
    if (input.quantity >= 500) {
      total *= 0.85; // 15% discount
    } else if (input.quantity >= 200) {
      total *= 0.90; // 10% discount
    } else if (input.quantity >= 100) {
      total *= 0.95; // 5% discount
    }

    // Add print method costs
    if (input.printMethod === 'embroidery') {
      total += input.quantity * 2.5;
    } else if (input.printMethod === 'screen-print') {
      total += input.quantity * 1.0;
    }

    // Add additional costs
    if (input.additionalCosts) {
      for (const cost of input.additionalCosts) {
        total += cost.getAmount();
      }
    }

    return Price.create({
      amount: Math.round(total * 100) / 100,
      currency: input.basePrice.getCurrency() as any,
    });
  }

  calculateUnitPrice(totalCost: Price, quantity: number): Price {
    if (quantity <= 0) {
      throw new Error('Quantity must be greater than zero');
    }
    
    return Price.create({
      amount: Math.round((totalCost.getAmount() / quantity) * 100) / 100,
      currency: totalCost.getCurrency() as any,
    });
  }
}

