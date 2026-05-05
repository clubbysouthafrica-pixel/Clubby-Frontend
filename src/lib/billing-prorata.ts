export interface BillingProrataConfig {
  prorata?: {
    enabled?: boolean;
    rules?: BillingProrataRule[];
  };
}

export interface BillingProrataRule {
  id?: string;
  prorata_start_date: string;
  prorata_end_date: string;
  prorata_percentage: number;
}

export function formatProrataPercentage(value: number) {
  return value.toFixed(2);
}

function toLocalDateString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function isProrataActive(
  config: BillingProrataConfig,
  currentDate = new Date(),
) {
  return getActiveProrataRule(config, currentDate) !== undefined;
}

export function getNormalizedProrataRules(config: BillingProrataConfig) {
  const rules = (config.prorata?.rules ?? []).filter(
    (rule) =>
      !!rule.prorata_start_date &&
      !!rule.prorata_end_date &&
      typeof rule.prorata_percentage === "number",
  );

  if (rules.length > 0) {
    return rules;
  }

  if (!config.prorata?.enabled) {
    return [];
  }

  return [];
}

export function prorataRulesOverlap(
  left: Pick<BillingProrataRule, "prorata_start_date" | "prorata_end_date">,
  right: Pick<BillingProrataRule, "prorata_start_date" | "prorata_end_date">,
) {
  if (
    !left.prorata_start_date ||
    !left.prorata_end_date ||
    !right.prorata_start_date ||
    !right.prorata_end_date
  ) {
    return false;
  }

  return (
    left.prorata_start_date <= right.prorata_end_date &&
    right.prorata_start_date <= left.prorata_end_date
  );
}

export function hasOverlappingProrataRules(rules: BillingProrataRule[]) {
  for (let index = 0; index < rules.length; index += 1) {
    for (let compareIndex = index + 1; compareIndex < rules.length; compareIndex += 1) {
      if (prorataRulesOverlap(rules[index], rules[compareIndex])) {
        return true;
      }
    }
  }

  return false;
}

export function getActiveProrataRule(
  config: BillingProrataConfig,
  currentDate = new Date(),
) {
  const rules = getNormalizedProrataRules(config);

  if (rules.length === 0) {
    return undefined;
  }

  const today = toLocalDateString(currentDate);

  return rules.find(
    (rule) =>
      rule.prorata_percentage > 0 &&
      today >= rule.prorata_start_date &&
      today <= rule.prorata_end_date,
  );
}

export function getProratedAmount(
  amount: number,
  config: BillingProrataConfig,
  currentDate = new Date(),
) {
  const activeRule = getActiveProrataRule(config, currentDate);

  if (!Number.isFinite(amount) || amount <= 0 || !activeRule) {
    return amount;
  }

  const percentage = Math.max(0, Math.min(100, activeRule.prorata_percentage ?? 0));

  return Math.max(0, Math.round(amount * ((100 - percentage) / 100)));
}

export function getProrataSummary(config: BillingProrataConfig) {
  const rules = getNormalizedProrataRules(config);

  if (rules.length === 0) {
    return null;
  }

  return rules
    .map(
      (rule) =>
        `${formatProrataPercentage(rule.prorata_percentage)}% deduction from ${rule.prorata_start_date} to ${rule.prorata_end_date}`,
    )
    .join(", ");
}