import pg from "pg";

const { Pool } = pg;

const DATABASE_URL =
  process.env.DATABASE_URL ??
  "postgresql://hardware:hardware@sql-database:5432/hardware";

// Single shared pool. All queries are parameterized and read-only (SELECT only).
const pool = new Pool({ connectionString: DATABASE_URL, max: 5 });

pool.on("error", (error) => {
  console.error(`[sql-client] idle client error: ${error.message}`);
});

/**
 * Look up price and stock for a part number, matching either the commercial
 * typecode or the material number.
 */
export async function getStockAndPrice(partNumber) {
  const sql = `
    SELECT p.typecode,
           p.material_number,
           p.name AS product_name,
           p.family,
           pr.price_ygdc,
           pr.currency,
           i.stock_level,
           i.warehouse_shelf
    FROM products p
    LEFT JOIN prices pr ON pr.product_id = p.id
    LEFT JOIN inventory i ON i.product_id = p.id
    WHERE p.typecode = $1 OR p.material_number = $1
    LIMIT 1;`;

  try {
    const { rows } = await pool.query(sql, [partNumber]);
    if (rows.length === 0) {
      return {
        found: false,
        backend: "sql",
        part_number: partNumber,
        message: `No product found for part number: ${partNumber}`,
      };
    }
    const row = rows[0];
    return {
      found: true,
      backend: "sql",
      part_number: row.typecode ?? row.material_number,
      typecode: row.typecode,
      material_number: row.material_number,
      product_name: row.product_name,
      family: row.family,
      unit_price: row.price_ygdc != null ? Number(row.price_ygdc) : null,
      currency: row.currency,
      stock_level: row.stock_level,
      warehouse_shelf: row.warehouse_shelf,
    };
  } catch (error) {
    console.error(`[sql-client] getStockAndPrice failed: ${error.message}`);
    return {
      found: false,
      backend: "sql",
      part_number: partNumber,
      error: "database_error",
    };
  }
}

/**
 * List the product catalog (typecode, name, price, stock). Capped by `limit`.
 */
export async function listParts(limit = 50) {
  const sql = `
    SELECT p.typecode,
           p.material_number,
           p.name AS product_name,
           p.family,
           pr.price_ygdc,
           pr.currency,
           i.stock_level
    FROM products p
    LEFT JOIN prices pr ON pr.product_id = p.id
    LEFT JOIN inventory i ON i.product_id = p.id
    ORDER BY p.id
    LIMIT $1;`;

  try {
    const { rows } = await pool.query(sql, [limit]);
    return {
      backend: "sql",
      count: rows.length,
      parts: rows.map((row) => ({
        part_number: row.typecode ?? row.material_number,
        typecode: row.typecode,
        material_number: row.material_number,
        product_name: row.product_name,
        family: row.family,
        unit_price: row.price_ygdc != null ? Number(row.price_ygdc) : null,
        currency: row.currency,
        stock_level: row.stock_level,
      })),
    };
  } catch (error) {
    console.error(`[sql-client] listParts failed: ${error.message}`);
    return { backend: "sql", count: 0, parts: [], error: "database_error" };
  }
}
