import { AnimatedButtonIcons } from "@/components/animated-icons";
import {
    InputGroup,
    InputGroupAddon,
    InputGroupButton,
    InputGroupInput,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";

type SecretInputProps = {
    label: string;
    placeholder: string;
    visible: boolean;
    onToggle: () => void;
    value?: string;
    onChange?: (value: string) => void;
    description?: string;
};

export function SecretInput({
    label,
    placeholder,
    visible,
    onToggle,
    value,
    onChange,
    description,
}: SecretInputProps) {
    return (
        <div className="space-y-2">
            <Label variant="micro-caps">
                {label}
            </Label>
            <InputGroup surface="bare">
                <InputGroupInput
                    tone="framed-mono"
                    type={visible ? "text" : "password"}
                    placeholder={placeholder}
                    value={value}
                    onChange={(event) => onChange?.(event.target.value)}
                />
                <InputGroupAddon align="inline-end" layout="attached-end">
                    <InputGroupButton
                        type="button"
                        onClick={onToggle}
                        variant="utility"
                        size="fit-square"
                        className="p-3"
                    >
                        <AnimatedButtonIcons.Reveal visible={visible} />
                    </InputGroupButton>
                </InputGroupAddon>
            </InputGroup>
            {description && (
                <p className="text-sm font-medium text-muted-foreground">
                    {description}
                </p>
            )}
        </div>
    );
}
