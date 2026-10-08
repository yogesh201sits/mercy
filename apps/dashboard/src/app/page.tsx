import {
  Hero,
  HowItWorks,
  Navbar,
  Problem,
  Systems,
  Developer,
  Cta,
  UndoDemo
} from "@/components/landing";

export default function Home() {
  return (
    <>
      <Navbar />

      <main>
        <Hero />
        <Problem />
        <HowItWorks />
        <Systems />
        <Developer/>
        <Cta/>
      </main>
    </>
  );
}