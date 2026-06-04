/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SKUData {
  status: string;     // e.g., "NPD Letter Released"
  productCode: string;
  descriptionProduct: string;
  brand: string;
  assortment: string; // e.g., "Must Have SKU", "Best Selling SKU", "Popular SKU", "Other SKU"
  category: string;   // e.g., "Skincare", "Makeup"
  segment: string;    // e.g., "Face", "Eyes", "Lips", "Sunscreen", "Base Makeup"
  subsegment: string; // e.g., "Toner", "Serum", "Face Cream", "Eye Cream", "Sunscreen Cream", "Lip Serum", "Cushion Compact", "Pressed Powder", "Cleanser", "Applied Masks"
  priceSIP: number;   // Price For Distri
  priceSTP: number;   // Price For Store
}

export const SKU_DATABASE: SKUData[] = [
  {
    status: "NPD Letter Released",
    productCode: "SKINTIFIC-02",
    descriptionProduct: "SKINTIFIC 4D HYALURONIC ACID BARRIER ESSENCE TONER 100ML",
    brand: "SKINTIFIC",
    assortment: "Other SKU",
    category: "Skincare",
    segment: "Face",
    subsegment: "Toner",
    priceSIP: 81200,
    priceSTP: 89320
  },
  {
    status: "NPD Letter Released",
    productCode: "SKINTIFIC-04",
    descriptionProduct: "SKINTIFIC 10% NIACINAMIDE BRIGHTENING SERUM 20ML",
    brand: "SKINTIFIC",
    assortment: "Must Have SKU",
    category: "Skincare",
    segment: "Face",
    subsegment: "Serum",
    priceSIP: 97300,
    priceSTP: 107030
  },
  {
    status: "NPD Letter Released",
    productCode: "SKINTIFIC-05",
    descriptionProduct: "SKINTIFIC 5X CERAMIDE BARRIER REPAIR MOISTURIZE GEL 30G",
    brand: "SKINTIFIC",
    assortment: "Must Have SKU",
    category: "Skincare",
    segment: "Face",
    subsegment: "Face Cream",
    priceSIP: 97300,
    priceSTP: 107030
  },
  {
    status: "NPD Letter Released",
    productCode: "SKINTIFIC-07",
    descriptionProduct: "SKINTIFIC 2% SALICYLIC ACID ANTI ACNE SERUM 20ML",
    brand: "SKINTIFIC",
    assortment: "Popular SKU",
    category: "Skincare",
    segment: "Face",
    subsegment: "Serum",
    priceSIP: 97300,
    priceSTP: 107030
  },
  {
    status: "NPD Letter Released",
    productCode: "SKINTIFIC-09",
    descriptionProduct: "SKINTIFIC 360 CRYSTAL MASSAGER LIFTING EYE CREAM 20G",
    brand: "SKINTIFIC",
    assortment: "Popular SKU",
    category: "Skincare",
    segment: "Eyes",
    subsegment: "Eye Cream",
    priceSIP: 118300,
    priceSTP: 130130
  },
  {
    status: "NPD Letter Released",
    productCode: "SKINTIFIC-10",
    descriptionProduct: "LIGHT SERUM SUNSCREEN SPF50 PA ++++",
    brand: "SKINTIFIC",
    assortment: "Best Selling SKU",
    category: "Skincare",
    segment: "Sunscreen",
    subsegment: "Sunscreen Cream",
    priceSIP: 69300,
    priceSTP: 76230
  },
  {
    status: "NPD Letter Released",
    productCode: "SKINTIFIC-114",
    descriptionProduct: "SKINTIFIC 3X ACID ACNE CARE GEL MOISTURIZER",
    brand: "SKINTIFIC",
    assortment: "Best Selling SKU",
    category: "Skincare",
    segment: "Face",
    subsegment: "Face Cream",
    priceSIP: 97300,
    priceSTP: 107030
  },
  {
    status: "NPD Letter Released",
    productCode: "SKINTIFIC-12",
    descriptionProduct: "SKINTIFIC 5X CERAMIDE SOOTHING TONER 80ML",
    brand: "SKINTIFIC",
    assortment: "Best Selling SKU",
    category: "Skincare",
    segment: "Face",
    subsegment: "Toner",
    priceSIP: 81200,
    priceSTP: 89320
  },
  {
    status: "NPD Letter Released",
    productCode: "SKINTIFIC-120",
    descriptionProduct: "SKINTIFIC 3X ACID INTENSIVE ACNE SPOT 11G",
    brand: "SKINTIFIC",
    assortment: "Popular SKU",
    category: "Skincare",
    segment: "Face",
    subsegment: "Serum",
    priceSIP: 69300,
    priceSTP: 76230
  },
  {
    status: "NPD Letter Released",
    productCode: "SKINTIFIC-122",
    descriptionProduct: "SKINTIFIC AQUA LIGHT DAILY SUNSCREEN 30g",
    brand: "SKINTIFIC",
    assortment: "Best Selling SKU",
    category: "Skincare",
    segment: "Sunscreen",
    subsegment: "Sunscreen Cream",
    priceSIP: 55300,
    priceSTP: 60830
  },
  {
    status: "NPD Letter Released",
    productCode: "SKINTIFIC-123",
    descriptionProduct: "SKINTIFIC BRIGHTENING LIP SERUM",
    brand: "SKINTIFIC",
    assortment: "Other SKU",
    category: "Skincare",
    segment: "Lips",
    subsegment: "Lip Serum",
    priceSIP: 76923,
    priceSTP: 84615
  },
  {
    status: "NPD Letter Released",
    productCode: "SKINTIFIC-1234",
    descriptionProduct: "SKINTIFIC BRIGHTENING LIP SERUM PINK BERRY",
    brand: "SKINTIFIC",
    assortment: "Best Selling SKU",
    category: "Skincare",
    segment: "Lips",
    subsegment: "Lip Serum",
    priceSIP: 81200,
    priceSTP: 89320
  },
  {
    status: "NPD Letter Released",
    productCode: "SKINTIFIC-1235",
    descriptionProduct: "SKINTIFIC BRIGHTENING LIP SERUM PEACH ROSE",
    brand: "SKINTIFIC",
    assortment: "Best Selling SKU",
    category: "Skincare",
    segment: "Lips",
    subsegment: "Lip Serum",
    priceSIP: 81200,
    priceSTP: 89320
  },
  {
    status: "NPD Letter Released",
    productCode: "SKINTIFIC-1236",
    descriptionProduct: "SKINTIFIC BRIGHTENING LIP SERUM CHERRY RED",
    brand: "SKINTIFIC",
    assortment: "Best Selling SKU",
    category: "Skincare",
    segment: "Lips",
    subsegment: "Lip Serum",
    priceSIP: 81200,
    priceSTP: 89320
  },
  {
    status: "NPD Letter Released",
    productCode: "SKINTIFIC-129",
    descriptionProduct: "SKINTIFIC 3X ACID ACNE GEL CLEANSER",
    brand: "SKINTIFIC",
    assortment: "Best Selling SKU",
    category: "Skincare",
    segment: "Face",
    subsegment: "Cleanser",
    priceSIP: 69300,
    priceSTP: 76230
  },
  {
    status: "NPD Letter Released",
    productCode: "SKINTIFIC-13",
    descriptionProduct: "SKINTIFIC 5X CERAMIDE BARRIER SERUM 20ML",
    brand: "SKINTIFIC",
    assortment: "Best Selling SKU",
    category: "Skincare",
    segment: "Face",
    subsegment: "Serum",
    priceSIP: 90300,
    priceSTP: 99330
  },
  {
    status: "NPD Letter Released",
    productCode: "SKINTIFIC-1340",
    descriptionProduct: "SKINTIFIC PERFECT STAY VELVET MATTE CUSHION 00 PORCELAIN",
    brand: "SKINTIFIC",
    assortment: "Other SKU",
    category: "Makeup",
    segment: "Base Makeup",
    subsegment: "Cushion Compact",
    priceSIP: 118300,
    priceSTP: 130130
  },
  {
    status: "NPD Letter Released",
    productCode: "SKINTIFIC-1341",
    descriptionProduct: "SKINTIFIC PERFECT STAY VELVET MATTE CUSHION 01 VANILLA",
    brand: "SKINTIFIC",
    assortment: "Must Have SKU",
    category: "Makeup",
    segment: "Base Makeup",
    subsegment: "Cushion Compact",
    priceSIP: 118300,
    priceSTP: 130130
  },
  {
    status: "NPD Letter Released",
    productCode: "SKINTIFIC-1342",
    descriptionProduct: "SKINTIFIC PERFECT STAY VELVET MATTE CUSHION 02 IVORY",
    brand: "SKINTIFIC",
    assortment: "Must Have SKU",
    category: "Makeup",
    segment: "Base Makeup",
    subsegment: "Cushion Compact",
    priceSIP: 118300,
    priceSTP: 130130
  },
  {
    status: "NPD Letter Released",
    productCode: "SKINTIFIC-1343",
    descriptionProduct: "SKINTIFIC PERFECT STAY VELVET MATTE CUSHION 03 PETAL",
    brand: "SKINTIFIC",
    assortment: "Must Have SKU",
    category: "Makeup",
    segment: "Base Makeup",
    subsegment: "Cushion Compact",
    priceSIP: 118300,
    priceSTP: 130130
  },
  {
    status: "NPD Letter Released",
    productCode: "SKINTIFIC-1343A",
    descriptionProduct: "SKINTIFIC PERFECT STAY VELVET MATTE CUSHION 03A ALMOND",
    brand: "SKINTIFIC",
    assortment: "Popular SKU",
    category: "Makeup",
    segment: "Base Makeup",
    subsegment: "Cushion Compact",
    priceSIP: 118300,
    priceSTP: 130130
  },
  {
    status: "NPD Letter Released",
    productCode: "SKINTIFIC-1344",
    descriptionProduct: "SKINTIFIC PERFECT STAY VELVET MATTE CUSHION 04 BEIGE",
    brand: "SKINTIFIC",
    assortment: "Popular SKU",
    category: "Makeup",
    segment: "Base Makeup",
    subsegment: "Cushion Compact",
    priceSIP: 118300,
    priceSTP: 130130
  },
  {
    status: "NPD Letter Released",
    productCode: "SKINTIFIC-1345",
    descriptionProduct: "SKINTIFIC PERFECT STAY VELVET MATTE CUSHION 05 SAND",
    brand: "SKINTIFIC",
    assortment: "Other SKU",
    category: "Makeup",
    segment: "Base Makeup",
    subsegment: "Cushion Compact",
    priceSIP: 118300,
    priceSTP: 130130
  },
  {
    status: "NPD Letter Released",
    productCode: "SKINTIFIC-147",
    descriptionProduct: "SKINTIFIC BRIGH BOOST CLAY STICK",
    brand: "SKINTIFIC",
    assortment: "Best Selling SKU",
    category: "Skincare",
    segment: "Face",
    subsegment: "Applied Masks",
    priceSIP: 62300,
    priceSTP: 68530
  },
  {
    status: "NPD Letter Released",
    productCode: "SKINTIFIC-152",
    descriptionProduct: "SKINTIFIC 377 DARK SPOT ESSENCE TONER",
    brand: "SKINTIFIC",
    assortment: "Popular SKU",
    category: "Skincare",
    segment: "Face",
    subsegment: "Toner",
    priceSIP: 81200,
    priceSTP: 89320
  },
  {
    status: "NPD Letter Released",
    productCode: "SKINTIFIC-1600",
    descriptionProduct: "SKINTIFIC ULTRA COVER POWDER FOUNDATION 00 PORCELAIN",
    brand: "SKINTIFIC",
    assortment: "Other SKU",
    category: "Makeup",
    segment: "Base Makeup",
    subsegment: "Pressed Powder",
    priceSIP: 104300,
    priceSTP: 114730
  },
  {
    status: "NPD Letter Released",
    productCode: "SKINTIFIC-1601",
    descriptionProduct: "SKINTIFIC ULTRA COVER POWDER FOUNDATION 01 VANILLA",
    brand: "SKINTIFIC",
    assortment: "Popular SKU",
    category: "Makeup",
    segment: "Base Makeup",
    subsegment: "Pressed Powder",
    priceSIP: 104300,
    priceSTP: 114730
  },
  {
    status: "NPD Letter Released",
    productCode: "GLAD2GLOW-01",
    descriptionProduct: "GLAD2GLOW CENTELLA ALLANTOIN SOOTHING GEL CREAM 30G",
    brand: "GLAD2GLOW",
    assortment: "Best Selling SKU",
    category: "Skincare",
    segment: "Face",
    subsegment: "Face Cream",
    priceSIP: 39000,
    priceSTP: 42900
  },
  {
    status: "NPD Letter Released",
    productCode: "GLAD2GLOW-02",
    descriptionProduct: "GLAD2GLOW ULTRA LIGHT SUNSCREEN GEL SPF 50",
    brand: "GLAD2GLOW",
    assortment: "Must Have SKU",
    category: "Skincare",
    segment: "Sunscreen",
    subsegment: "Sunscreen Cream",
    priceSIP: 41000,
    priceSTP: 45100
  },
  {
    status: "NPD Letter Released",
    productCode: "GLAD2GLOW-03",
    descriptionProduct: "GLAD2GLOW POMEGRANATE 5% NIACINAMIDE MOISTURIZER",
    brand: "GLAD2GLOW",
    assortment: "Best Selling SKU",
    category: "Skincare",
    segment: "Face",
    subsegment: "Face Cream",
    priceSIP: 39000,
    priceSTP: 42900
  },
  {
    status: "NPD Letter Released",
    productCode: "GLAD2GLOW-04",
    descriptionProduct: "GLAD2GLOW SALICYLIC ACID ACNE GEL CLEANSER 120ML",
    brand: "GLAD2GLOW",
    assortment: "Popular SKU",
    category: "Skincare",
    segment: "Face",
    subsegment: "Cleanser",
    priceSIP: 32000,
    priceSTP: 35200
  },
  {
    status: "NPD Letter Released",
    productCode: "GLAD2GLOW-05",
    descriptionProduct: "GLAD2GLOW BERRY LIP MASK 10G",
    brand: "GLAD2GLOW",
    assortment: "Other SKU",
    category: "Skincare",
    segment: "Lips",
    subsegment: "Lip Serum",
    priceSIP: 27000,
    priceSTP: 29700
  }
];
