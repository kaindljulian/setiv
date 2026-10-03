import { BcpPanel } from "@/components/BcpPanel";
import { DecisionLevelChart } from "@/components/DecisionLevelChart";
import { DecisionTreePanel } from "@/components/DecisionTree/DecisionTreePanel";
import { EventLog } from "@/components/EventLog";
import { FormulaPanel } from "@/components/FormulaPanel";
import { DemoRun, Figure } from "@/components/Guide/DemoRun";
import { ImplicationPanel } from "@/components/ImplicationGraph/ImplicationPanel";
import { LoadDiagnostics } from "@/components/LoadDiagnostics";
import { Panel } from "@/components/Panel";
import { Sidebar } from "@/components/Sidebar/Sidebar";
import { StepBar } from "@/components/StepBar";
import { cn } from "@/lib/cn";
import { useSource } from "@/state/context";
import { Fragment, type ComponentChildren, type RefObject } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";

declare const __GIT_DATE__: string;

const repoUrl = "https://github.com/kaindljulian/setiv";
const protocolUrl = `${repoUrl}/blob/master/event_protocol/solver_event_protocol.md`;
const schemaUrl = `${repoUrl}/blob/master/event_protocol/json_schemas/solver_event_schema.json`;

interface Credit {
    name: string;
    url: string;
    note?: string;
}

const wasmSolvers: Credit[] = [
    {
        name: "CaDiCaL",
        url: "https://github.com/arminbiere/cadical",
        note: "patched with event protocol hooks",
    },
    {
        name: "MiniSat",
        url: "https://github.com/niklasso/minisat",
        note: "patched with event protocol hooks, only /core",
    },
    {
        name: "Satch",
        url: "https://github.com/arminbiere/satch",
        note: "patched with event protocol hooks, built for CDCL and with '--no-cdcl' for pure DPLL",
    },
    {
        name: "satotz",
        url: "https://github.com/kaindljulian/satotz",
        note: "a simple CDCL implementation",
    },
    {
        name: "setiv-dpll",
        url: "https://github.com/KaindlJulian/setiv/tree/master/solvers/setiv-dpll",
        note: "a simple DPLL implementation",
    },
];

const relatedWork: Credit[] = [
    {
        name: "Sat-IT",
        url: "https://github.com/udg-lai/sat-it",
        note: "another interactive CDCL tracer, a point of comparison while shaping this project's UI",
    },
    {
        name: "DPvis",
        url: "https://www.carstensinz.de/papers/SAT-2005.pdf",
        note: "Sinz, 2005, the search tree layout here follows some of its ideas",
    },
];

const protocolEvents: [string, string][] = [
    [
        "init",
        "the protocol version, the variable ids, and the full clause list",
    ],
    [
        "decide",
        "the literal the solver picked to assign, decision level, the heuristic",
    ],
    [
        "propagate",
        "the forced literal, decision level, the id of the reason clause",
    ],
    [
        "conflict",
        "the falsified clause with its literals, the level, a trail snapshot",
    ],
    ["learn", "the learned clause and its id, the jump level"],
    ["backtrack", "the backtracks from and to decision levels"],
    ["restart", "restart with running counter"],
    ["delete_clause", "a clause dropped from the database"],
    [
        "inspect",
        "one clause inspection during propagation, its outcome and its watched literals (only at BCP-level logging)",
    ],
    ["result", "unsat, unknown, or sat with the model"],
];

const eventLogDecalContent = `{"event":"decide","literal":-7,"level":3,"heuristic":"vmtf"}
{"event":"inspect","clause_id":12,"outcome":"unit","watched":[7,-2]}
{"event":"propagate","literal":-2,"level":3,"reason_clause_id":12}
{"event":"inspect","clause_id":19,"outcome":"unresolved","watched":[2,5],"next_watched":[2,9]}
{"event":"inspect","clause_id":23,"outcome":"falsified","watched":[2,11]}
{"event":"conflict","clause_id":23,"literals":[2,11],"level":3,"trail":[4,-1,8,-7,-2]}
{"event":"learn","learned_literals":[-4,1,11],"glue":2,"clause_id":46,"jump_level":1}
{"event":"backtrack","from_level":3,"to_level":1,"kind":"conflict","reason":"analyze"}
{"event":"propagate","literal":11,"level":1,"reason_clause_id":46}
{"event":"inspect","clause_id":31,"outcome":"satisfied","watched":[-11,6]}
{"event":"decide","literal":5,"level":2,"heuristic":"vmtf"}
{"event":"inspect","clause_id":8,"outcome":"unit","watched":[-5,3]}
{"event":"propagate","literal":3,"level":2,"reason_clause_id":8}
{"event":"inspect","clause_id":27,"outcome":"unresolved","watched":[-3,10],"next_watched":[-3,12]}
{"event":"decide","literal":-9,"level":3,"heuristic":"vmtf"}
{"event":"inspect","clause_id":44,"outcome":"unit","watched":[9,-6]}
{"event":"propagate","literal":-6,"level":3,"reason_clause_id":44}
{"event":"inspect","clause_id":17,"outcome":"falsified","watched":[6,-12]}
{"event":"conflict","clause_id":17,"literals":[6,-12],"level":3,"trail":[11,5,3,-9,-6]}
{"event":"learn","learned_literals":[-5,9,12],"glue":3,"clause_id":47,"jump_level":2}
{"event":"backtrack","from_level":3,"to_level":2,"kind":"conflict","reason":"analyze"}
{"event":"propagate","literal":12,"level":2,"reason_clause_id":47}
{"event":"restart","count":4}
{"event":"backtrack","from_level":2,"to_level":0,"kind":"restart","reason":"restart"}
{"event":"delete_clause","clause_id":38,"literals":[-6,3,9]}`;

const fadeEnds =
    "linear-gradient(to bottom, transparent 0%, #000 14%, #000 80%, transparent 100%)";

/** first learn event */
const conflictStep = 338;

const toc: { id: string; label: string }[] = [
    { id: "protocol", label: "Event protocol" },
    { id: "chart", label: "Decision level chart" },
    { id: "stepbar", label: "Step bar" },
    { id: "sidebar", label: "Trail and clause database" },
    { id: "tree", label: "Decision tree" },
    { id: "graph", label: "Implication graph" },
    { id: "formula", label: "Formula" },
    { id: "bcp", label: "BCP" },
    { id: "log", label: "Event log" },
    { id: "keys", label: "Keybinds" },
    { id: "solvers", label: "Solvers" },
    { id: "related", label: "Related" },
];

export function AboutPage() {
    const scroller = useRef<HTMLElement>(null);

    return (
        <main
            ref={scroller}
            class="min-h-0 min-w-0 flex-1 overflow-x-clip overflow-y-auto"
        >
            <div class="mx-auto flex max-w-246 gap-10 p-6 pb-16 text-sm leading-relaxed">
                <Contents scroller={scroller} />
                <div class="mx-auto flex w-full max-w-3xl min-w-0 flex-col gap-8">
                    <header class="flex flex-col gap-3">
                        <h1 class="text-2xl font-bold">SETIV</h1>
                        <p>
                            A viewer for CDCL search traces. A SAT solver writes
                            an event protocol as JSON as it searches, this
                            web-based viewer replays that log and uses it to
                            visualize the SAT solvers search.
                        </p>
                    </header>

                    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div class="border-base-300 bg-base-100 rounded-box border p-4">
                            <h2 class="mb-2 font-semibold">Event protocol</h2>
                            <p>
                                A JSON stream of what the solver did, written
                                without reference to any specific solver's
                                internals. A solver implements it by emitting an
                                event where its own code already decides,
                                propagates or learns.
                            </p>
                            <p class="mt-2 flex gap-3">
                                <a
                                    href={protocolUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    class="link"
                                >
                                    Specification
                                </a>
                                <a
                                    href={schemaUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    class="link"
                                >
                                    JSON schema
                                </a>
                            </p>
                        </div>
                        <div class="border-base-300 bg-base-100 rounded-box border p-4">
                            <h2 class="mb-2 font-semibold">Web-based viewer</h2>
                            <p>
                                This app reads such a log, or produces one by
                                running a solver in the browser, and replays it.
                                At any step of the run you can read the trail,
                                the clause database, the implication graph, the
                                search tree, and more.
                            </p>
                            <p class="mt-2">
                                The{" "}
                                <a href="#example_run" class="link">
                                    example below
                                </a>{" "}
                                demonstrates and explaines the different views.
                            </p>
                        </div>
                    </div>

                    <Section id="protocol" title="Event protocol">
                        <p>NDJSON, one event per line:</p>
                        <div class="relative mt-4">
                            <dl class="border-base-300 grid grid-cols-[auto_1fr] border-t">
                                {protocolEvents.map(([name, fields]) => (
                                    <Fragment key={name}>
                                        <dt class="border-base-300 border-b py-1.5 pr-6 font-mono">
                                            {name}
                                        </dt>
                                        <dd class="border-base-300 text-base-content/70 border-b py-1.5">
                                            {fields}
                                        </dd>
                                    </Fragment>
                                ))}
                            </dl>

                            <pre
                                aria-hidden="true"
                                style={{
                                    maskImage: fadeEnds,
                                    WebkitMaskImage: fadeEnds,
                                }}
                                class="pointer-events-none absolute -top-12 left-full ml-10 hidden w-160 bg-[image:linear-gradient(105deg,#23CCED_0%,#318CE3_25%,#3A5DDB_45%,transparent_62%)] bg-clip-text font-mono text-xs leading-6 whitespace-pre text-transparent opacity-60 select-none xl:block"
                            >
                                {eventLogDecalContent}
                            </pre>
                        </div>
                    </Section>

                    <DemoRun step={conflictStep}>
                        <div class="flex flex-col gap-8">
                            <LoadDiagnostics />

                            <section class="border-base-300 bg-base-100 rounded-box border p-4">
                                <h2
                                    class="mb-2 text-base font-semibold"
                                    id="example_run"
                                >
                                    Example to illustrate the different
                                    components
                                </h2>
                                <p>
                                    Every view below is live and interactive.
                                    They are all connected to the same run.
                                    Moving the cursor updates all views.
                                </p>
                                <p class="mt-2">
                                    This example run is: CaDiCaL on{" "}
                                    <code class="font-mono">php_5_4</code>, the
                                    pigeonhole formula for five pigeons and four
                                    holes (unsat).
                                </p>
                            </section>

                            <Dimacs />

                            <Section id="chart" title="Decision level chart">
                                <p>
                                    A global chart of decision level against
                                    event index. Hover for the event details,
                                    click to move the cursor.
                                </p>
                                <ChartFigure />
                            </Section>

                            <Section id="stepbar" title="Step bar">
                                <p>
                                    The main cursor control is the step bar at
                                    the bottom of the page. It shows the current
                                    step and lets you jump to any other step,
                                    either by clicking or dragging the handle.
                                </p>
                            </Section>

                            <Section
                                id="sidebar"
                                title="Trail and clause database"
                            >
                                <p>
                                    The trail at the current step with a level
                                    and a reason per literal, and the clause
                                    database split into original, learned and
                                    deleted.
                                </p>
                                <Figure class="h-120">
                                    <div class="border-base-300 bg-base-200 flex h-full w-80 flex-col overflow-hidden rounded border">
                                        <div class="flex min-h-0 flex-1 flex-col overflow-hidden">
                                            <Sidebar />
                                        </div>
                                    </div>
                                </Figure>
                            </Section>

                            <Section id="tree" title="Decision tree">
                                <p>
                                    The search tree of the run at the current
                                    step. A decision opens a branch, dashed
                                    edges mean propagated, a branch that was
                                    backtracked is grayed out.
                                </p>
                                <p class="mt-2">
                                    For large instances the tree can be huge, so
                                    it can be collapsed to hide majority of
                                    nodes.
                                </p>
                                <Figure class="h-120">
                                    <DecisionTreePanel />
                                </Figure>
                            </Section>

                            <Section id="graph" title="Implication graph">
                                <p>
                                    One node per assignment on the trail plus
                                    the conflict node. Edges represent
                                    propagations, labelled with the reason
                                    clause. The literals on the learned clause
                                    are highlighted.
                                </p>
                                <Figure class="h-120">
                                    <ImplicationPanel />
                                </Figure>
                            </Section>

                            <Section id="formula" title="Formula">
                                <p>
                                    The original clauses under the assignment at
                                    the current step. Learned and deleted
                                    clauses are not represented here, they are
                                    in the sidebar.
                                </p>
                                <Figure>
                                    <FormulaPanel />
                                </Figure>
                            </Section>

                            <Section id="bcp" title="BCP">
                                <p>
                                    Only for logs with
                                    <code class="font-mono"> inspect </code>
                                    events, which a solver emits at BCP level
                                    logging (see "Solver options" when creating
                                    a run). Watched literals are outlined.
                                </p>
                                <Figure>
                                    <BcpPanel active />
                                </Figure>
                            </Section>

                            <Section id="log" title="Event log">
                                <p>
                                    One row per parsed event, as the solver
                                    logged it. Click a row to jump there.
                                </p>
                                <Figure>
                                    <Panel fill title="Event Log">
                                        <EventLog active />
                                    </Panel>
                                </Figure>
                            </Section>

                            <div class="sticky bottom-4 z-10">
                                <div class="card card-border border-base-300 bg-base-100 overflow-hidden shadow-xl">
                                    <StepBar />
                                </div>
                            </div>
                        </div>
                    </DemoRun>

                    <Section id="keys" title="Keybinds">
                        <table class="w-auto border-separate border-spacing-y-2">
                            <tbody>
                                <Keybind
                                    keys={["→"]}
                                    action="Step forward one event"
                                />
                                <Keybind
                                    keys={["←"]}
                                    action="Step back one event"
                                />
                                <Keybind
                                    keys={["Ctrl", "→"]}
                                    action="Jump to the next conflict"
                                />
                                <Keybind
                                    keys={["Ctrl", "←"]}
                                    action="Jump to the previous conflict"
                                />
                            </tbody>
                        </table>
                    </Section>

                    <Section id="solvers" title="Solvers">
                        <CreditList items={wasmSolvers} />
                    </Section>

                    <Section id="related" title="Related">
                        <CreditList items={relatedWork} />
                    </Section>

                    <footer class="border-base-300 text-base-content/50 flex flex-wrap items-center gap-x-2 gap-y-1 border-t pt-4 text-xs">
                        <a
                            href={repoUrl}
                            target="_blank"
                            rel="noreferrer"
                            class="link"
                        >
                            Source on GitHub
                        </a>
                        <span>
                            (
                            <span class="font-mono">master {__GIT_DATE__}</span>
                            )
                        </span>
                    </footer>
                </div>
            </div>
        </main>
    );
}

function Contents({ scroller }: { scroller: RefObject<HTMLElement> }) {
    const [active, setActive] = useState(toc[0].id);
    const pinnedUntil = useRef(0);

    useEffect(() => {
        const root = scroller.current;

        if (!root) {
            return;
        }

        const sections = toc
            .map(({ id }) => document.getElementById(id))
            .filter((el): el is HTMLElement => el !== null);

        const update = () => {
            if (performance.now() < pinnedUntil.current) {
                return;
            }

            const line = root.getBoundingClientRect().top + 40;
            let current = toc[0].id;

            for (const section of sections) {
                if (section.getBoundingClientRect().top <= line) {
                    current = section.id;
                }
            }

            setActive(current);
        };

        update();
        root.addEventListener("scroll", update, { passive: true });

        return () => root.removeEventListener("scroll", update);
    }, []);

    return (
        <nav
            aria-label="On this page"
            class="sticky top-6 hidden w-44 shrink-0 self-start lg:block"
        >
            <p class="text-base-content/50 mb-2 pl-3 text-xs font-semibold tracking-wide uppercase">
                CONTENTS
            </p>
            <ul class="border-base-300 flex flex-col border-l">
                {toc.map(({ id, label }) => (
                    <li key={id} class="flex">
                        <a
                            href={`#${id}`}
                            onClick={() => {
                                setActive(id);
                                pinnedUntil.current = performance.now() + 600;
                            }}
                            aria-current={active === id ? "true" : undefined}
                            class={cn(
                                "-ml-px border-l py-1 pl-3 text-xs transition-colors",
                                active === id
                                    ? "border-primary text-primary font-medium"
                                    : "text-base-content/60 hover:text-base-content hover:border-base-content/30 border-transparent",
                            )}
                        >
                            {label}
                        </a>
                    </li>
                ))}
            </ul>
        </nav>
    );
}

function Dimacs() {
    const run = useSource().run.value;
    const init = run?.init;

    if (!run || !init) {
        return null;
    }

    const lines = [
        `p cnf ${init.variables} ${init.clauses}`,
        ...run.clauseDb.clauses
            .slice(0, run.clauseDb.firstLearnedIndex)
            .map((clause) => `${clause.literals.join(" ")} 0`),
    ];

    return (
        <div class="border-base-300 bg-base-200 rounded-box overflow-hidden border">
            <p class="border-base-300 text-base-content/60 border-b px-3 py-1.5 font-mono text-xs">
                php_5_4.cnf
            </p>
            <pre class="max-h-64 overflow-auto px-3 py-2 font-mono text-[11px] leading-5">
                {lines.join("\n")}
            </pre>
        </div>
    );
}

function ChartFigure() {
    const run = useSource().run.value;

    return (
        <Figure>
            <Panel
                fill
                title={`Decision level over time (${run?.stats.decisions ?? 0} decisions, ${run?.stats.restarts ?? 0} restarts)`}
            >
                <DecisionLevelChart navigate={false} />
            </Panel>
        </Figure>
    );
}

function Section({
    id,
    title,
    children,
}: {
    id?: string;
    title: string;
    children: ComponentChildren;
}) {
    return (
        <section id={id} class="scroll-mt-4">
            <h2 class="border-base-300 mb-3 border-b pb-1 text-base font-semibold">
                {title}
            </h2>
            {children}
        </section>
    );
}

function CreditList({ items }: { items: Credit[] }) {
    return (
        <ul class="flex list-disc flex-col gap-1.5 pl-5">
            {items.map((c) => (
                <li key={c.name}>
                    <a
                        href={c.url}
                        target="_blank"
                        rel="noreferrer"
                        class="link font-medium"
                    >
                        {c.name}
                    </a>
                    {c.note && (
                        <span class="text-base-content/60"> {c.note}</span>
                    )}
                </li>
            ))}
        </ul>
    );
}

function Keybind({ keys, action }: { keys: string[]; action: string }) {
    return (
        <tr>
            <td class="pr-4 align-top whitespace-nowrap">
                {keys.map((k, i) => (
                    <span key={k}>
                        {i > 0 && <span class="mx-1">+</span>}
                        <kbd class="kbd kbd-sm">{k}</kbd>
                    </span>
                ))}
            </td>
            <td class="text-base-content/80 align-top">{action}</td>
        </tr>
    );
}
