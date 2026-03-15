import { GlassLoadingScreen } from "@/components/ui/GlassLoadingScreen";

export default function AdminLoading() {
  return (
    <GlassLoadingScreen
      title="Loading Admin Workspace"
      description="Fetching dashboard data, analytics, and management tools for the next admin screen."
      variant="admin"
    />
  );
}
