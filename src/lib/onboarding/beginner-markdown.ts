import { remark } from "remark";
import remarkParse from "remark-parse";
import type {
    Code,
    RootContent,
    Heading,
    List,
    ListItem,
    Paragraph,
    PhrasingContent,
} from "mdast";
import { OAUTH_SECRET_KEYS, type OAuthSecretKeys } from "@/lib/auth";

export type InlineSegment =
    | { type: "text"; value: string }
    | { type: "code"; value: string };

type OnboardingTextBlock = {
    type: "paragraph";
    text: string;
    segments: InlineSegment[];
};

type OnboardingListBlock = {
    type: "list";
    ordered: boolean;
    start: number;
    items: string[];
    itemSegments: InlineSegment[][];
};

export type OnboardingInputBlock = {
    type: "input";
    key: OAuthSecretKeys;
    label: string;
    placeholder: string;
};

type OnboardingCopySingleBlock = {
    type: "copy";
    mode: "single";
    label: string;
    value: string;
};

type OnboardingCopyMultiBlock = {
    type: "copy";
    mode: "multi";
    label: string;
    values: string[];
};

export type OnboardingCopyBlock =
    | OnboardingCopySingleBlock
    | OnboardingCopyMultiBlock;

type OnboardingExternalButtonBlock = {
    type: "button";
    variant: "external";
    label: string;
    url: string;
};

type OnboardingPrimaryButtonBlock = {
    type: "button";
    variant: "primary";
    label: string;
    action: "validateContinue";
};

export type OnboardingButtonBlock =
    | OnboardingExternalButtonBlock
    | OnboardingPrimaryButtonBlock;

export type OnboardingInteractiveBlock =
    | OnboardingInputBlock
    | OnboardingCopyBlock
    | OnboardingButtonBlock;

export type OnboardingStepBlock =
    | OnboardingTextBlock
    | OnboardingListBlock
    | OnboardingInteractiveBlock;

export type OnboardingStep = {
    stepNumber: string;
    title: string;
    blocks: OnboardingStepBlock[];
};

type ParseSuccess = {
    ok: true;
    steps: OnboardingStep[];
};

type ParseFailure = {
    ok: false;
    issues: string[];
};

export type ParseOnboardingMarkdownResult = ParseSuccess | ParseFailure;

export function parseOnboardingMarkdown(
    markdown: string,
): ParseOnboardingMarkdownResult {
    const issues: string[] = [];
    const tree = remark().use(remarkParse).parse(markdown);
    const steps: OnboardingStep[] = [];
    let currentStep: OnboardingStep | null = null;

    for (const node of tree.children) {
        if (isStepHeading(node)) {
            if (currentStep) {
                steps.push(currentStep);
            }
            currentStep = buildStepFromHeading(node, issues);
            continue;
        }

        if (!currentStep) {
            continue;
        }

        const block = parseStepBlock(node, currentStep, issues);
        if (block) {
            currentStep.blocks.push(block);
        }
    }

    if (currentStep) {
        steps.push(currentStep);
    }

    validateDocument(steps, issues);
    validateInputKeys(steps, issues);

    if (issues.length > 0) {
        return {
            ok: false,
            issues,
        };
    }

    return {
        ok: true,
        steps,
    };
}

function isStepHeading(node: RootContent): node is Heading {
    return node.type === "heading" && node.depth === 2;
}

function buildStepFromHeading(
    heading: Heading,
    issues: string[],
): OnboardingStep {
    const rawHeading = toInlineText(heading.children).trim();
    const match = /^(\d{2})\s*\|\s*(.+)$/.exec(rawHeading);

    if (!match) {
        issues.push(
            `Invalid step heading format at line ${heading.position?.start.line ?? "?"}. Expected "NN | Title".`,
        );
        return {
            stepNumber: "00",
            title: rawHeading || "Untitled Step",
            blocks: [],
        };
    }

    return {
        stepNumber: match[1],
        title: match[2].trim(),
        blocks: [],
    };
}

function parseStepBlock(
    node: RootContent,
    step: OnboardingStep,
    issues: string[],
): OnboardingStepBlock | null {
    if (node.type === "paragraph") {
        return parseParagraph(node);
    }

    if (node.type === "list") {
        return parseList(node);
    }

    if (node.type === "code") {
        return parseJsonCodeBlock(node, step, issues);
    }

    return null;
}

function parseParagraph(node: Paragraph): OnboardingTextBlock | null {
    const text = toInlineText(node.children).trim();
    if (!text) {
        return null;
    }

    return {
        type: "paragraph",
        text,
        segments: toInlineSegments(node.children),
    };
}

function parseList(node: List): OnboardingListBlock | null {
    const parsed = node.children.map((item) => parseListItem(item));
    const items = parsed
        .map((p) => p.text)
        .filter((item): item is string => item.length > 0);

    if (items.length === 0) {
        return null;
    }

    return {
        type: "list",
        ordered: node.ordered ?? false,
        start: node.start ?? 1,
        items,
        itemSegments: parsed.map((p) => p.segments),
    };
}

function parseListItem(node: ListItem): {
    text: string;
    segments: InlineSegment[];
} {
    const allSegments: InlineSegment[] = [];

    const text = node.children
        .map((child) => {
            if (child.type === "paragraph") {
                allSegments.push(...toInlineSegments(child.children));
                return toInlineText(child.children).trim();
            }
            if (child.type === "list") {
                for (const entry of child.children) {
                    const parsed = parseListItem(entry);
                    allSegments.push(...parsed.segments);
                }
                return child.children
                    .map((entry) => parseListItem(entry).text)
                    .join(" ");
            }
            return "";
        })
        .join(" ")
        .trim();

    return { text, segments: allSegments };
}

function parseJsonCodeBlock(
    node: Code,
    step: OnboardingStep,
    issues: string[],
): OnboardingInteractiveBlock | null {
    if (node.lang?.trim().toLowerCase() !== "json") {
        return null;
    }

    let parsed: unknown;
    try {
        parsed = JSON.parse(node.value);
    } catch {
        issues.push(
            `${stepIssuePrefix(step)} has invalid JSON block at line ${node.position?.start.line ?? "?"}.`,
        );
        return null;
    }

    return validateInteractiveBlock(parsed, step, node, issues);
}

function validateInteractiveBlock(
    value: unknown,
    step: OnboardingStep,
    node: Code,
    issues: string[],
): OnboardingInteractiveBlock | null {
    if (!isRecord(value)) {
        issues.push(
            `${stepIssuePrefix(step)} has a JSON block that must be an object at line ${node.position?.start.line ?? "?"}.`,
        );
        return null;
    }

    if (value.type === "input") {
        return validateInputBlock(value, step, node, issues);
    }

    if (value.type === "copy") {
        return validateCopyBlock(value, step, node, issues);
    }

    if (value.type === "button") {
        return validateButtonBlock(value, step, node, issues);
    }

    issues.push(
        `${stepIssuePrefix(step)} has unsupported block type at line ${node.position?.start.line ?? "?"}.`,
    );
    return null;
}

function validateInputBlock(
    value: Record<string, unknown>,
    step: OnboardingStep,
    node: Code,
    issues: string[],
): OnboardingInputBlock | null {
    if (!isRequiredInputKey(value.key)) {
        issues.push(
            `${stepIssuePrefix(step)} input block has invalid key at line ${node.position?.start.line ?? "?"}.`,
        );
        return null;
    }

    if (
        !isNonEmptyString(value.label) ||
        !isNonEmptyString(value.placeholder)
    ) {
        issues.push(
            `${stepIssuePrefix(step)} input block requires non-empty label and placeholder at line ${node.position?.start.line ?? "?"}.`,
        );
        return null;
    }

    return {
        type: "input",
        key: value.key,
        label: value.label,
        placeholder: value.placeholder,
    };
}

function validateCopyBlock(
    value: Record<string, unknown>,
    step: OnboardingStep,
    node: Code,
    issues: string[],
): OnboardingCopyBlock | null {
    if (!isNonEmptyString(value.label)) {
        issues.push(
            `${stepIssuePrefix(step)} copy block requires non-empty label at line ${node.position?.start.line ?? "?"}.`,
        );
        return null;
    }

    if (value.mode === "single") {
        if (!isNonEmptyString(value.value)) {
            issues.push(
                `${stepIssuePrefix(step)} single copy block requires non-empty value at line ${node.position?.start.line ?? "?"}.`,
            );
            return null;
        }
        return {
            type: "copy",
            mode: "single",
            label: value.label,
            value: value.value,
        };
    }

    if (value.mode === "multi") {
        if (!isStringArray(value.values) || value.values.length === 0) {
            issues.push(
                `${stepIssuePrefix(step)} multi copy block requires at least one value at line ${node.position?.start.line ?? "?"}.`,
            );
            return null;
        }
        return {
            type: "copy",
            mode: "multi",
            label: value.label,
            values: value.values,
        };
    }

    issues.push(
        `${stepIssuePrefix(step)} copy block has invalid mode at line ${node.position?.start.line ?? "?"}.`,
    );
    return null;
}

function validateButtonBlock(
    value: Record<string, unknown>,
    step: OnboardingStep,
    node: Code,
    issues: string[],
): OnboardingButtonBlock | null {
    if (!isNonEmptyString(value.label)) {
        issues.push(
            `${stepIssuePrefix(step)} button block requires non-empty label at line ${node.position?.start.line ?? "?"}.`,
        );
        return null;
    }

    if (value.variant === "external") {
        if (!isHttpsUrl(value.url)) {
            issues.push(
                `${stepIssuePrefix(step)} external button requires valid HTTPS url at line ${node.position?.start.line ?? "?"}.`,
            );
            return null;
        }
        return {
            type: "button",
            variant: "external",
            label: value.label,
            url: value.url,
        };
    }

    if (value.variant === "primary") {
        if (value.action !== "validateContinue") {
            issues.push(
                `${stepIssuePrefix(step)} primary button action must be "validateContinue" at line ${node.position?.start.line ?? "?"}.`,
            );
            return null;
        }
        return {
            type: "button",
            variant: "primary",
            label: value.label,
            action: "validateContinue",
        };
    }

    issues.push(
        `${stepIssuePrefix(step)} button block has invalid variant at line ${node.position?.start.line ?? "?"}.`,
    );
    return null;
}

function validateDocument(steps: OnboardingStep[], issues: string[]) {
    if (steps.length === 0) {
        issues.push(
            "Markdown onboarding config must define at least one step.",
        );
        return;
    }

    const numbers = new Set<string>();
    for (const step of steps) {
        if (!/^\d{2}$/.test(step.stepNumber)) {
            issues.push(`Step "${step.title}" has invalid step number.`);
        }
        if (numbers.has(step.stepNumber)) {
            issues.push(`Duplicate step number detected: ${step.stepNumber}.`);
            continue;
        }
        numbers.add(step.stepNumber);
    }
}

function validateInputKeys(steps: OnboardingStep[], issues: string[]) {
    const counts = new Map<OAuthSecretKeys, number>(
        OAUTH_SECRET_KEYS.map((key) => [key, 0]),
    );

    for (const step of steps) {
        for (const block of step.blocks) {
            if (block.type !== "input") {
                continue;
            }
            counts.set(block.key, (counts.get(block.key) ?? 0) + 1);
        }
    }

    for (const key of OAUTH_SECRET_KEYS) {
        const count = counts.get(key) ?? 0;
        if (count === 0) {
            issues.push(`Missing required input block for key "${key}".`);
        } else if (count > 1) {
            issues.push(`Input key "${key}" must appear exactly once.`);
        }
    }
}

function isRequiredInputKey(value: unknown): value is OAuthSecretKeys {
    return (
        typeof value === "string" &&
        OAUTH_SECRET_KEYS.includes(value as OAuthSecretKeys)
    );
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

function isNonEmptyString(value: unknown): value is string {
    return typeof value === "string" && value.trim().length > 0;
}

function isStringArray(value: unknown): value is string[] {
    return (
        Array.isArray(value) &&
        value.length > 0 &&
        value.every(
            (item) => typeof item === "string" && item.trim().length > 0,
        )
    );
}

function isHttpsUrl(value: unknown): value is string {
    if (!isNonEmptyString(value)) {
        return false;
    }

    try {
        const parsed = new URL(value);
        return parsed.protocol === "https:";
    } catch {
        return false;
    }
}

function stepIssuePrefix(step: OnboardingStep): string {
    return `Step ${step.stepNumber} | ${step.title}`;
}

function toInlineText(nodes: PhrasingContent[]): string {
    return nodes
        .map((node) => {
            if (node.type === "text") {
                return node.value;
            }
            if (node.type === "inlineCode") {
                return `\`${node.value}\``;
            }
            if (
                node.type === "strong" ||
                node.type === "emphasis" ||
                node.type === "delete" ||
                node.type === "link"
            ) {
                return toInlineText(node.children);
            }
            if (node.type === "break") {
                return " ";
            }
            return "";
        })
        .join("")
        .replace(/\s+/g, " ");
}

function toInlineSegments(nodes: PhrasingContent[]): InlineSegment[] {
    const segments: InlineSegment[] = [];

    for (const node of nodes) {
        if (node.type === "text") {
            segments.push({ type: "text", value: node.value });
        } else if (node.type === "inlineCode") {
            segments.push({ type: "code", value: node.value });
        } else if (
            node.type === "strong" ||
            node.type === "emphasis" ||
            node.type === "delete" ||
            node.type === "link"
        ) {
            segments.push(...toInlineSegments(node.children));
        } else if (node.type === "break") {
            segments.push({ type: "text", value: " " });
        }
    }

    return segments;
}
