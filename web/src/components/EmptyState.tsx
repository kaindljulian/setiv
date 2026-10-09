import { useLocation } from "preact-iso";
import { FileInput } from "./Input/FileInput";

export function EmptyState() {
    const location = useLocation();
    return (
        <div class="bg-base-200 relative flex min-h-0 flex-1 flex-col overflow-hidden">
            <div
                aria-hidden="true"
                class="pointer-events-none absolute inset-0"
            >
                <div class="bg-secondary/25 absolute -top-24 left-[12%] size-96 rounded-full blur-3xl" />
                <div class="bg-primary/20 absolute top-1/3 right-[8%] size-112 rounded-full blur-3xl" />
                <div class="bg-accent/20 absolute -bottom-24 left-1/3 size-80 rounded-full blur-3xl" />
            </div>

            <div class="hero relative min-h-0 flex-1 overflow-y-auto p-6">
                <div class="hero-content w-full max-w-xl flex-col items-stretch">
                    <div class="-mt-24 flex flex-col items-center gap-2">
                        <p class="text-primary text-sm font-bold">
                            SAT Event Tracer and Interactive Viewer
                        </p>
                    </div>

                    <div class="card card-border border-base-300 bg-base-100 shadow-primary/10 w-full shadow-lg">
                        <div class="card-body p-4">
                            <FileInput
                                onSettled={() => location.route("/chart")}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
