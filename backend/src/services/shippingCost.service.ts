import { prisma } from "../prisma/client.js";

type AddressLike = {
  country: string;
  state: string;
  city: string;
};

function normalize(input: string) {
  return input.trim().toLowerCase();
}

function matchesZone(address: AddressLike, zone: { scope: string; country: string | null; state: string | null; city: string | null }) {
  const country = normalize(address.country);
  const state = normalize(address.state);
  const city = normalize(address.city);

  if (zone.scope === "COUNTRY") {
    return zone.country ? normalize(zone.country) === country : false;
  }
  if (zone.scope === "STATE") {
    return zone.country && zone.state
      ? normalize(zone.country) === country && normalize(zone.state) === state
      : false;
  }
  if (zone.scope === "CITY") {
    return zone.country && zone.state && zone.city
      ? normalize(zone.country) === country &&
          normalize(zone.state) === state &&
          normalize(zone.city) === city
      : false;
  }
  return false;
}

function meetsMinOrderValue(conditionType: string, conditionConfig: any, subtotal: number) {
  if (conditionType === "NONE") return true;
  if (conditionType !== "MIN_ORDER_VALUE") return false;

  const min = Number(conditionConfig?.minOrderValue ?? NaN);
  if (!Number.isFinite(min)) return false;
  return subtotal >= min;
}

export async function resolveShippingCost(input: {
  subtotal: number;
  address: AddressLike;
  methodId: string;
}) {
  const method = await prisma.shippingMethod.findFirst({
    where: { id: input.methodId, isActive: true },
  });
  if (!method) return null;

  const scopeOrder = ["CITY", "STATE", "COUNTRY"] as const;
  for (const scope of scopeOrder) {
    const zones = await prisma.shippingZone.findMany({
      where: { isActive: true, scope },
    });
    const matchingZones = zones.filter((zone) =>
      matchesZone(input.address, {
        scope: zone.scope,
        country: zone.country,
        state: zone.state,
        city: zone.city,
      }),
    );
    if (matchingZones.length === 0) continue;

    const rules = await prisma.shippingRule.findMany({
      where: {
        isActive: true,
        methodId: input.methodId,
        zoneId: { in: matchingZones.map((z) => z.id) },
      },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    });

    const match = rules.find((rule) =>
      meetsMinOrderValue(rule.conditionType, rule.conditionConfig, input.subtotal),
    );
    if (!match) continue;

    return {
      shippingMethod: {
        id: method.id,
        type: method.type,
        name: method.name,
        description: method.description,
      },
      shippingAmount: match.baseCost,
      appliedRuleId: match.id,
      zoneId: match.zoneId,
    };
  }

  return null;
}
