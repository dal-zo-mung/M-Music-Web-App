import { useRouteError } from "react-router-dom";
import { ErrorScreen } from "./ErrorScreen";

export function RouteErrorBoundary({
  standalone = false,
}: {
  standalone?: boolean;
}): React.JSX.Element {
  return <ErrorScreen error={useRouteError()} standalone={standalone} />;
}
