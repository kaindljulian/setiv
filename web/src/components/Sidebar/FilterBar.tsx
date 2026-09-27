import type { ClauseStatus } from "@/model/trail";
import { useProjections, useView } from "@/state/context";
import {
    isFiltering,
    trailLevels,
    type SidebarFilter,
} from "@/view/sidebarFilter";
import { X } from "lucide-preact";
import { useMemo } from "preact/hooks";

const status: [ClauseStatus, string][] = [
    ["satisfied", "True"],
    ["falsified", "False"],
    ["unit", "Unit"],
    ["open", "Unknown"],
];

export function FilterBar() {
    const view = useView();
    const trail = useProjections().solverState.value?.trail;

    const section = view.sidebarSection.value;
    const filter = view.filter.value;

    const levels = useMemo(() => trailLevels(trail ?? []), [trail]);
    const picked = filter.level;
    const options =
        picked !== null && !levels.includes(picked)
            ? [...levels, picked].sort((a, b) => a - b)
            : levels;

    if (!section || !trail) {
        return null;
    }

    const set = (patch: Partial<SidebarFilter>) => view.setFilter(patch);

    return (
        <div class="border-base-300 bg-base-100 flex shrink-0 items-center justify-end gap-1.5 border-b px-2.5 py-1.5">
            {section === "trail" ? (
                <select
                    aria-label="Decision level"
                    value={filter.level ?? ""}
                    onChange={(e) =>
                        set({
                            level:
                                e.currentTarget.value === ""
                                    ? null
                                    : Number(e.currentTarget.value),
                        })
                    }
                    class="select select-xs w-24 shrink-0 text-xs"
                >
                    <option value="">any @</option>
                    {options.map((l) => (
                        <option key={l} value={l}>
                            @{l}
                        </option>
                    ))}
                </select>
            ) : (
                <select
                    aria-label="Clause status"
                    value={filter.status ?? ""}
                    onChange={(e) =>
                        set({
                            status:
                                (e.currentTarget.value as ClauseStatus | "") ||
                                null,
                        })
                    }
                    class="select select-xs w-24 shrink-0 text-xs"
                >
                    <option value="">any state</option>
                    {status.map(([s, label]) => (
                        <option key={s} value={s}>
                            {label}
                        </option>
                    ))}
                </select>
            )}

            <input
                aria-label="Filter by variable"
                placeholder="variable"
                value={filter.varQuery}
                onInput={(e) => set({ varQuery: e.currentTarget.value })}
                spellcheck={false}
                class="input input-xs min-w-0 flex-1 font-mono text-xs"
            />

            {isFiltering(filter) && (
                <button
                    type="button"
                    onClick={view.clearFilter}
                    title="Clear filter"
                    aria-label="Clear filter"
                    class="btn btn-ghost btn-xs shrink-0 px-1"
                >
                    <X size={13} />
                </button>
            )}
        </div>
    );
}
