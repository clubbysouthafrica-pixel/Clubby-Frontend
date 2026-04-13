import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";

export interface ClubVariable {
  name: string;
  key: string;
  visible: boolean;
}

interface ClubVariablesFormProps {
  variables: ClubVariable[];
  onSave: (variables: ClubVariable[]) => void;
  onChange?: (variables: ClubVariable[]) => void;
  isPending?: boolean;
  showSaveButton?: boolean;
}

export function ClubVariablesForm({
  variables: initialVariables,
  onSave,
  onChange,
  isPending = false,
  showSaveButton = true,
}: ClubVariablesFormProps) {
  const [variables, setVariables] = useState<ClubVariable[]>(
    initialVariables || []
  );

  useEffect(() => {
    setVariables(initialVariables || []);
  }, [initialVariables]);

  const handleAddVariable = () => {
    const newVariables = [
      ...variables,
      { name: "", key: "", visible: true },
    ];
    setVariables(newVariables);
    onChange?.(newVariables);
  };

  const handleRemoveVariable = (index: number) => {
    const newVariables = variables.filter((_, i) => i !== index);
    setVariables(newVariables);
    onChange?.(newVariables);
  };

  const handleSave = () => {
    // Validate that all fields are filled
    const isValid = variables.every(
      (v) => v.name.trim() && v.key.trim()
    );

    if (!isValid) {
      alert("Please fill in all required fields (name and key)");
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
                            const updatedVariables = [...variables];
                            updatedVariables[index] = {
                              ...updatedVariables[index],
                              name: newName,
                              key: newName
                                .toLowerCase()
                                .replace(/\s+/g, "_")
                                .replace(/[^a-z0-9_]/g, ""),
                            };
                            setVariables(updatedVariables);
                            onChange?.(updatedVariables);
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
