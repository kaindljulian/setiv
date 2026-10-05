import { FileInput } from "@/components/Input/FileInput";
import { RunStatus } from "@/components/RunStatus";
import { useDismiss } from "@/hooks/useDismiss";
import { cn } from "@/lib/cn";
import { varNames } from "@/lib/naming";
import { useSource } from "@/state/context";
import { FolderOpen } from "lucide-preact";
import { useLocation } from "preact-iso";
import { useRef, useState } from "preact/hooks";
import { SettingsMenu } from "./SettingsMenu";
import { ThemeToggle } from "./ThemeToggle";

const pages = [
    { href: "/main", label: "Main", needsRun: true },
    { href: "/chart", label: "Chart", needsRun: true },
    { href: "/help", label: "Help", needsRun: false },
] as const;

export function Navbar() {
    const source = useSource();
    const location = useLocation();

    return (
        <header class="navbar border-base-300 bg-base-100 min-h-0 shrink-0 gap-2 border-b px-3 py-1.5">
            <div class="flex min-w-0 flex-1 items-center gap-2">
                <h1
                    class="z-10 flex shrink-0 cursor-pointer items-center gap-2 text-lg font-semibold"
                    onClick={() => location.route("/")}
                >
                    <img
                        src="/icon.svg"
                        alt=""
                        width="24"
                        height="24"
                        class="shrink-0 rounded-md"
                    />
                    <span class="font-brand font-bold tracking-tight">
                        setiv
                    </span>
                </h1>

                <PageNav />

                <span class="text-base-content/50 absolute hidden w-full truncate text-center text-xs lg:inline">
                    <span>{source.fileName}</span>
                </span>
            </div>

            <div class="z-10 flex shrink-0 items-center gap-1">
                <RunStatus />
                <LogMenu />
                {varNames.value && <SettingsMenu />}
                <ThemeToggle />
            </div>
        </header>
    );
}

function PageNav() {
    const { path } = useLocation();
    const source = useSource();

    return (
        <nav class="z-10 flex shrink-0 items-center gap-1">
            {pages
                .filter((p) => source.run.value || !p.needsRun)
                .map(({ href, label }) => (
                    <a
                        key={href}
                        href={href}
                        aria-current={path === href ? "page" : undefined}
                        class={cn("btn btn-xs", path === href && "btn-active")}
                    >
                        {label}
                    </a>
                ))}
        </nav>
    );
}

function LogMenu() {
    const ref = useRef<HTMLDetailsElement>(null);
    const [open, setOpen] = useState(false);
    const location = useLocation();

    useDismiss(ref, open, () => setOpen(false));

    return (
        <details ref={ref} open={open} class="dropdown dropdown-end">
            <summary
                onClick={(e) => {
                    e.preventDefault();
                    setOpen(!open);
                }}
                class="btn btn-ghost btn-sm gap-2"
            >
                <FolderOpen size={15} />
                Open
            </summary>
            <div class="dropdown-content rounded-box border-base-300 bg-base-100 z-20 mt-1 w-xl border p-4 shadow-lg">
                <FileInput
                    onSettled={() => {
                        setOpen(false);
                        location.route("/main");
                    }}
                />
            </div>
        </details>
    );
}
