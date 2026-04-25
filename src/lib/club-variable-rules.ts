import { ClubMember } from "@/interfaces/club";
import {
  ClubVariable,
  ClubVariableRulesFieldMapping,
  ClubVariableRulesEngine,
} from "@/interfaces/club-variable";

const TOKEN_REGEX = /\{([A-Z_]+)(?::(\d+))?\}/g;
const BUILT_IN_TOKENS = new Set(["YEAR_2", "YEAR_4", "MONTH", "RANDOM", "SEQUENCE"]);

function normalizeFieldKey(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_");
}

export function buildRulesTokenName(value: string) {
  const normalized = normalizeFieldKey(value).toUpperCase();
  if (!normalized) {
    return "FIELD";
  }

  return /^[A-Z_]/.test(normalized) ? normalized : `FIELD_${normalized}`;
}

export function buildRulesCodeTokenName(value: string) {
  const baseToken = buildRulesTokenName(value);
  return baseToken.endsWith("_CODE") ? baseToken : `${baseToken}_CODE`;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getStandardFields(member: ClubMember & Record<string, any>) {
  return Array.isArray(member.meta_standard)
    ? member.meta_standard
    : Object.values(member.meta_standard ?? {});
}

function findStandardField(
  member: ClubMember & Record<string, any>,
  fieldId?: string,
) {
  if (!fieldId) {
    return null;
  }

  const normalizedFieldId = normalizeFieldKey(fieldId);

  return getStandardFields(member).find((field: any) => {
    const candidateKeys = [field?.field_id, field?.field_name, field?.name]
      .filter(Boolean)
      .map((value: string) => normalizeFieldKey(value));

    return candidateKeys.includes(normalizedFieldId);
  });
}

function normalizeRulesFieldMapping(mapping: ClubVariableRulesFieldMapping) {
  const fieldId = String(mapping.fieldId ?? mapping.field_id ?? "").trim();
  const fieldLabel = String(mapping.fieldLabel ?? mapping.field_label ?? fieldId).trim();
  const configuredToken = String(mapping.token ?? "").trim().toUpperCase();
  const token = configuredToken
    ? buildRulesCodeTokenName(configuredToken)
    : buildRulesCodeTokenName(fieldLabel || fieldId);
  const valueToken = token.endsWith("_CODE") ? token.slice(0, -5) : token;

  return {
    fieldId,
    fieldLabel,
    token,
    valueToken,
    mappings: mapping.mappings ?? {},
  };
}

export function getRulesEngineFieldMappings(rulesEngine?: ClubVariableRulesEngine) {
  const explicitMappings = Array.isArray(rulesEngine?.fieldMappings)
    ? rulesEngine?.fieldMappings
    : Array.isArray(rulesEngine?.field_mappings)
      ? rulesEngine?.field_mappings
      : [];

  const normalizedMappings = explicitMappings
    .map(normalizeRulesFieldMapping)
    .filter((mapping) => Boolean(mapping.fieldId));

  if (normalizedMappings.length > 0) {
    return normalizedMappings;
  }

  const legacyFieldId = String(
    rulesEngine?.sourceFieldId ?? rulesEngine?.districtFieldId ?? "",
  ).trim();

  if (!legacyFieldId) {
    return [];
  }

  return [
    {
      fieldId: legacyFieldId,
      fieldLabel: legacyFieldId,
      token: buildRulesCodeTokenName(legacyFieldId),
      valueToken: buildRulesTokenName(legacyFieldId),
      mappings: rulesEngine?.mappings ?? {},
    },
  ];
}

function getMappedFieldContexts(
  member: ClubMember & Record<string, any>,
  rulesEngine?: ClubVariableRulesEngine,
) {
  return getRulesEngineFieldMappings(rulesEngine).map((mapping) => {
    const field = findStandardField(member, mapping.fieldId);
    const labelValue = String(field?.label_value ?? "").trim();
    const rawValue = String(field?.value ?? labelValue).trim();
    const fieldValue = labelValue || rawValue;
    const fieldCode = fieldValue
      ? String(mapping.mappings?.[fieldValue] ?? "").trim()
      : "";

    return {
      fieldId: mapping.fieldId,
      token: mapping.token,
      valueToken: mapping.valueToken,
      fieldValue,
      fieldCode,
    };
  });
}

function getLegacyFieldContext(
  fieldContexts: Array<{ token: string; fieldValue: string; fieldCode: string }>,
) {
  return fieldContexts[0] ?? { token: "FIELD", fieldValue: "", fieldCode: "" };
}

function extractExistingClubVariableValue(
  member: ClubMember & Record<string, any>,
  variable: Pick<ClubVariable, "key" | "name">,
) {
  const clubVariables = Array.isArray(member.meta_club_variables)
    ? member.meta_club_variables
    : Object.values(member.meta_club_variables ?? {});

  const variableKey = normalizeFieldKey(variable.key);
  const variableName = normalizeFieldKey(variable.name);

  const match = clubVariables.find((entry: any) => {
    const candidateKeys = [entry?.name, entry?.field_name, entry?.field_id]
      .filter(Boolean)
      .map((value: string) => normalizeFieldKey(value));

    return candidateKeys.includes(variableKey) || candidateKeys.includes(variableName);
  });

  const value = match?.value;
  return value === undefined || value === null ? "" : String(value);
}

function buildSequenceRegex(patternWithMarker: string, marker: string) {
  const parts = patternWithMarker.split(marker).map(escapeRegExp);
  return new RegExp(`^${parts.join("(\\d+)")}$`);
}

function getNextSequenceValue(
  patternWithMarker: string,
  marker: string,
  width: number,
  initialValue: number,
  variable: Pick<ClubVariable, "key" | "name">,
  members: Array<ClubMember & Record<string, any>>,
) {
  const regex = buildSequenceRegex(patternWithMarker, marker);
  let maxValue = Math.max(0, initialValue - 1);

  members.forEach((member) => {
    const value = extractExistingClubVariableValue(member, variable);
    if (!value) {
      return;
    }

    const match = value.match(regex);
    const sequenceValue = match?.[1] ? Number(match[1]) : Number.NaN;
    if (!Number.isNaN(sequenceValue)) {
      maxValue = Math.max(maxValue, sequenceValue);
    }
  });

  return String(maxValue + 1).padStart(width, "0");
}

export function generateClubVariableValue({
  variable,
  member,
  members,
  now = new Date(),
}: {
  variable: ClubVariable;
  member: ClubMember & Record<string, any>;
  members: Array<ClubMember & Record<string, any>>;
  now?: Date;
}) {
  const rulesEngine = variable.rules_engine;

  if (!rulesEngine?.enabled || !rulesEngine.pattern.trim()) {
    return null;
  }

  const fieldContexts = getMappedFieldContexts(member, rulesEngine);
  const fieldContextByToken = new Map<string, (typeof fieldContexts)[number]>();
  fieldContexts.forEach((context) => {
    fieldContextByToken.set(context.token, context);
    fieldContextByToken.set(context.valueToken, context);
  });
  const legacyFieldContext = getLegacyFieldContext(fieldContexts);
  const year4 = String(now.getFullYear());
  const year2 = year4.slice(-2);
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const missingTokens = new Set<string>();
  let sequenceMarker: string | null = null;
  let sequenceWidth = 0;
  let initialSequenceValue = 1;

  const renderedPattern = rulesEngine.pattern.replace(
    TOKEN_REGEX,
    (fullMatch, token: string, rawArg?: string) => {
      switch (token) {
        case "YEAR_2":
          return year2;
        case "YEAR_4":
          return year4;
        case "MONTH":
          return month;
        case "FIELD":
        case "DISTRICT":
          if (!legacyFieldContext.fieldValue) {
            missingTokens.add(token === "FIELD" ? "FIELD" : "DISTRICT");
            return "";
          }
          return legacyFieldContext.fieldValue;
        case "FIELD_CODE":
        case "DISTRICT_CODE":
          if (!legacyFieldContext.fieldCode) {
            missingTokens.add(token === "FIELD_CODE" ? "FIELD_CODE" : "DISTRICT_CODE");
            return "";
          }
          return legacyFieldContext.fieldCode;
        case "RANDOM": {
          const width = Math.max(1, Number(rawArg || 4));
          return Array.from({ length: width }, () => Math.floor(Math.random() * 10)).join("");
        }
        case "SEQUENCE": {
          sequenceWidth = Math.max(1, Number(rawArg || 1));
          initialSequenceValue = Math.max(
            1,
            Number(rulesEngine.initialSequence ?? rulesEngine.initial_sequence ?? 1),
          );
          sequenceMarker = `__SEQ_${sequenceWidth}__`;
          return sequenceMarker;
        }
        default:
          if (BUILT_IN_TOKENS.has(token)) {
            return fullMatch;
          }

          if (token.endsWith("_CODE")) {
            const fieldContext = fieldContextByToken.get(token);

            if (!fieldContext) {
              return fullMatch;
            }

            if (!fieldContext.fieldCode) {
              missingTokens.add(token);
              return "";
            }

            return fieldContext.fieldCode;
          }

          {
            const fieldContext = fieldContextByToken.get(token);

            if (!fieldContext) {
              return fullMatch;
            }

            if (!fieldContext.fieldValue) {
              missingTokens.add(token);
              return "";
            }

            return fieldContext.fieldValue;
          }
      }
    },
  );

  const value = sequenceMarker
    ? renderedPattern.replace(
        sequenceMarker,
        getNextSequenceValue(
          renderedPattern,
          sequenceMarker,
          sequenceWidth,
          initialSequenceValue,
          variable,
          members,
        ),
      )
    : renderedPattern;

  return {
    value,
    missingTokens: Array.from(missingTokens),
  };
}