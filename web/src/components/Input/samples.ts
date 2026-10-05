export interface Sample {
    file: string;
    label: string;
    note: string;
    vars: number;
    clauses: number;
    result: "sat" | "unsat";
}

/** Ordered roughly by how much work the solver has to do. */
export const samples: Sample[] = [
    {
        file: "chain_20.cnf",
        label: "Equivalence chain",
        note: "x1 <-> x2 <-> ... <-> x20. One decision propagates the whole chain.",
        vars: 20,
        clauses: 38,
        result: "sat",
    },
    {
        file: "kcolor_2_3.cnf",
        label: "Graph 2-coloring",
        note: "Two coloring problem for a 3-vertex complete graph.",
        vars: 6,
        clauses: 12,
        result: "unsat",
    },
    {
        file: "php_5_4.cnf",
        label: "Pigeonhole 5 to 4",
        note: "Five pigeons into four holes. Every branch ends in a conflict.",
        vars: 20,
        clauses: 45,
        result: "unsat",
    },
    {
        file: "ramsey_3_3_5.cnf",
        label: "Ramsey R(3,3), 5 vertices",
        note: "Describes a 5-vertex graph with no triangle and no independent set of size 3.",
        vars: 10,
        clauses: 20,
        result: "sat",
    },
    {
        file: "ramsey_3_3_6.cnf",
        label: "Ramsey R(3,3), 6 vertices",
        note: "Describes a 6-vertex graph with no triangle and no independent set of size 3.",
        vars: 15,
        clauses: 40,
        result: "unsat",
    },
    {
        file: "peb_pyr3_xor2.cnf",
        label: "Pebbling for pyramid of height 3",
        note: "XOR-substituted pebbling contradiction.",
        vars: 20,
        clauses: 58,
        result: "unsat",
    },
    {
        file: "tseitin_4reg_16.cnf",
        label: "Tseitin, 4-regular, 16 vertices",
        note: "Odd total charge on a random 4-regular graph.",
        vars: 32,
        clauses: 128,
        result: "unsat",
    },
    {
        file: "op_8.cnf",
        label: "Ordering principle, 8 elements",
        note: "Encodes an 8 element partial order in which no element is minimal.",
        vars: 56,
        clauses: 372,
        result: "unsat",
    },
    {
        file: "adder_miter_4bit.cnf",
        label: "4-bit adder miter",
        note: "Equivalence check of two 4-bit adders.",
        vars: 60,
        clauses: 191,
        result: "unsat",
    },
    {
        file: "sudoku.cnf",
        label: "Sudoku 9x9",
        note: "Encodes a 9x9 sudoku puzzle. Expect a large log.",
        vars: 729,
        clauses: 3257,
        result: "sat",
    },
];
