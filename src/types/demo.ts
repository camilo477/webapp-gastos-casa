// Tipos de presentación de datos ficticios. No definen el modelo de Firebase.
export type DemoCategory = 'Alimentos' | 'Limpieza' | 'Cuidado personal';

type ProductBase = { readonly id: string; readonly name: string; readonly category: DemoCategory };
export type DemoProduct = ProductBase & (
  | { readonly control: 'exact'; readonly quantity: number; readonly unit: 'kg' | 'L' | 'unidades' }
  | { readonly control: 'simple'; readonly state: 'available' | 'low' | 'empty' }
);

export type DemoPurchase = {
  readonly id: string;
  readonly store: string;
  readonly date: string;
  readonly totalCOP: number;
};

export type DemoPurchaseLine = {
  readonly id: string;
  readonly name: string;
  readonly quantityLabel: string;
  readonly amountCOP: number;
  readonly source: 'receipt' | 'manual';
  readonly reviewReason?: string;
  readonly priceLabel?: string;
};

export type DemoReviewPurchase = DemoPurchase & {
  readonly photoCount: number;
  readonly lines: readonly DemoPurchaseLine[];
};

export type DemoListItem = { readonly id: string; readonly name: string; readonly purchased: boolean };
