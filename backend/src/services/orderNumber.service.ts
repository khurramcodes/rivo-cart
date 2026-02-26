import type { Prisma } from "@prisma/client";


type TransactionLike = {
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: unknown[]): Promise<T>;
};


export async function generateOrderNumber(tx: TransactionLike): Promise<string> {
  const result = await tx.$queryRaw<[{ nextval: bigint }]>`
    SELECT nextval('order_number_seq') AS nextval
  `;
  const seq = Number(result[0].nextval);
  const padded = seq.toString().padStart(4, "0");
  return `ORD-${padded}`;
}
