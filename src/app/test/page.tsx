// app/page.tsx
import { TestButton } from "@/components/pages/Check-Page";

export default function Home() {
  return (
    <main className="p-4">
      <h1 className="text-2xl font-bold mb-4">Database Test</h1>
      <TestButton />
    </main>
  );
}
