export default function Screenshots() {
  return (
    <section className="py-24">
      <div className="max-w-5xl mx-auto text-center">
        <h2 className="text-3xl font-bold">See It in Action</h2>
        <p className="mt-2 text-muted-foreground">
          A quick look at how Knwdle simplifies your daily tasks.
        </p>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          <img
            src="/screenshot-dashboard.png"
            alt="Dashboard"
            className="rounded-lg border"
          />
          <img
            src="/screenshot-attendance.png"
            alt="Attendance"
            className="rounded-lg border"
          />
        </div>
      </div>
    </section>
  );
}
