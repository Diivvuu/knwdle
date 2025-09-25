
const testimonials = [
  {
    name: "Riya Sharma",
    role: "School Admin",
    quote:
      "Knwdle has cut our fee default rate in half and saved hours of manual work.",
  },
  {
    name: "Amit Patel",
    role: "Coaching Center Owner",
    quote:
      "The AI insights are game-changing — I know exactly where students struggle.",
  },
];

export default function Testimonials() {
  return (
    <section className="py-24 bg-muted">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl font-bold">What Our Users Say</h2>
        <div className="mt-12 grid gap-8 md:grid-cols-2">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className="rounded-lg bg-card p-6 shadow-sm border text-left"
            >
              <p className="italic">“{t.quote}”</p>
              <div className="mt-4 font-semibold">
                {t.name}, <span className="text-sm text-muted-foreground">{t.role}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
