import { useRef, useState } from "react";
import { AnimatedButtonIcons } from "@/components/animated-icons";
import {
    InputGroup,
    InputGroupAddon,
    InputGroupButton,
    InputGroupInput,
    InputGroupTextarea,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";

type CopyFieldSingleProps = {
    mode: "single";
    label: string;
    value: string;
};

type CopyFieldMultiProps = {
    mode: "multi";
    label: string;
    values: string[];
};

type CopyFieldProps = CopyFieldSingleProps | CopyFieldMultiProps;

function useCopy(value: string) {
    const [copied, setCopied] = useState(false);
    const timeoutRef = useRef<number | undefined>(undefined);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            if (timeoutRef.current) {
                window.clearTimeout(timeoutRef.current);
            }
            timeoutRef.current = window.setTimeout(() => {
                setCopied(false);
            }, 1300);
        } catch {
            setCopied(false);
        }
    };

    return { copied, handleCopy };
}

function SingleCopyField({ label, value }: Omit<CopyFieldSingleProps, "mode">) {
    const { copied, handleCopy } = useCopy(value);

    return (
        <div className="space-y-2">
            <Label variant="micro-caps">{label}</Label>
            <InputGroup surface="bare">
                <InputGroupInput tone="framed-mono" readOnly value={value} />
                <InputGroupAddon align="inline-end" layout="attached-end">
                    <InputGroupButton
                        type="button"
                        onClick={handleCopy}
                        variant="utility"
                        size="fit-square"
                        className="p-3"
                        aria-label={`Copy ${label}`}
                    >
                        <AnimatedButtonIcons.Copy copied={copied} />
                    </InputGroupButton>
                </InputGroupAddon>
            </InputGroup>
        </div>
    );
}

function MultiCopyField({ label, values }: Omit<CopyFieldMultiProps, "mode">) {
    const { copied, handleCopy } = useCopy(values.join("\n"));

    return (
        <div className="space-y-2">
            <Label variant="micro-caps">{label}</Label>
            <InputGroup surface="framed">
                <InputGroupTextarea
                    readOnly
                    rows={7}
                    value={values.join("\n")}
                    tone="framed-mono"
                    wrap="off"
                    className="overflow-x-clip wrap-normal"
                />
                <InputGroupAddon
                    align="inline-end"
                    layout="floating-end"
                    className="pr-1"
                >
                    <InputGroupButton
                        type="button"
                        onClick={handleCopy}
                        variant="secondary"
                        size="icon-md"
                        className="bg-background focus-visible:border-foreground focus-visible:ring-0"
                        aria-label={`Copy ${label}`}
                    >
                        <AnimatedButtonIcons.Copy copied={copied} size="sm" />
                    </InputGroupButton>
                </InputGroupAddon>
            </InputGroup>
        </div>
    );
}

export function CopyField(props: CopyFieldProps) {
    if (props.mode === "single") {
        return <SingleCopyField label={props.label} value={props.value} />;
    }

    return <MultiCopyField label={props.label} values={props.values} />;
}
