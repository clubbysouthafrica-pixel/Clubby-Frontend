import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  buildRulesCodeTokenName,
  buildRulesTokenName,
  getRulesEngineFieldMappings,
} from "@/lib/club-variable-rules";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  ClubVariable,
  RegistrationDropdownField,
} from "@/interfaces/club-variable";

const BUILT_IN_TOKENS = new Set(["YEAR_2", "YEAR_4", "MONTH", "RANDOM", "SEQUENCE"]);
const LEGACY_FIELD_TOKENS = new Set(["FIELD", "FIELD_CODE", "DISTRICT", "DISTRICT_CODE"]);
const TOKEN_REGEX = /\{([A-Z_]+)(?::\d+)?\}/g;

interface ClubVariablesFormProps {
  variables: ClubVariable[];
  onSave: (variables: ClubVariable[]) => void;
  onChange?: (variables: ClubVariable[]) => void;
  isPending?: boolean;
  showSaveButton?: boolean;
  registrationDropdownFields?: RegistrationDropdownField[];
}

function isRulesEngineEnabled(variable: ClubVariable) {
  const rulesEngine = variable.rules_engine;

  if (!rulesEngine) {
    return false;
  }

  return rulesEngine.enabled ?? true;
}

function normalizeRulesEngine(variable: ClubVariable) {
  const rulesEngine = variable.rules_engine;

  return {
    enabled: isRulesEngineEnabled(variable),
    pattern: rulesEngine?.pattern ?? "",
    initialSequence: Math.max(
      1,
      Number(rulesEngine?.initialSequence ?? rulesEngine?.initial_sequence ?? 1),
    ),
    reset:
      rulesEngine?.reset === "district_year" ||
      rulesEngine?.reset === "mapped_field_year"
        ? "field_year"
        : rulesEngine?.reset ?? "none",
    resetFieldId:
      rulesEngine?.resetFieldId ??
      rulesEngine?.reset_field_id ??
      rulesEngine?.sourceFieldId ??
      rulesEngine?.districtFieldId ??
      "",
    fieldMappings: getRulesEngineFieldMappings(rulesEngine),
  };
}

function extractPatternTokens(pattern: string) {
  return Array.from(pattern.matchAll(TOKEN_REGEX), (match) => match[1]);
}

export function ClubVariablesForm({
  variables: initialVariables,
  onSave,
  onChange,
  isPending = false,
  showSaveButton = true,
  registrationDropdownFields = [],
}: ClubVariablesFormProps) {
  const [variables, setVariables] = useState<ClubVariable[]>(
    initialVariables || [],
  );

  useEffect(() => {
    setVariables(initialVariables || []);
  }, [initialVariables]);

  const dropdownFields = useMemo(
    () =>
      registrationDropdownFields.map((field) => ({
        ...field,
        valueToken: buildRulesTokenName(field.label || field.fieldId),
        codeToken: buildRulesCodeTokenName(field.label || field.fieldId),
      })),
    [registrationDropdownFields],
  );

  const updateVariableAtIndex = (
    index: number,
    updater: (variable: ClubVariable) => ClubVariable,
  ) => {
    const updatedVariables = variables.map((variable, variableIndex) =>
      variableIndex === index ? updater(variable) : variable,
    );
    setVariables(updatedVariables);
    onChange?.(updatedVariables);
  };

  const handleAddVariable = () => {
    const newVariables = [...variables, { name: "", key: "", visible: true }];
    setVariables(newVariables);
    onChange?.(newVariables);
  };

  const handleRemoveVariable = (index: number) => {
    const newVariables = variables.filter((_, i) => i !== index);
    setVariables(newVariables);
    onChange?.(newVariables);
  };

  const handleSave = () => {
    const isValid = variables.every((v) => v.name.trim() && v.key.trim());

    if (!isValid) {
      alert("Please fill in all required fields (name and key)");
      return;
    }

    const invalidRulesEngine = variables.find((variable) => {
      if (!isRulesEngineEnabled(variable)) {
        return false;
      }

      const rulesEngine = normalizeRulesEngine(variable);
      if (!rulesEngine.pattern.trim()) {
        return true;
      }

      const mappedTokens = new Set(
        rulesEngine.fieldMappings.flatMap((fieldMapping) => {
          const codeToken = fieldMapping.token;
          const valueToken = codeToken.endsWith("_CODE")
            ? codeToken.slice(0, -5)
            : codeToken;
          return [codeToken, valueToken];
        }),
      );
      const patternTokens = extractPatternTokens(rulesEngine.pattern);
      const hasUnknownFieldToken = patternTokens.some((token) => {
        if (BUILT_IN_TOKENS.has(token)) {
          return false;
        }

        if (LEGACY_FIELD_TOKENS.has(token)) {
          return mappedTokens.size === 0;
        }

        return !mappedTokens.has(token);
      });

      if (hasUnknownFieldToken) {
        return true;
      }

      return rulesEngine.reset === "field_year" && !rulesEngine.resetFieldId;
    });

    if (invalidRulesEngine) {
      alert(
        "Enabled rules engines need a pattern. Any field-specific token must have a matching dropdown mapping, and field/year resets need a reset field.",
      );
      return;
    }

    onSave(variables);
  };

  return (
    <Card className="border-0 shadow-none">
      <CardHeader className="p-0 flex flex-row items-start justify-between space-y-0">
        <div className="space-y-1.5">
          <CardTitle>Club Registration Tags</CardTitle>
          <CardDescription>
            Define custom tags for your club such as internal ID, running number, etc. These can be used throughout your club management system. These tags will be required to be filled out when registering a member.
          </CardDescription>
        </div>
        {showSaveButton && (
          <Button
            variant="outline"
            disabled={isPending}
            onClick={handleSave}
          >
            {isPending ? (
              <p className="flex space-x-2 items-center">
                <Loader2 className="animate-spin" />
                <span>Saving...</span>
              </p>
            ) : (
              "Save variables"
            )}
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-6 p-0">
        {variables.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-muted-foreground mb-4">
              No variables yet. Click "Add Variable" to create your first one.
            </p>
            <Button onClick={handleAddVariable} variant="default">
              <Plus className="w-4 h-4 mr-2" />
              Add Variable
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {variables.map((variable, index) => (
                <Card key={index} className="border rounded-lg">
                  <CardContent className="p-4 space-y-4">
                    {(() => {
                      const normalizedRulesEngine = normalizeRulesEngine(variable);

                      return (
                        <>
                    {(() => {
                      const hasSequenceToken = /\{SEQUENCE(?::\d+)?\}/.test(
                        normalizedRulesEngine.pattern,
                      );

                      return (
                        <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`name-${index}`} className="text-sm mb-2 block">
                          Tag Name
                        </Label>
                        <Input
                          id={`name-${index}`}
                          placeholder="e.g., Registration Fee, Internal ID"
                          value={variable.name}
                          onChange={(e) => {
                            const newName = e.target.value;
                            updateVariableAtIndex(index, (currentVariable) => ({
                              ...currentVariable,
                              name: newName,
                              key: newName
                                .toLowerCase()
                                .replace(/\s+/g, "_")
                                .replace(/[^a-z0-9_]/g, ""),
                            }));
                          }}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`key-${index}`} className="text-sm mb-2 block">
                          Key
                        </Label>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 px-3 py-2 border border-input rounded-md bg-muted/50 text-sm font-mono">
                            {variable.key || <span className="text-muted-foreground">Auto-generated key...</span>}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Auto-generated from the variable name
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4 rounded-lg border border-dashed border-slate-300 bg-slate-50/60 p-4">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          id={`rules-engine-${index}`}
                          checked={isRulesEngineEnabled(variable)}
                          onCheckedChange={(checked) => {
                            const isChecked = checked === true;
                            updateVariableAtIndex(index, (currentVariable) => ({
                              ...currentVariable,
                              rules_engine: isChecked
                                ? {
                                    ...normalizeRulesEngine(currentVariable),
                                    enabled: true,
                                  }
                                : {
                                    ...normalizeRulesEngine(currentVariable),
                                    enabled: false,
                                  },
                            }));
                          }}
                        />
                        <div className="space-y-1">
                          <Label htmlFor={`rules-engine-${index}`} className="text-sm font-medium">
                            Generate this tag with a rules engine
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Tokens: {"{YEAR_2}"}, {"{YEAR_4}"}, {"{MONTH}"}, {"{SEQUENCE:5}"}, {"{RANDOM:4}"}
                          </p>
                          {dropdownFields.length > 0 ? (
                            <p className="text-xs text-muted-foreground">
                              Available field tokens: {dropdownFields.map((field) => `{${field.valueToken}} / {${field.codeToken}}`).join(", ")}
                            </p>
                          ) : null}
                        </div>
                      </div>

                      {isRulesEngineEnabled(variable) ? (
                        <>
                          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="space-y-2 md:col-span-2">
                              <Label htmlFor={`pattern-${index}`}>Pattern</Label>
                              <Input
                                id={`pattern-${index}`}
                                placeholder="{DISTRICT_CODE}{YEAR_2}-{SEQUENCE:5}"
                                value={normalizedRulesEngine.pattern}
                                onChange={(e) => {
                                  const pattern = e.target.value;
                                  updateVariableAtIndex(index, (currentVariable) => ({
                                    ...currentVariable,
                                    rules_engine: {
                                      ...normalizeRulesEngine(currentVariable),
                                      pattern,
                                    },
                                  }));
                                }}
                              />
                            </div>

                            {hasSequenceToken ? (
                              <div className="space-y-2">
                                <Label htmlFor={`initial-sequence-${index}`}>Initial sequence value</Label>
                                <Input
                                  id={`initial-sequence-${index}`}
                                  type="number"
                                  min="1"
                                  step="1"
                                  value={normalizedRulesEngine.initialSequence}
                                  onChange={(e) => {
                                    const parsedValue = Number(e.target.value);
                                    updateVariableAtIndex(index, (currentVariable) => ({
                                      ...currentVariable,
                                      rules_engine: {
                                        ...normalizeRulesEngine(currentVariable),
                                        initialSequence: Number.isFinite(parsedValue)
                                          ? Math.max(1, Math.floor(parsedValue))
                                          : 1,
                                      },
                                    }));
                                  }}
                                />
                                <p className="text-xs text-muted-foreground">
                                  The first generated sequence will start from this value if no higher matching sequence already exists.
                                </p>
                              </div>
                            ) : null}

                            <div className="space-y-2">
                              <Label>Reset behaviour</Label>
                              <Select
                                value={normalizedRulesEngine.reset}
                                onValueChange={(value) => {
                                  updateVariableAtIndex(index, (currentVariable) => ({
                                    ...currentVariable,
                                    rules_engine: {
                                      ...normalizeRulesEngine(currentVariable),
                                      reset: value as "none" | "year" | "field_year",
                                    },
                                  }));
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select reset behaviour" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">Never reset</SelectItem>
                                  <SelectItem value="year">Reset each year</SelectItem>
                                  <SelectItem value="field_year">Reset for a selected field value and year</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label>Reset field</Label>
                              <Select
                                value={normalizedRulesEngine.resetFieldId || "__none__"}
                                onValueChange={(value) => {
                                  updateVariableAtIndex(index, (currentVariable) => ({
                                    ...currentVariable,
                                    rules_engine: {
                                      ...normalizeRulesEngine(currentVariable),
                                      resetFieldId: value === "__none__" ? "" : value,
                                    },
                                  }));
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a reset field" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="__none__">No reset field</SelectItem>
                                  {dropdownFields.map((field) => (
                                    <SelectItem key={field.fieldId} value={field.fieldId}>
                                      {field.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          {dropdownFields.length > 0 ? (
                            <div className="space-y-3">
                              <div>
                                <Label className="text-sm">Dropdown field mappings</Label>
                                <p className="text-xs text-muted-foreground">
                                  Enable any dropdown field you want to reference in the pattern, then map its option labels to short codes.
                                </p>
                              </div>

                              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                                {dropdownFields.map((field) => {
                                  const currentFieldMapping = normalizedRulesEngine.fieldMappings.find(
                                    (fieldMapping) => fieldMapping.fieldId === field.fieldId,
                                  );

                                  return (
                                    <div key={field.fieldId} className="space-y-3 rounded-md border bg-white p-3">
                                      <div className="flex items-start gap-3">
                                        <Checkbox
                                          id={`field-mapping-${index}-${field.fieldId}`}
                                          checked={Boolean(currentFieldMapping)}
                                          onCheckedChange={(checked) => {
                                            updateVariableAtIndex(index, (currentVariable) => {
                                              const nextRulesEngine = normalizeRulesEngine(currentVariable);
                                              const nextFieldMappings = checked
                                                ? [
                                                    ...nextRulesEngine.fieldMappings.filter(
                                                      (fieldMapping) => fieldMapping.fieldId !== field.fieldId,
                                                    ),
                                                    {
                                                      fieldId: field.fieldId,
                                                      fieldLabel: field.label,
                                                        token: field.codeToken,
                                                      mappings: {},
                                                    },
                                                  ]
                                                : nextRulesEngine.fieldMappings.filter(
                                                    (fieldMapping) => fieldMapping.fieldId !== field.fieldId,
                                                  );

                                              const nextResetFieldId =
                                                nextRulesEngine.resetFieldId === field.fieldId && !checked
                                                  ? ""
                                                  : nextRulesEngine.resetFieldId;

                                              return {
                                                ...currentVariable,
                                                rules_engine: {
                                                  ...nextRulesEngine,
                                                  resetFieldId: nextResetFieldId,
                                                  fieldMappings: nextFieldMappings,
                                                },
                                              };
                                            });
                                          }}
                                        />
                                        <div className="space-y-1">
                                          <Label htmlFor={`field-mapping-${index}-${field.fieldId}`} className="text-sm font-medium">
                                            {field.label}
                                          </Label>
                                          <p className="text-xs text-muted-foreground">
                                            Tokens: {`{${field.valueToken}}`} and {`{${field.codeToken}}`}
                                          </p>
                                        </div>
                                      </div>

                                      {currentFieldMapping && field.options.length > 0 ? (
                                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                          {field.options.map((option) => (
                                            <div key={option} className="space-y-2 rounded-md border bg-slate-50 p-3">
                                              <p className="text-sm font-medium text-slate-700">{option}</p>
                                              <Input
                                                placeholder="Code, e.g. A"
                                                value={currentFieldMapping.mappings?.[option] ?? ""}
                                                onChange={(e) => {
                                                  const nextValue = e.target.value;
                                                  updateVariableAtIndex(index, (currentVariable) => {
                                                    const nextRulesEngine = normalizeRulesEngine(currentVariable);
                                                    return {
                                                      ...currentVariable,
                                                      rules_engine: {
                                                        ...nextRulesEngine,
                                                        fieldMappings: nextRulesEngine.fieldMappings.map((fieldMapping) =>
                                                          fieldMapping.fieldId === field.fieldId
                                                            ? {
                                                                ...fieldMapping,
                                                                fieldLabel: field.label,
                                                                token: field.codeToken,
                                                                mappings: {
                                                                  ...(fieldMapping.mappings ?? {}),
                                                                  [option]: nextValue,
                                                                },
                                                              }
                                                            : fieldMapping,
                                                        ),
                                                      },
                                                    };
                                                  });
                                                }}
                                              />
                                            </div>
                                          ))}
                                        </div>
                                      ) : null}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground">
                              No dropdown fields are currently available on the registration form.
                            </p>
                          )}
                        </>
                      ) : null}
                    </div>

                    <div className="flex justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveVariable(index)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Remove
                      </Button>
                    </div>
                        </>
                      );
                    })()}
                        </>
                      );
                    })()}
                  </CardContent>
                </Card>
              ))}
            </div>

            <Button
              onClick={handleAddVariable}
              variant="outline"
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Variable
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
