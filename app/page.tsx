import HomeView from "@/components/views/HomeView";

/** Reader reviews are live data, so the page revalidates every minute. */
export const revalidate = 60;

export default function HomePage() {
  return <HomeView />;
}