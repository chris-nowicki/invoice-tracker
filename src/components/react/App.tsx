import { ConvexProvider, ConvexReactClient } from "convex/react";
import type { ReactNode } from "react";
import InvoiceDashboard from "./InvoiceDashboard";

const convex = new ConvexReactClient(import.meta.env.PUBLIC_CONVEX_URL);

export default function App(): ReactNode {
  return (
    <ConvexProvider client={convex}>
      <InvoiceDashboard />
    </ConvexProvider>
  );
}
