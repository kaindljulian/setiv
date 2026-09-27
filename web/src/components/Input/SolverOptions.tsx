import { type SolverInfo } from "@/model/solvers";
import { ChevronRight } from "lucide-preact";
import { useEffect, useState } from "preact/hooks";

export function useSolverFlags(solver: SolverInfo) {
    const [text, setText] = useState(solver.wasm.defaultFlags.join(" "));

    useEffect(() => {
        setText(solver.wasm.defaultFlags.join(" "));
    }, [solver.id]);

    return {
        text,
        setText,
        flags: text.split(/\s+/).filter((word) => word.length > 0),
    };
}

interface SolverOptionsProps {
    id: string;
    cnfName: string;
    solver: SolverInfo;
    busy: boolean;
    flags: string[];
    flagText: string;
    setFlagText: (next: string) => void;
}

export function SolverOptions({
    id,
    cnfName,
    solver,
    busy,
    flags,
    flagText,
    setFlagText,
}: SolverOptionsProps) {
    const bcpFlag = solver.wasm.bcpFlag;
    const bcp = bcpFlag !== "" && flags.includes(bcpFlag);

    const toggleBcp = (on: boolean) => {
        const rest = flags.filter((f) => f !== bcpFlag);
        setFlagText(on ? [...rest, bcpFlag].join(" ") : rest.join(" "));
    };

    // workaround for finding split between flags and filename in argv
    const marker = String.fromCharCode(0);
    const argv = solver.wasm.argv([marker], {
        cnf: cnfName,
        log: "events.jsonl",
    });
    const split = argv.indexOf(marker);
    const head = split < 0 ? argv : argv.slice(0, split);
    const tail = split < 0 ? [] : argv.slice(split + 1);

    return (
        <details class="group min-w-0 flex-1">
            <summary class="text-base-content/70 hover:text-base-content inline-flex cursor-pointer list-none items-center gap-1 text-xs">
                <ChevronRight
                    size={13}
                    class="transition-transform group-open:rotate-90"
                />
                Solver options
            </summary>

            <div class="mt-3 flex flex-col gap-3 text-xs">
                <div class="flex items-baseline justify-between gap-2">
                    <a
                        class="hover:underline"
                        href={solver.link}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        {solver.name}
                    </a>
                    <span class="text-base-content/50 font-mono">
                        {solver.version}
                    </span>
                </div>

                <div class="flex items-baseline gap-2">
                    <label for={id} class="shrink-0 font-medium">
                        Flags
                    </label>
                    <input
                        id={id}
                        value={flagText}
                        onInput={(e) => setFlagText(e.currentTarget.value)}
                        spellcheck={false}
                        disabled={busy}
                        class="input input-xs min-w-0 flex-1 font-mono text-xs"
                    />
                </div>

                {bcpFlag !== "" && (
                    <label
                        class="flex w-fit cursor-pointer items-center gap-2"
                        title="Logs every clause inspection during propagation. Makes the log much larger."
                    >
                        <input
                            type="checkbox"
                            checked={bcp}
                            onChange={(e) => toggleBcp(e.currentTarget.checked)}
                            disabled={busy}
                            class="toggle toggle-xs"
                        />
                        <span class="font-medium">BCP-level logging</span>
                    </label>
                )}

                <pre class="border-base-300 bg-base-200 text-base-content/80 flex gap-2 rounded border p-2 font-mono wrap-break-word whitespace-pre-wrap">
                    <span class="text-base-content/40 select-none">$</span>
                    <code>
                        <span class="text-base-content/40">
                            {head.join(" ")}{" "}
                        </span>
                        <span>{flags.join(" ")}</span>
                        <span class="text-base-content/40">
                            {" "}
                            {tail.join(" ")}
                        </span>
                    </code>
                </pre>
            </div>
        </details>
    );
}
