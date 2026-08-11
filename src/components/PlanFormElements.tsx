import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Lock } from "lucide-react"

interface FormFieldProps {
  label: string;
  name: string;
  value: number | string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  placeholder?: string;
  isPercentage?: boolean;
  disabled?: boolean;
}

export function FormField({ 
  label, 
  name, 
  value, 
  onChange, 
  type = "number",
  placeholder,
  isPercentage,
  disabled
}: FormFieldProps) {
  // For percentage fields, display as whole numbers (e.g., 40 instead of 0.4)
  const displayValue = isPercentage && typeof value === 'number' ? (value * 100).toFixed(1).replace(/\.0$/, '') : value;

  return (
    <div className="grid w-full max-w-sm items-center gap-1.5">
      <Label htmlFor={name} className="text-xs font-display uppercase tracking-widest text-muted-foreground">{label}</Label>
      {disabled ? (
        <div className="bg-deco-gold/10 border border-deco-gold/30 text-deco-gold font-sans font-medium rounded-sm px-3 py-2.5 text-sm flex items-center justify-between shadow-sm">
          <span>{displayValue}{isPercentage ? '%' : ''}</span>
          <span className="text-[10px] uppercase font-display tracking-widest text-deco-gold/80 flex items-center gap-1">
            <Lock className="h-3 w-3" /> Global Synced
          </span>
        </div>
      ) : (
        <Input
          required
          id={name}
          name={name}
          type={type}
          value={displayValue}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full bg-slate-900 border-white/20 text-white font-sans text-sm focus:border-deco-gold"
        />
      )}
    </div>
  );
}

export function PlanNameField({ value, onChange }: { 
  value: string; 
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; 
}) {
  return (
    <div className="grid w-full items-center gap-1.5 mb-6">
      <Label htmlFor="planName" className="text-xs font-display uppercase tracking-widest text-muted-foreground">Plan Name</Label>
      <Input
        required
        type="text"
        id="planName"
        name="planName"
        value={value}
        onChange={onChange}
        placeholder="Enter plan name"
        className="w-full bg-slate-900 border-white/20 text-white font-display text-base font-semibold focus:border-deco-gold"
      />
    </div>
  );
}