import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface FormFieldProps {
  label: string;
  name: string;
  value: number | string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  placeholder?: string;
  isPercentage?: boolean;
}

export function FormField({ 
  label, 
  name, 
  value, 
  onChange, 
  type = "number",
  placeholder,
  isPercentage 
}: FormFieldProps) {
  // For percentage fields, display as whole numbers (e.g., 40 instead of 0.4)
  const displayValue = isPercentage && typeof value === 'number' ? value * 100 : value;

  return (
    <div className="grid w-full max-w-sm items-center gap-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input
        required
        id={name}
        name={name}
        type={type}
        value={displayValue}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full"
      />
    </div>
  );
}

export function PlanNameField({ value, onChange }: { 
  value: string; 
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; 
}) {
  return (
    <div className="grid w-full items-center gap-1.5 mb-4">
      <Label htmlFor="planName">Plan Name</Label>
      <Input
        required
        type="text"
        id="planName"
        name="planName"
        value={value}
        onChange={onChange}
        placeholder="Enter plan name"
        className="w-full"
      />
    </div>
  );
}