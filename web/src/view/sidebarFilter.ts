import { varNames } from "@/lib/naming";
import type { ClauseRecord } from "@/model/clauseDatabase";
import {
    clauseStatus,
    type ClauseStatus,
    type SolverState,
    type TrailEntry,
} from "@/model/trail";

export interface SidebarFilter {
    varQuery: string;
    level: number | null;
    status: ClauseStatus | null;
}

export function isFiltering(filter: SidebarFilter): boolean {
    return (
        filter.varQuery.trim() !== "" ||
        filter.level !== null ||
        filter.status !== null
    );
}

/**
 * check if lit matches var query
 */
export function matchesVariable(lit: number, query: string): boolean {
    const v = Math.abs(lit);
    const asVariable = Number(query);

    if (Number.isInteger(asVariable)) {
        return v === asVariable;
    }

    const name = varNames.value?.[v];
    return name != null && name.toLowerCase().includes(query);
}

export function trailLevels(trail: readonly TrailEntry[]): number[] {
    return [...new Set(trail.map((entry) => entry.level))].sort(
        (a, b) => a - b,
    );
}

export function filterTrail(
    trail: readonly TrailEntry[],
    filter: SidebarFilter,
    keep: number | null,
): readonly TrailEntry[] {
    const query = filter.varQuery.trim().toLowerCase();

    if (filter.level === null && query === "") {
        return trail;
    }

    return trail.filter((entry) => {
        if (entry.eventIndex === keep) {
            return true;
        }

        if (query === "" || matchesVariable(entry.lit, query)) {
            return filter.level === null || entry.level === filter.level;
        }

        return false;
    });
}

export function filterClauses(
    records: ClauseRecord[],
    state: SolverState,
    filter: SidebarFilter,
    keep: number | null,
): ClauseRecord[] {
    const query = filter.varQuery.trim().toLowerCase();

    if (filter.status === null && query === "") {
        return records;
    }

    return records.filter((record) => {
        if (record.id === keep) {
            return true;
        }

        const status = clauseStatus(record.literals, state);

        if (
            query === "" ||
            record.literals.some((lit) => matchesVariable(lit, query))
        ) {
            return filter.status === null || status === filter.status;
        }

        return false;
    });
}
