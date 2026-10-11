import { Component, type ErrorInfo, type ReactNode } from "react";
import { ErrorScreen } from "./ErrorScreen";

export class AppErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("M-Music application error", error, info.componentStack);
  }

  render() {
    return this.state.error ? (
      <ErrorScreen error={this.state.error} standalone />
    ) : (
      this.props.children
    );
  }
}
