import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

type GlassLoadingScreenProps = {
  title?: string;
  description?: string;
  variant?: "default" | "admin";
};

export function GlassLoadingScreen({
  title = "Loading",
  description = "Preparing the next view and fetching the latest data.",
  variant = "default",
}: GlassLoadingScreenProps) {
  const cardCount = variant === "admin" ? 4 : 3;

  return (
    <div className="glass-loading-overlay fixed inset-0 z-100 flex min-h-screen items-center justify-center p-4 md:p-8">
      <div className="glass-loading-shell w-full max-w-6xl overflow-hidden rounded-4xl border border-border/70 bg-card/55 shadow-[0_30px_90px_rgba(0,0,0,0.14)] backdrop-blur-2xl">
        <div className="grid gap-0 lg:grid-cols-[0.92fr_1.08fr]">
          <section className="glass-loading-hero relative overflow-hidden border-b border-border/60 p-8 lg:border-b-0 lg:border-r">
            <div className="glass-loading-orb glass-loading-orb-primary absolute -left-8 top-6 h-28 w-28 rounded-full" />
            <div className="glass-loading-orb glass-loading-orb-accent absolute right-6 top-20 h-20 w-20 rounded-full" />
            <div className="relative z-10 max-w-lg space-y-5">
              <div className="inline-flex items-center gap-3 rounded-full border border-border/70 bg-background/40 px-4 py-2 text-sm font-medium text-foreground/90">
                <LoadingSpinner size="md" />
                Fetching Data
              </div>
              <div className="space-y-3">
                <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                  {title}
                </h2>
                <p className="max-w-md text-sm leading-7 text-muted-foreground md:text-base">
                  {description}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-3">
                <div className="glass-loading-line h-20 rounded-2xl" />
                <div className="glass-loading-line h-20 rounded-2xl" />
              </div>
            </div>
          </section>

          <section className="p-6 md:p-8">
            <div className="grid gap-4 md:grid-cols-2">
              {Array.from({ length: cardCount }).map((_, index) => (
                <div
                  key={index}
                  className="glass-loading-card rounded-3xl border border-border/70 bg-background/45 p-4"
                >
                  <div className="glass-loading-line h-36 rounded-[1.1rem]" />
                  <div className="mt-4 space-y-3">
                    <div className="glass-loading-line h-5 w-2/3 rounded-full" />
                    <div className="glass-loading-line h-4 w-1/2 rounded-full" />
                    <div className="glass-loading-line h-4 w-5/6 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
