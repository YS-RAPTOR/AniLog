import { ChevronRight } from "lucide-react";
import { useState } from "react";
import {
    AnimatedRouteIcon,
    type AnimationType,
} from "@/components/animated-icons";
import { Card } from "@/components/ui/card";
import { Link } from "@tanstack/react-router";

export type PathCardProps = {
    to: string;
    animationType: AnimationType;
    title: string;
    description: string;
    features: string[];
    cta: string;
};

export function PathCard(props: Readonly<PathCardProps>) {
    const [boosted, setBoosted] = useState(false);

    return (
        <Link key={props.to} to={props.to} className="group block">
            <Card
                variant="framed"
                effect="offset"
                className="p-6 h-full"
                containerClassName="relative top-0 left-0 transition-[top,left] duration-200 group-hover:-top-2 group-hover:-left-2"
            >
                <AnimatedRouteIcon
                    type={props.animationType}
                    boosted={boosted}
                />
                <div
                    className="space-y-4 relative z-10"
                    onMouseEnter={() => setBoosted(true)}
                    onMouseLeave={() => setBoosted(false)}
                >
                    <div>
                        <h2 className="text-2xl font-black uppercase border-b-4 border-foreground pb-2 mb-2">
                            {props.title}
                        </h2>
                        <p className="text-sm font-medium text-muted-foreground mt-2">
                            {props.description}
                        </p>
                    </div>

                    <ul className="space-y-2 border-t-2 border-foreground/40 pt-3 text-sm font-semibold text-muted-foreground">
                        {props.features.map((feature) => (
                            <li
                                key={feature}
                                className="flex items-center gap-3"
                            >
                                <div className="w-2 h-2 bg-foreground transform rotate-45 shrink-0" />
                                {feature}
                            </li>
                        ))}
                    </ul>

                    <div className="pt-4 flex items-center font-bold uppercase tracking-wider border-t-4 border-foreground mt-4 text-sm">
                        {props.cta}
                        <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-2 transition-transform" />
                    </div>
                </div>
            </Card>
        </Link>
    );
}
