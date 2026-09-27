import { solverById, solvers } from "@/model/solvers";
import { computed, signal } from "@preact/signals";

export const selectedSolverId = signal(solvers[0].id);

export const selectedSolver = computed(
    () => solverById(selectedSolverId.value) ?? solvers[0],
);
