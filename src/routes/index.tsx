import { createFileRoute } from "@tanstack/react-router";
import { ClipperApp } from "@/components/clipper/ClipperApp";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Clipper — Barber Finance, sharpened" },
      { name: "description", content: "Track income, expenses, mileage and Schedule C taxes. Built for self-employed barbers." },
      { property: "og:title", content: "Clipper — Barber Finance" },
      { property: "og:description", content: "The only books a self-employed barber actually needs." },
    ],
  }),
  component: IndexPage,
});

function IndexPage() {
  return <ClipperApp />;
}
