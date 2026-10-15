import { useLocation } from "preact-iso";
import { FileInput } from "./Input/FileInput";

export function EmptyState() {
    const location = useLocation();
    return (
        <div class="bg-base-200 flex min-h-0 flex-1 flex-col overflow-hidden">
            <div class="hero min-h-0 flex-1 overflow-y-auto p-6">
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
