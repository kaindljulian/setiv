import { cn } from "@/lib/cn";
import { colors } from "@/view/theme";
import { ChevronRight } from "lucide-preact";
import { useRef } from "preact/hooks";
import { samples, type Sample } from "./samples";

interface SampleListProps {
    busy: boolean;
    onPick: (sample: Sample) => void; // file dialog
}

export function SampleList({ busy, onPick }: SampleListProps) {
    const details = useRef<HTMLDetailsElement>(null);

    const choose = (sample: Sample) => {
        if (details.current) {
            details.current.open = false;
        }
        onPick(sample);
    };

    return (
        <details ref={details} class="group min-w-0">
            <summary class="text-base-content/70 hover:bg-base-200 hover:text-base-content -mx-1 flex cursor-pointer list-none items-center gap-1 rounded px-1 py-2 text-xs transition-colors">
                <ChevronRight
                    size={13}
                    class="transition-transform group-open:rotate-90"
                />
                Samples
            </summary>

            <div class="border-base-300 mt-3 overflow-hidden rounded border text-xs">
                <div
                    class={cn(
                        "grid grid-cols-[minmax(0,1fr)_4.5rem_3.5rem] items-center gap-2",
                        "border-base-300 bg-base-200 text-base-content/50 border-b px-2 py-1 text-[10px] tracking-wide uppercase",
                    )}
                >
                    <span>Name</span>
                    <span class="text-right">vars/clauses</span>
                    <span class="text-right">result</span>
                </div>

                <ul class="divide-base-300 divide-y">
                    {samples.map((s) => (
                        <li key={s.file}>
                            <button
                                type="button"
                                onClick={() => choose(s)}
                                disabled={busy}
                                title={`${s.file} - ${s.note}`}
                                class={cn(
                                    "grid grid-cols-[minmax(0,1fr)_4.5rem_3.5rem] items-center gap-2",
                                    "hover:bg-base-200 w-full cursor-pointer px-2 py-1.5 text-left disabled:cursor-not-allowed",
                                )}
                            >
                                <span class="truncate font-medium">
                                    {s.label}
                                </span>
                                <span class="text-base-content/50 text-right font-mono tabular-nums">
                                    {s.vars}/{s.clauses}
                                </span>
                                <span class="text-right">
                                    <span
                                        class={cn(
                                            "badge badge-xs badge-soft",
                                            colors[s.result],
                                        )}
                                    >
                                        {s.result.toUpperCase()}
                                    </span>
                                </span>
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        </details>
    );
}
