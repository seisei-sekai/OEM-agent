import { z } from 'zod';

export const PriceSchema = z.object({
  amount: z.number().positive(),
  currency: z.enum(['USD', 'EUR', 'JPY', 'CNY']),
});

export type PriceData = z.infer<typeof PriceSchema>;

export class Price {
  private constructor(
    private readonly amount: number,
    private readonly currency: string
  ) {}

  static create(data: PriceData): Price {
    const validated = PriceSchema.parse(data);
    return new Price(validated.amount, validated.currency);
  }

  getAmount(): number {
    return this.amount;
  }

  getCurrency(): string {
    return this.currency;
  }

  format(): string {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: this.currency,
    });
    return formatter.format(this.amount);
  }

  toJSON(): PriceData {
    return {
      amount: this.amount,
      currency: this.currency as any,
    };
  }
}


