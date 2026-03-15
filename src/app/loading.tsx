import { GlassLoadingScreen } from "@/components/ui/GlassLoadingScreen";

export default function AppLoading() {
  return (
    <GlassLoadingScreen
      title="Loading Experience"
      description="Please wait while Mezgebe loads the next screen and fetches the latest event data."
    />
  );
}
