import {
  Hero,
  HowItWorks,
  Navbar,
  Problem,
  Systems,
  Developer,
  Cta,
} from "@/components/landing";

export default function Home() {
  return (
    <div className="relative">
      <Navbar />

      {/* MAIN CONTENT */}
      <div className="relative z-20 bg-white">
        <main>
          <Hero />
          <Problem />
          <HowItWorks />
          <Systems />
          <Developer />
        </main>
      </div>

      {/* CTA LIVES UNDER THE MAIN CONTENT */}
      <div className="relative z-10 -mt-[100vh]">
        <div className="sticky bottom-0">
          <Cta />
        </div>
      </div>
    </div>
  );
}