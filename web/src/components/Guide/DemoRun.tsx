import { cn } from "@/lib/cn";
import { varNames } from "@/lib/naming";
import { SolverProvider, useCursor, useSource } from "@/state/context";
import type { ComponentChildren } from "preact";
import { useEffect } from "preact/hooks";

const logName = "php_5_4_cadical_events.jsonl";
const logUrl = `${import.meta.env.BASE_URL}guide/${logName}`;

/**
 * The run the guide draws, in a store of its own so the figures can be the
 * app's own panels without disturbing the run the user has open.
 */
export function DemoRun({
    step,
    children,
}: {
    /** Event the cursor starts on, instead of the first conflict. */
    step?: number;
    children: ComponentChildren;
}) {
    return (
        <SolverProvider>
            <LoadDemo step={step} />
            {children}
        </SolverProvider>
    );
}

function LoadDemo({ step }: { step?: number }) {
    const source = useSource();
    const cursor = useCursor();

    useEffect(() => {
        let live = true;

        const load = async () => {
            const res = await fetch(logUrl);

            if (!res.ok) {
                throw new Error(`HTTP ${res.status}`);
            }

            const text = await res.text();

            if (!live) {
                return;
            }

            // a load clears the variable names, and those belong to whatever
            // run the user has open in the app store
            const names = varNames.peek();
            source.loadLog(text, logName);
            varNames.value = names;

            if (step != null) {
                cursor.jumpTo(step);
            }
        };

        load().catch((err) => {
            if (live) {
                source.setLoadError(`Could not load ${logName}: ${err}`);
            }
        });

        return () => {
            live = false;
        };
    }, []);

    return null;
}

/** Bounded box a `fill` panel can live in, outside the app's layout. */
export function Figure({
    class: className,
    children,
}: {
    class?: string;
    children: ComponentChildren;
}) {
    return (
        <div class={cn("mt-3 flex min-h-0 flex-col", className ?? "h-96")}>
            {children}
        </div>
    );
}
