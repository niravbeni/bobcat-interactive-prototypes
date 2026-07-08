import { DashboardList } from "@/components/dashboard/DashboardList";

export default function Dashboard() {
  return (
    <main className="min-h-screen bg-ghost-white">
      <section className="mx-auto w-full max-w-[1100px] px-9 pb-20 pt-14 2xl:max-w-[1400px] 3xl:max-w-[1760px] 3xl:px-14">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet">
          Bobcat Prototype
        </p>
        <h1 className="mt-3 text-[40px] font-semibold leading-[1.1] tracking-[-0.02em] text-deep-black">
          Interactive Prototypes
        </h1>
        <p className="mt-4 max-w-[640px] text-lg leading-[1.5] text-gray-text">
          Choose an interaction variation to preview. Each one runs the full flow end to end.
        </p>

        <DashboardList />
      </section>
    </main>
  );
}
