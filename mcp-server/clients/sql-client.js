import { PRODUCTS } from "./mock-data.js";

const DATABASE_URL =
  process.env.DATABASE_URL ??
  "postgresql://hardware:hardware@sql-database:5432/hardware";

/**
 * Look up price and stock for a part number. Returns mock data until the
 * PostgreSQL backend at DATABASE_URL is implemented and wired in.
 */
export async function getStockAndPrice(partNumber) {
  console.error(
    `[sql-client] mock lookup (DATABASE_URL=${DATABASE_URL}): ${partNumber}`,
  );

  const product = PRODUCTS.find(
    (item) => item.part_number.toLowerCase() === partNumber.toLowerCase(),
  );

  if (!product) {
    return {
      found: false,
      part_number: partNumber,
      backend: "mock",
      database_url: DATABASE_URL,
      message: `No product found for part number: ${partNumber}`,
    };
  }

  return {
    found: true,
    backend: "mock",
    database_url: DATABASE_URL,
    part_number: product.part_number,
    product_name: product.product_name,
    brand: product.brand,
    category: product.category,
    unit_price: product.unit_price,
    currency: product.currency,
    stock_level: product.stock_level,
    warehouse_shelf: product.warehouse_shelf,
  };
}

/**
 * List the full product catalog. Returns mock data until the PostgreSQL
 * backend at DATABASE_URL is implemented and wired in.
 */
export async function listParts() {
  console.error(`[sql-client] mock catalog (DATABASE_URL=${DATABASE_URL})`);

  return {
    backend: "mock",
    database_url: DATABASE_URL,
    count: PRODUCTS.length,
    parts: PRODUCTS.map((product) => ({
      part_number: product.part_number,
      product_name: product.product_name,
      brand: product.brand,
      category: product.category,
      unit_price: product.unit_price,
      currency: product.currency,
      stock_level: product.stock_level,
    })),
  };
}
