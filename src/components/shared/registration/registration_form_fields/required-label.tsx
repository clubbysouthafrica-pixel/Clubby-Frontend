import { ReactNode } from "react";
import { Label } from "@/components/ui/label";

interface RequiredLabelProps {
  children: ReactNode;
  htmlFor?: string;
  required?: boolean;
  className?: string;
}

export default function RequiredLabel({
  children,
  htmlFor,
  required = false,
  className,
}: RequiredLabelProps) {
  return (
    <Label htmlFor={htmlFor} className={className}>
      {children}
      {required && (
        <>
          <span className="ml-1 text-red-600" aria-hidden="true">
            *
          </span>
          <span className="sr-only">required</span>
        </>
      )}
    </Label>
  );
}