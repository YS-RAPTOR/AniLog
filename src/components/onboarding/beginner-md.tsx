import { AlertTriangle, ExternalLink, Save } from "lucide-react";
import { CopyField } from "@/components/copy-field";
import { SecretInput } from "@/components/secret-input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type {
    InlineSegment,
    OnboardingStep,
} from "@/lib/onboarding/beginner-markdown";
import type { OAuthSecretKeys, OAuthSecrets } from "@/lib/auth";

type BeginnerMdProps = {
    steps: OnboardingStep[];
    credentials: OAuthSecrets;
    revealState: Record<OAuthSecretKeys, boolean>;
    validationError: { title: string; message: string } | null;
    onCredentialChange: (key: OAuthSecretKeys, value: string) => void;
    onToggleReveal: (key: OAuthSecretKeys) => void;
    onAction: (action: "validateContinue") => void;
    onExternalLink: (url: string) => void;
};

export function BeginnerMd({
    steps,
    credentials,
    revealState,
    validationError,
    onCredentialChange,
    onToggleReveal,
    onAction,
    onExternalLink,
}: BeginnerMdProps) {
    return (
        <div className="mx-auto max-w-4xl space-y-6">
            {steps.map((step) => (
                <Card
                    key={`${step.stepNumber}-${step.title}`}
                    variant="framed"
                    effect="offset"
                    className="p-6 md:p-8"
                >
                    <div className="w-full space-y-4">
                        <div className="flex items-center gap-3 border-b-2 border-foreground/30 pb-3">
                            <StepNumber step={step.stepNumber} />
                            <h2 className="text-2xl font-black uppercase">
                                {step.title}
                            </h2>
                        </div>

                        {step.blocks.map((block, index) => {
                            const key = `${step.stepNumber}-${block.type}-${index}`;

                            if (block.type === "paragraph") {
                                return (
                                    <p
                                        key={key}
                                        className="font-medium text-muted-foreground leading-relaxed"
                                    >
                                        <InlineContent
                                            segments={block.segments}
                                        />
                                    </p>
                                );
                            }

                            if (block.type === "list") {
                                const ListTag = block.ordered ? "ol" : "ul";
                                return (
                                    <ListTag
                                        key={key}
                                        {...(block.ordered
                                            ? { start: block.start }
                                            : {})}
                                        className={`space-y-2 pl-6 font-medium text-muted-foreground leading-relaxed ${block.ordered ? "list-decimal" : "list-disc"}`}
                                    >
                                        {block.itemSegments.map(
                                            (segments, itemIndex) => (
                                                <li
                                                    key={`${block.items[itemIndex]}-${itemIndex}`}
                                                    className="pl-1"
                                                >
                                                    <InlineContent
                                                        segments={segments}
                                                    />
                                                </li>
                                            ),
                                        )}
                                    </ListTag>
                                );
                            }

                            if (block.type === "input") {
                                return (
                                    <SecretInput
                                        key={key}
                                        label={block.label}
                                        placeholder={block.placeholder}
                                        visible={revealState[block.key]}
                                        onToggle={() =>
                                            onToggleReveal(block.key)
                                        }
                                        value={credentials[block.key]}
                                        onChange={(value) =>
                                            onCredentialChange(block.key, value)
                                        }
                                    />
                                );
                            }

                            if (block.type === "copy") {
                                if (block.mode === "single") {
                                    return (
                                        <CopyField
                                            key={key}
                                            mode="single"
                                            label={block.label}
                                            value={block.value}
                                        />
                                    );
                                }

                                return (
                                    <CopyField
                                        key={key}
                                        mode="multi"
                                        label={block.label}
                                        values={block.values}
                                    />
                                );
                            }

                            if (block.variant === "external") {
                                return (
                                    <Button
                                        key={key}
                                        type="button"
                                        onClick={() =>
                                            onExternalLink(block.url)
                                        }
                                        variant="primary"
                                        size="md"
                                        className="border-4"
                                    >
                                        {block.label}
                                        <ExternalLink className="ml-2 h-4 w-4" />
                                    </Button>
                                );
                            }

                            return (
                                <div key={key} className="space-y-3">
                                    <Button
                                        type="button"
                                        onClick={() => onAction(block.action)}
                                        variant="primary"
                                        size="lg"
                                        className="w-full border-4 text-lg tracking-[0.16em] hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_var(--color-foreground)]"
                                    >
                                        <Save className="mr-2 h-5 w-5" />
                                        {block.label}
                                    </Button>

                                    {block.action === "validateContinue" &&
                                        validationError && (
                                            <Alert variant="destructive">
                                                <AlertTriangle />
                                                <AlertTitle>
                                                    {validationError.title}
                                                </AlertTitle>
                                                <AlertDescription>
                                                    {validationError.message}
                                                </AlertDescription>
                                            </Alert>
                                        )}
                                </div>
                            );
                        })}
                    </div>
                </Card>
            ))}
        </div>
    );
}

function StepNumber({ step }: { step: string }) {
    return (
        <div className="flex h-12 w-12 shrink-0 items-center justify-center border-4 border-foreground bg-foreground text-background text-lg font-black">
            {step}
        </div>
    );
}

function InlineContent({ segments }: { segments: InlineSegment[] }) {
    return (
        <>
            {segments.map((segment, index) =>
                segment.type === "code" ? (
                    <code
                        key={`${segment.value}-${index}`}
                        className="text-foreground bg-foreground/10 rounded-md pt-1 pb-0.5 px-1 font-bold font-mono"
                    >
                        {segment.value}
                    </code>
                ) : (
                    <span key={`${segment.value}-${index}`}>
                        {segment.value}
                    </span>
                ),
            )}
        </>
    );
}
