import {
    clausesInSectionAt,
    type ClauseRecord,
    type ClauseSection,
} from "@/model/clauseDatabase";
import type { TrailEntry } from "@/model/trail";
import { useCursor, useProjections, useSource, useView } from "@/state/context";
import type { SidebarSection } from "@/state/viewStore";
import { filterClauses, filterTrail } from "@/view/sidebarFilter";
import { useMemo } from "preact/hooks";
import { ClauseList } from "./ClauseList";
import { CollapsibleSection } from "./CollapsibleSection";
import { FilterBar } from "./FilterBar";
import { StatsBar } from "./StatsBar";
import { TrailList } from "./TrailList";

const noRecords: ClauseRecord[] = [];
const noEntries: readonly TrailEntry[] = [];

export function Sidebar() {
    const projections = useProjections();
    const cursor = useCursor();
    const view = useView();
    const open = view.sidebarSection.value;
    const selectedClause = view.selectedClauseId.value;
    const selectedEvent = view.selectedEvent.value;
    const run = useSource().run.value;
    const state = projections.solverState.value;
    const step = cursor.stepIndex.value;
    const filter = view.filter.value;

    const clauseSection = open && open !== "trail" ? open : null;

    const all = useMemo(() => {
        if (run && clauseSection) {
            return clausesInSectionAt(run.clauseDb, clauseSection, step);
        }
        return noRecords;
    }, [run, clauseSection, step]);

    const records = useMemo(() => {
        if (!state) {
            return all;
        }
        return filterClauses(all, state, filter, selectedClause);
    }, [all, state, filter, selectedClause]);

    const trail = useMemo(() => {
        if (!state) {
            return noEntries;
        }
        return filterTrail(state.trail, filter, selectedEvent);
    }, [state, filter, selectedEvent]);

    /** one is open at a time */
    const section = (id: SidebarSection) => ({
        open: open === id,
        onToggle: () => view.toggleSection(id),
    });

    const listFor = (id: ClauseSection) => (open === id ? records : noRecords);

    if (!run || !state) {
        return;
    }

    const counts = projections.clauseCounts.value;

    const clausesFiltered = records !== all;
    const trailFiltered = trail !== state.trail;

    const badge = (id: ClauseSection) => {
        if (id === open && clausesFiltered) {
            return `${records.length}/${all.length}`;
        } else {
            return counts[id];
        }
    };

    const emptyFor = (text: string) =>
        clausesFiltered ? "No clauses match the filter." : text;

    return (
        <>
            <StatsBar />
            <FilterBar />

            <CollapsibleSection
                title="Trail"
                badge={`${trailFiltered && open === "trail" ? `${trail.length}/` : ""}${state.trail.length} - @${state.decisionLevel}`}
                {...section("trail")}
            >
                <TrailList
                    entries={trail}
                    empty={
                        trailFiltered
                            ? "No assignments match the filter."
                            : "Nothing assigned at this step."
                    }
                />
            </CollapsibleSection>

            <CollapsibleSection
                title="Original clauses"
                badge={badge("original")}
                {...section("original")}
            >
                <ClauseList
                    records={listFor("original")}
                    state={state}
                    empty={emptyFor("No original clauses alive at this step.")}
                    selectedId={selectedClause}
                />
            </CollapsibleSection>

            <CollapsibleSection
                title="Learned"
                badge={badge("learned")}
                {...section("learned")}
            >
                <ClauseList
                    records={listFor("learned")}
                    state={state}
                    empty={emptyFor("Nothing learned at this step.")}
                    selectedId={selectedClause}
                />
            </CollapsibleSection>

            <CollapsibleSection
                title="Deleted"
                badge={badge("deleted")}
                {...section("deleted")}
            >
                <ClauseList
                    records={listFor("deleted")}
                    state={state}
                    empty={emptyFor("No clauses deleted at this step.")}
                    selectedId={selectedClause}
                />
            </CollapsibleSection>
        </>
    );
}
