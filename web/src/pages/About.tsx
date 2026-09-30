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

declare const __GIT_SUBJECT__: string;
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
    ["decide", "the chosen literal, its level, the heuristic behind it"],
    ["propagate", "the forced literal, its level, the id of the reason clause"],
    [
        "conflict",
        "the falsified clause with its literals, the level, the trail",
    ],
    [
        "learn",
        "the learned clause and its id, the jump level, the glue if the solver keeps one",
    ],
    ["backtrack", "the levels unwound from and to, and what asked for it"],
    ["restart", "the restart counter"],
    ["delete_clause", "a clause dropped from the database"],
    [
        "inspect",
        "one clause inspection during propagation, its outcome and its watched literals, only at BCP level logging",
    ],
    ["result", "sat, unsat or unknown, with the model"],
];

/** Decoration beside the event list. Rough shape and event names, nothing to read. */
const logWash = `{"event":"decide","literal":-7,"level":3,"heuristic":"vmtf"}
{"event":"inspect","clause_id":12,"outcome":"unit","watched":[7,-2]}
{"event":"propagate","literal":-2,"level":3,"reason_clause_id":12}
{"event":"inspect","clause_id":19,"outcome":"unresolved","watched":[2,5],"next_watched":[2,9]}
{"event":"inspect","clause_id":23,"outcome":"falsified","watched":[2,11]}
{"event":"conflict","clause_id":23,"literals":[2,11],"level":3,"trail":[4,-1,8,-7,-2]}
{"event":"learn","learned_literals":[-4,1,11],"glue":2,"clause_id":46,"jump_level":1}
{"event":"backtrack","from_level":3,"to_level":1,"kind":"conflict","reason":"analyze"}
{"event":"propagate","literal":11,"level":1,"reason_clause_id":46}
{"event":"delete_clause","clause_id":38,"literals":[-6,3,9]}`;

/** The `learn` event of the deepest conflict, where the figures start. */
const conflictStep = 338;

const contents: { id: string; label: string }[] = [
    { id: "protocol", label: "Event protocol" },
    { id: "cursor", label: "Cursor" },
    { id: "stepbar", label: "Step bar" },
    { id: "sidebar", label: "Trail and clause database" },
    { id: "tree", label: "Decision tree" },
    { id: "graph", label: "Implication graph" },
    { id: "formula", label: "Formula" },
    { id: "bcp", label: "BCP" },
    { id: "log", label: "Event log" },
    { id: "chart", label: "Decision level chart" },
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
            <div class="mx-auto flex max-w-[61.5rem] gap-10 p-6 pb-16 text-sm leading-relaxed">
                <Contents scroller={scroller} />
                <div class="mx-auto flex w-full max-w-3xl min-w-0 flex-col gap-8">
                    <header class="flex flex-col gap-3">
                        <h1 class="text-2xl font-bold">SETIV</h1>
                        <p>
                            A viewer for CDCL search traces. A solver writes one
                            JSON event per line while it searches, and this app
                            replays that log: the trail, the clause database,
                            the implication graph of a conflict, the search
                            tree, and the decision level over time, each at a
                            step you pick.
                        </p>
                        <p>
                            This page explains every view and what you can do in
                            it. It assumes you know CDCL, so decisions,
                            propagation, conflict analysis, backjumping and
                            watched literals are used without introduction.
                        </p>
                    </header>

                    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div class="border-base-300 bg-base-100 rounded-box border p-4">
                            <h2 class="mb-2 font-semibold">Event protocol</h2>
                            <p>
                                An NDJSON stream of what a search does, written
                                without reference to any solver's internals. A
                                solver implements it by emitting an event where
                                its own code already decides, propagates or
                                learns.
                            </p>
                            <p class="mt-2 flex gap-3">
                                <a
                                    href={protocolUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    class="link"
                                >
                                    Spec
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
                                the clause database, the implication graph of
                                the conflict, the search tree and the decision
                                level.
                            </p>
                            <p class="mt-2">
                                <a href="/" class="link">
                                    Load an example
                                </a>
                            </p>
                        </div>
                    </div>

                    <Section id="protocol" title="Event protocol">
                        <div class="relative">
                            <p>
                                NDJSON, one event per line. A log opens with{" "}
                                <code class="font-mono">init</code> and ends
                                with <code class="font-mono">result</code>.
                                Whatever a solver emits after that is teardown,
                                and the parser stops there.
                            </p>

                            <dl class="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
                                {protocolEvents.map(([name, fields]) => (
                                    <Fragment key={name}>
                                        <dt class="font-mono">{name}</dt>
                                        <dd class="text-base-content/70">
                                            {fields}
                                        </dd>
                                    </Fragment>
                                ))}
                            </dl>

                            <p class="mt-3">
                                The protocol names no solver internals, which is
                                what makes one log readable next to another.
                                Fields a solver has nothing to say about are
                                left out rather than filled with placeholders,
                                so a view shows a glue value only for a log that
                                carried one.
                            </p>
                            <p class="mt-2">
                                Everything in the viewer is derived from the
                                log. There is no second channel to the solver,
                                and a log from a file is worth exactly as much
                                as one produced in the browser a second ago.
                            </p>

                            <pre
                                aria-hidden="true"
                                class="pointer-events-none absolute top-0 left-full ml-10 hidden w-[40rem] bg-[image:linear-gradient(105deg,#23CCED_0%,#318CE3_25%,#3A5DDB_45%,transparent_62%)] bg-clip-text font-mono text-[11px] leading-5 whitespace-pre text-transparent opacity-60 select-none xl:block"
                            >
                                {logWash}
                            </pre>
                        </div>
                    </Section>

                    <Section id="cursor" title="Cursor">
                        <p>
                            One integer drives the app: the index of the current
                            event. Every view is a function of the run and that
                            index. The state at a step, meaning the assignment,
                            the decision level, the trail with a reason per
                            literal, the clause database as it stood and the
                            conflict if one is active, comes from replaying the
                            prefix of the log. Checkpoints along the way keep
                            stepping backwards from refolding the whole prefix.
                        </p>
                        <p class="mt-2">
                            There are two step values. Dragging the slider moves
                            the live step on every tick and the cheap views
                            follow it. Releasing commits, and the expensive
                            views rebuild on the committed step. The selected
                            conflict is derived rather than stored: it is the
                            last conflict at or before the committed step, which
                            is why the conflict badge changes as you scrub past
                            one.
                        </p>
                    </Section>

                    <DemoRun step={conflictStep}>
                        <div class="flex flex-col gap-8">
                            <LoadDiagnostics />

                            <section class="border-base-300 bg-base-100 rounded-box border p-4">
                                <h2 class="mb-2 text-base font-semibold">
                                    The run below
                                </h2>
                                <p>
                                    Every figure on this page is live and shows
                                    CaDiCaL on{" "}
                                    <code class="font-mono">php_5_4</code>, the
                                    pigeonhole formula for five pigeons and four
                                    holes. 20 variables, 45 clauses, UNSAT,
                                    logged at BCP level. The flags{" "}
                                    <code class="font-mono">
                                        --chrono=false
                                    </code>
                                    , <code class="font-mono">--no-otfs</code>{" "}
                                    and{" "}
                                    <code class="font-mono">--shrink=0</code>{" "}
                                    keep the trace close to textbook CDCL.
                                </p>
                                <p class="mt-2">
                                    The figures are the app's own panels and
                                    they share one cursor, so a click in one of
                                    them moves the others. In the graph views,
                                    drag to pan and scroll to zoom.
                                </p>
                            </section>

                            <Section id="stepbar" title="Step bar">
                                <p>
                                    The cursor control, below the view in the
                                    main page. The slider spans the whole log.
                                    The transport buttons step one event, or
                                    jump to the previous or next conflict. To
                                    the right is the step index, the current
                                    event as one line of text, and a badge with
                                    the index of the selected conflict.
                                </p>
                                <p class="mt-2">
                                    The red ticks above the slider mark conflict
                                    events, drawn for runs with fewer than 200
                                    conflicts, which is enough to see where the
                                    search struggled. Arrow keys do the same as
                                    the transport buttons, except on this page,
                                    where they are left to the browser so the
                                    page still scrolls.
                                </p>
                                <p class="mt-2">
                                    Here the bar is pinned to the bottom of the
                                    window for as long as a figure is on screen,
                                    so you can drive all of them from one place.
                                </p>
                            </Section>

                            <Section
                                id="sidebar"
                                title="Trail and clause database"
                            >
                                <p>
                                    The sidebar of the main page. Its header
                                    counts the whole run and shows the result. A
                                    run solved in the browser also offers its
                                    generated log for download, so you can keep
                                    it and load it later.
                                </p>
                                <p class="mt-2">
                                    The trail lists every assignment at the
                                    current step, in assignment order, with its
                                    decision level and its reason. The reason
                                    reads{" "}
                                    <code class="font-mono">decision</code> for
                                    decisions, <code class="font-mono">cN</code>{" "}
                                    for a propagation forced by clause N, and{" "}
                                    <code class="font-mono">unit</code> for a
                                    root level unit with no clause behind it.
                                    Dividers separate the levels. Clicking a row
                                    moves the cursor to the event that made the
                                    assignment, clicking its reason reveals that
                                    clause in the list it belongs to.
                                </p>
                                <p class="mt-2">
                                    Below the trail are the clauses: the
                                    original ones from{" "}
                                    <code class="font-mono">init</code>, the
                                    learned ones alive at this step, and the
                                    ones deleted at or before it. Literals are
                                    coloured by their current value. Deletions
                                    come from clause database reduction during
                                    the search. This run is too short for one,
                                    and whatever a solver deletes while tearing
                                    down after{" "}
                                    <code class="font-mono">result</code> is
                                    past the end of the log.
                                </p>
                                <p class="mt-2">
                                    The filter row acts on the open section. On
                                    the trail it filters by decision level, on a
                                    clause list by the clause state under the
                                    current assignment, and the text box matches
                                    variables. The badge then reads matches over
                                    total.
                                </p>
                                <Figure class="h-[30rem]">
                                    <div class="border-base-300 bg-base-200 flex h-full w-80 flex-col overflow-hidden rounded border">
                                        <div class="flex min-h-0 flex-1 flex-col overflow-hidden">
                                            <Sidebar />
                                        </div>
                                    </div>
                                </Figure>
                            </Section>

                            <Section id="tree" title="Decision tree">
                                <p>
                                    The search tree of the whole run as it
                                    stands at the committed step. The root is
                                    level 0. A decision opens a branch, drawn
                                    with a solid edge, and everything it
                                    propagates hangs off it on dashed edges.
                                    Conflicts are diamonds. A node whose
                                    assignment a backtrack has already unwound
                                    stays drawn, dimmed, so the refuted part of
                                    the search keeps its place in the picture.
                                </p>
                                <p class="mt-2">
                                    Two modes. Decisions folds each propagation
                                    chain into the decision that caused it and
                                    writes <code class="font-mono">+N</code>{" "}
                                    next to the node for the N literals it
                                    stands for. Propagations draws every
                                    propagated literal as its own node. Logs
                                    above 400 events start folded.
                                </p>
                                <p class="mt-2">
                                    Materializing the tree is capped at 1200
                                    nodes. Above that, subtrees collapse behind
                                    a dashed <code class="font-mono">+</code>{" "}
                                    marker that counts what it hides, and a
                                    badge in the header counts the hidden nodes.
                                    Click a marker to open one, or use Expand
                                    All and Collapse All. This run fits the cap,
                                    so no markers appear.
                                </p>
                                <p class="mt-2">
                                    Hovering a node gives its kind, event index,
                                    level, position on the trail, and either the
                                    heuristic that picked the decision or the
                                    reason clause with its literals under the
                                    current assignment. Clicking an assignment
                                    selects it in the trail, clicking a conflict
                                    moves the cursor to it.
                                </p>
                                <Figure class="h-[30rem]">
                                    <DecisionTreePanel />
                                </Figure>
                            </Section>

                            <Section id="graph" title="Implication graph">
                                <p>
                                    One node per assignment on the trail, plus
                                    the conflict node κ. A node shows its
                                    literal, with an overbar when negative, and
                                    its decision level on the right. Decisions
                                    carry an accent bar. A node is filled as
                                    learned when its negation appears in the
                                    learned clause, which marks the cut that
                                    conflict analysis settled on, and the clause
                                    itself is shown as a badge above the graph
                                    once the{" "}
                                    <code class="font-mono">learn</code> event
                                    is reached.
                                </p>
                                <p class="mt-2">
                                    An edge goes from each antecedent of a
                                    propagation to the literal it forced and
                                    carries the id of the reason clause. The
                                    edges into κ come from the literals of the
                                    falsified clause.
                                </p>
                                <p class="mt-2">
                                    Scope: Full is the implication graph of the
                                    whole trail, Cone keeps only the ancestors
                                    of κ. A graph with a conflict and more than
                                    30 nodes starts as a cone.
                                </p>
                                <p class="mt-2">
                                    Under 100 variables the graph follows the
                                    cursor event by event and animates each node
                                    as it enters. Above that it would be too
                                    expensive to rebuild per step, so it is
                                    anchored at the selected conflict and marked
                                    as a snapshot. When the cursor has moved
                                    past that anchor, a badge says how far
                                    behind the drawing is and takes you back to
                                    the conflict event. This run has 20
                                    variables, so the graph here is live.
                                </p>
                                <p class="mt-2">
                                    Hovering a node shows the clause that forced
                                    it, or falsified it for κ. Clicking a node
                                    selects it in the trail, clicking an edge
                                    label reveals the reason clause. The
                                    conflict selector steps through conflicts or
                                    picks one from the list, where every entry
                                    names its clause, level and event.
                                </p>
                                <Figure class="h-[30rem]">
                                    <ImplicationPanel />
                                </Figure>
                            </Section>

                            <Section id="formula" title="Formula">
                                <p>
                                    The original clauses from{" "}
                                    <code class="font-mono">init</code>,
                                    evaluated under the assignment at the
                                    current step. Lines mode draws one clause
                                    per line with its id in the gutter and tints
                                    the row by clause state: satisfied,
                                    falsified, or unit. Continuous mode sets the
                                    same clauses as flowing text and is off
                                    above 500 clauses, where it stops being
                                    readable anyway. The highlight button
                                    switches the tint from clause state to
                                    literal value. Clicking a clause id reveals
                                    it in the sidebar.
                                </p>
                                <p class="mt-2">
                                    Learned clauses are deliberately not here.
                                    This view is the input formula, the sidebar
                                    holds what the solver added.
                                </p>
                                <Figure>
                                    <FormulaPanel />
                                </Figure>
                            </Section>

                            <Section id="bcp" title="BCP">
                                <p>
                                    Present only for logs that contain{" "}
                                    <code class="font-mono">inspect</code>{" "}
                                    events, which a solver emits at BCP level
                                    logging. The rows are the clauses alive at
                                    this step, original first, then learned.
                                </p>
                                <p class="mt-2">
                                    When the cursor sits on an inspection, its
                                    clause is tinted by the outcome, satisfied,
                                    unit, falsified or unresolved, and the view
                                    scrolls to that row. The watched literals
                                    are ringed. If the inspection moved a watch,
                                    the new pair is ringed and the literal it
                                    replaced keeps a dashed outline, so stepping
                                    through a propagation phase one event at a
                                    time walks the watch lists clause by clause.
                                </p>
                                <p class="mt-2">
                                    The page starts on a{" "}
                                    <code class="font-mono">learn</code> event,
                                    where no clause is under inspection. Step
                                    forward with the bar at the bottom to watch
                                    the rows light up.
                                </p>
                                <Figure>
                                    <BcpPanel active />
                                </Figure>
                            </Section>

                            <Section id="log" title="Event log">
                                <p>
                                    One row per parsed event, as the solver
                                    logged it. The row at the cursor is
                                    highlighted and the view follows it.
                                    Clicking a row moves the cursor there. When
                                    a view surprises you, this is where to check
                                    what the solver actually claimed.
                                </p>
                                <Figure>
                                    <Panel fill title="Event Log">
                                        <EventLog active />
                                    </Panel>
                                </Figure>
                            </Section>

                            <Section id="chart" title="Decision level chart">
                                <p>
                                    Decision level against event index, as a
                                    step function, on its own page. Decisions
                                    climb one level at a time, a backjump drops
                                    straight to the jump level, and the sawtooth
                                    that comes out is the shape of the search.
                                </p>
                                <p class="mt-2">
                                    Restarts are dashed vertical marks, up to a
                                    limit past which they would hide the line.
                                    This run never restarts, it ends long before
                                    any restart interval is reached.
                                </p>
                                <p class="mt-2">
                                    When the visible range holds more events
                                    than pixels, each pixel column is reduced to
                                    one point and a band behind the line gives
                                    the minimum and maximum level in that
                                    column, so a deep dive between two sampled
                                    events stays visible. Zooming in far enough
                                    drops the band and draws every event. Hover
                                    for a crosshair with the event index, the
                                    level and the event text. In the app a click
                                    opens that event in the main view; here it
                                    only moves the cursor.
                                </p>
                                <ChartFigure />
                            </Section>

                            <div class="sticky bottom-0 z-10 mb-4">
                                <div class="card card-border border-base-300 bg-base-100 overflow-hidden shadow-xl">
                                    <StepBar hotkeys={false} />
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
                        <p class="mb-2">
                            All of these are compiled to WebAssembly and run in
                            a worker, so nothing leaves the browser.
                        </p>
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
                            (<span class="font-mono">master </span>
                            {__GIT_SUBJECT__} - {__GIT_DATE__})
                        </span>
                    </footer>
                </div>
            </div>
        </main>
    );
}

/** Sticky rail, with the section the reader is in marked. */
function Contents({ scroller }: { scroller: RefObject<HTMLElement> }) {
    const [active, setActive] = useState(contents[0].id);

    useEffect(() => {
        const root = scroller.current;

        if (!root) {
            return;
        }

        const sections = contents
            .map(({ id }) => document.getElementById(id))
            .filter((el): el is HTMLElement => el !== null);

        const update = () => {
            const line = root.getBoundingClientRect().top + 140;
            let current = contents[0].id;

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
                On this page
            </p>
            <ul class="border-base-300 flex flex-col border-l">
                {contents.map(({ id, label }) => (
                    <li key={id} class="flex">
                        <a
                            href={`#${id}`}
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
