import type { DemoReviewPurchase } from '../types/demo';

// Muestras transcritas del HTML aprobado. No son contratos de almacenamiento.
export const smallReviewPurchase = {
  "id": "small",
  "store": "Mercado La Esquina",
  "date": "2026-11-21",
  "photoCount": 2,
  "totalCOP": 61100,
  "lines": [
    {
      "id": "small-01",
      "name": "Arroz",
      "quantityLabel": "2 bolsas de 500 g",
      "amountCOP": 7800,
      "source": "receipt",
      "priceLabel": "$ 3.900 cada una"
    },
    {
      "id": "small-02",
      "name": "Leche entera",
      "quantityLabel": "3 cajas · Presentación por confirmar",
      "amountCOP": 12600,
      "source": "receipt",
      "reviewReason": "Confirma si cada caja es de 1 L.",
      "priceLabel": "$ 4.200 cada una"
    },
    {
      "id": "small-03",
      "name": "Huevos AA",
      "quantityLabel": "1 cubeta de 30 unidades",
      "amountCOP": 18900,
      "source": "receipt",
      "priceLabel": "$ 18.900 la cubeta"
    },
    {
      "id": "small-04",
      "name": "Detergente líquido",
      "quantityLabel": "1 botella de 1 L",
      "amountCOP": 14800,
      "source": "receipt",
      "priceLabel": "$ 14.800 la botella"
    },
    {
      "id": "small-05",
      "name": "Banano",
      "quantityLabel": "1 kg",
      "amountCOP": 7000,
      "source": "manual",
      "priceLabel": "$ 7.000 por kg"
    }
  ]
} as const satisfies DemoReviewPurchase;

export const largeReviewPurchase = {
  "id": "large",
  "store": "Mercado La Esquina",
  "date": "2026-11-21",
  "photoCount": 6,
  "totalCOP": 435600,
  "lines": [
    {
      "id": "large-01",
      "name": "Arroz",
      "quantityLabel": "2 bolsas de 500 g",
      "amountCOP": 7800,
      "source": "receipt",
      "priceLabel": "Importe de esta línea, según el ejemplo del recibo."
    },
    {
      "id": "large-02",
      "name": "Leche entera",
      "quantityLabel": "3 cajas de 1 L",
      "amountCOP": 12600,
      "source": "receipt",
      "priceLabel": "Importe de esta línea, según el ejemplo del recibo."
    },
    {
      "id": "large-03",
      "name": "Huevos AA",
      "quantityLabel": "1 cubeta de 30 unidades",
      "amountCOP": 18900,
      "source": "receipt",
      "priceLabel": "Importe de esta línea, según el ejemplo del recibo."
    },
    {
      "id": "large-04",
      "name": "Café molido",
      "quantityLabel": "2 paquetes · Por confirmar",
      "amountCOP": 16800,
      "source": "receipt",
      "reviewReason": "Confirma cuántos paquetes compraste.",
      "priceLabel": "Importe de esta línea, según el ejemplo del recibo."
    },
    {
      "id": "large-05",
      "name": "Aceite vegetal",
      "quantityLabel": "1 botella de 1 L",
      "amountCOP": 10900,
      "source": "receipt",
      "priceLabel": "Importe de esta línea, según el ejemplo del recibo."
    },
    {
      "id": "large-06",
      "name": "Azúcar",
      "quantityLabel": "1 bolsa de 1 kg",
      "amountCOP": 4600,
      "source": "receipt",
      "priceLabel": "Importe de esta línea, según el ejemplo del recibo."
    },
    {
      "id": "large-07",
      "name": "Sal",
      "quantityLabel": "1 bolsa de 500 g",
      "amountCOP": 1800,
      "source": "receipt",
      "priceLabel": "Importe de esta línea, según el ejemplo del recibo."
    },
    {
      "id": "large-08",
      "name": "Harina de trigo",
      "quantityLabel": "1 bolsa de 1 kg",
      "amountCOP": 4200,
      "source": "receipt",
      "priceLabel": "Importe de esta línea, según el ejemplo del recibo."
    },
    {
      "id": "large-09",
      "name": "Pasta corta",
      "quantityLabel": "2 paquetes de 250 g",
      "amountCOP": 5800,
      "source": "receipt",
      "priceLabel": "Importe de esta línea, según el ejemplo del recibo."
    },
    {
      "id": "large-10",
      "name": "Lentejas",
      "quantityLabel": "1 bolsa de 500 g",
      "amountCOP": 4200,
      "source": "receipt",
      "priceLabel": "Importe de esta línea, según el ejemplo del recibo."
    },
    {
      "id": "large-11",
      "name": "Fríjoles",
      "quantityLabel": "1 bolsa de 500 g",
      "amountCOP": 6900,
      "source": "receipt",
      "reviewReason": "Confirma el producto que corresponde a esta línea.",
      "priceLabel": "Importe de esta línea, según el ejemplo del recibo."
    },
    {
      "id": "large-12",
      "name": "Garbanzos",
      "quantityLabel": "1 bolsa de 500 g",
      "amountCOP": 5400,
      "source": "receipt",
      "priceLabel": "Importe de esta línea, según el ejemplo del recibo."
    },
    {
      "id": "large-13",
      "name": "Atún",
      "quantityLabel": "2 latas",
      "amountCOP": 12400,
      "source": "receipt",
      "priceLabel": "Importe de esta línea, según el ejemplo del recibo."
    },
    {
      "id": "large-14",
      "name": "Sardinas",
      "quantityLabel": "1 lata",
      "amountCOP": 4900,
      "source": "receipt",
      "priceLabel": "Importe de esta línea, según el ejemplo del recibo."
    },
    {
      "id": "large-15",
      "name": "Pan tajado",
      "quantityLabel": "1 paquete",
      "amountCOP": 7200,
      "source": "receipt",
      "priceLabel": "Importe de esta línea, según el ejemplo del recibo."
    },
    {
      "id": "large-16",
      "name": "Arepas",
      "quantityLabel": "1 paquete",
      "amountCOP": 4800,
      "source": "receipt",
      "priceLabel": "Importe de esta línea, según el ejemplo del recibo."
    },
    {
      "id": "large-17",
      "name": "Queso fresco",
      "quantityLabel": "1 paquete de 500 g",
      "amountCOP": 14900,
      "source": "receipt",
      "priceLabel": "Importe de esta línea, según el ejemplo del recibo."
    },
    {
      "id": "large-18",
      "name": "Yogur natural",
      "quantityLabel": "4 vasos · Por confirmar",
      "amountCOP": 11200,
      "source": "receipt",
      "reviewReason": "Revisa la presentación de cada vaso.",
      "priceLabel": "Importe de esta línea, según el ejemplo del recibo."
    },
    {
      "id": "large-19",
      "name": "Mantequilla",
      "quantityLabel": "1 barra de 250 g",
      "amountCOP": 7400,
      "source": "receipt",
      "priceLabel": "Importe de esta línea, según el ejemplo del recibo."
    },
    {
      "id": "large-20",
      "name": "Chocolate de mesa",
      "quantityLabel": "1 paquete",
      "amountCOP": 8500,
      "source": "receipt",
      "priceLabel": "Importe de esta línea, según el ejemplo del recibo."
    },
    {
      "id": "large-21",
      "name": "Avena en hojuelas",
      "quantityLabel": "1 bolsa de 500 g",
      "amountCOP": 4900,
      "source": "receipt",
      "priceLabel": "Importe de esta línea, según el ejemplo del recibo."
    },
    {
      "id": "large-22",
      "name": "Cereal",
      "quantityLabel": "1 caja",
      "amountCOP": 12800,
      "source": "receipt",
      "priceLabel": "Importe de esta línea, según el ejemplo del recibo."
    },
    {
      "id": "large-23",
      "name": "Galletas integrales",
      "quantityLabel": "1 paquete",
      "amountCOP": 6200,
      "source": "receipt",
      "priceLabel": "Importe de esta línea, según el ejemplo del recibo."
    },
    {
      "id": "large-24",
      "name": "Mermelada",
      "quantityLabel": "1 frasco",
      "amountCOP": 8900,
      "source": "receipt",
      "priceLabel": "Importe de esta línea, según el ejemplo del recibo."
    },
    {
      "id": "large-25",
      "name": "Miel",
      "quantityLabel": "1 frasco",
      "amountCOP": 14500,
      "source": "receipt",
      "priceLabel": "Importe de esta línea, según el ejemplo del recibo."
    },
    {
      "id": "large-26",
      "name": "Tomate",
      "quantityLabel": "1 kg",
      "amountCOP": 5400,
      "source": "receipt",
      "priceLabel": "Importe de esta línea, según el ejemplo del recibo."
    },
    {
      "id": "large-27",
      "name": "Cebolla cabezona",
      "quantityLabel": "1 kg · Por confirmar",
      "amountCOP": 3900,
      "source": "receipt",
      "reviewReason": "Confirma el peso comprado.",
      "priceLabel": "Importe de esta línea, según el ejemplo del recibo."
    },
    {
      "id": "large-28",
      "name": "Papa",
      "quantityLabel": "2 kg",
      "amountCOP": 6800,
      "source": "receipt",
      "priceLabel": "Importe de esta línea, según el ejemplo del recibo."
    },
    {
      "id": "large-29",
      "name": "Zanahoria",
      "quantityLabel": "1 kg",
      "amountCOP": 3200,
      "source": "receipt",
      "priceLabel": "Importe de esta línea, según el ejemplo del recibo."
    },
    {
      "id": "large-30",
      "name": "Pepino",
      "quantityLabel": "1 kg",
      "amountCOP": 2800,
      "source": "receipt",
      "priceLabel": "Importe de esta línea, según el ejemplo del recibo."
    },
    {
      "id": "large-31",
      "name": "Limón",
      "quantityLabel": "1 kg",
      "amountCOP": 4600,
      "source": "receipt",
      "priceLabel": "Importe de esta línea, según el ejemplo del recibo."
    },
    {
      "id": "large-32",
      "name": "Manzana",
      "quantityLabel": "1 kg",
      "amountCOP": 8900,
      "source": "receipt",
      "priceLabel": "Importe de esta línea, según el ejemplo del recibo."
    },
    {
      "id": "large-33",
      "name": "Naranja",
      "quantityLabel": "2 kg",
      "amountCOP": 9600,
      "source": "receipt",
      "priceLabel": "Importe de esta línea, según el ejemplo del recibo."
    },
    {
      "id": "large-34",
      "name": "Papaya",
      "quantityLabel": "1 unidad",
      "amountCOP": 7200,
      "source": "receipt",
      "priceLabel": "Importe de esta línea, según el ejemplo del recibo."
    },
    {
      "id": "large-35",
      "name": "Piña",
      "quantityLabel": "1 unidad",
      "amountCOP": 6900,
      "source": "receipt",
      "priceLabel": "Importe de esta línea, según el ejemplo del recibo."
    },
    {
      "id": "large-36",
      "name": "Pollo",
      "quantityLabel": "1 kg · Por confirmar",
      "amountCOP": 12800,
      "source": "receipt",
      "reviewReason": "Confirma el peso comprado.",
      "priceLabel": "Importe de esta línea, según el ejemplo del recibo."
    },
    {
      "id": "large-37",
      "name": "Carne de res",
      "quantityLabel": "1 kg",
      "amountCOP": 24900,
      "source": "receipt",
      "priceLabel": "Importe de esta línea, según el ejemplo del recibo."
    },
    {
      "id": "large-38",
      "name": "Pescado",
      "quantityLabel": "1 kg",
      "amountCOP": 21800,
      "source": "receipt",
      "priceLabel": "Importe de esta línea, según el ejemplo del recibo."
    },
    {
      "id": "large-39",
      "name": "Jabón de baño",
      "quantityLabel": "2 unidades",
      "amountCOP": 6200,
      "source": "receipt",
      "priceLabel": "Importe de esta línea, según el ejemplo del recibo."
    },
    {
      "id": "large-40",
      "name": "Champú",
      "quantityLabel": "1 botella de 400 ml",
      "amountCOP": 15900,
      "source": "receipt",
      "priceLabel": "Importe de esta línea, según el ejemplo del recibo."
    },
    {
      "id": "large-41",
      "name": "Pasta dental",
      "quantityLabel": "1 tubo",
      "amountCOP": 8900,
      "source": "receipt",
      "priceLabel": "Importe de esta línea, según el ejemplo del recibo."
    },
    {
      "id": "large-42",
      "name": "Papel higiénico",
      "quantityLabel": "1 paquete de 4 rollos",
      "amountCOP": 12500,
      "source": "receipt",
      "priceLabel": "Importe de esta línea, según el ejemplo del recibo."
    },
    {
      "id": "large-43",
      "name": "Detergente líquido",
      "quantityLabel": "1 botella de 1 L",
      "amountCOP": 14800,
      "source": "receipt",
      "priceLabel": "Importe de esta línea, según el ejemplo del recibo."
    },
    {
      "id": "large-44",
      "name": "Lavaloza",
      "quantityLabel": "1 botella de 500 ml",
      "amountCOP": 6900,
      "source": "receipt",
      "priceLabel": "Importe de esta línea, según el ejemplo del recibo."
    },
    {
      "id": "large-45",
      "name": "Limpiador de pisos",
      "quantityLabel": "1 botella · Por confirmar",
      "amountCOP": 7800,
      "source": "receipt",
      "reviewReason": "Confirma el contenido de la botella.",
      "priceLabel": "Importe de esta línea, según el ejemplo del recibo."
    },
    {
      "id": "large-46",
      "name": "Bolsas para basura",
      "quantityLabel": "1 paquete",
      "amountCOP": 5400,
      "source": "receipt",
      "priceLabel": "Importe de esta línea, según el ejemplo del recibo."
    },
    {
      "id": "large-47",
      "name": "Esponjas",
      "quantityLabel": "1 paquete",
      "amountCOP": 3800,
      "source": "receipt",
      "priceLabel": "Importe de esta línea, según el ejemplo del recibo."
    },
    {
      "id": "large-48",
      "name": "Banano",
      "quantityLabel": "1 kg",
      "amountCOP": 7000,
      "source": "manual",
      "priceLabel": "Importe de esta línea, según el ejemplo del recibo."
    },
    {
      "id": "large-49",
      "name": "Aguacate",
      "quantityLabel": "2 unidades",
      "amountCOP": 7600,
      "source": "manual",
      "priceLabel": "Importe de esta línea, según el ejemplo del recibo."
    },
    {
      "id": "large-50",
      "name": "Cilantro",
      "quantityLabel": "1 manojo",
      "amountCOP": 1500,
      "source": "manual",
      "priceLabel": "Importe de esta línea, según el ejemplo del recibo."
    }
  ]
} as const satisfies DemoReviewPurchase;
