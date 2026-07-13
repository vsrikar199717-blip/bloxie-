import { Component, type ErrorInfo, type ReactNode } from 'react';
import './errorBoundary.css';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
  componentStack: string | null;
  copied: boolean;
}

/**
 * Catches render-time crashes anywhere below it and shows a recovery screen
 * instead of React's default: a blank white page with nothing but a console
 * message the family will never see.
 *
 * "Try again" re-mounts the tree, which recovers from transient faults. If the
 * fault is deterministic it will throw straight back, so "Start over" does a
 * full reload to the first screen — profiles live in localStorage, so nothing
 * a family has set up is lost by reloading.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null, componentStack: null, copied: false };

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.setState({ componentStack: info.componentStack ?? null });
    console.error('Unhandled error:', error, info.componentStack);
  }

  private handleTryAgain = () => {
    this.setState({ error: null, componentStack: null, copied: false });
  };

  private handleStartOver = () => {
    window.location.assign(import.meta.env.BASE_URL);
  };

  /** The whole report, so a tester can paste one blob into a message. */
  private buildReport(): string {
    const { error, componentStack } = this.state;
    return [
      `Error: ${error?.message ?? 'Unknown'}`,
      `Page: ${window.location.pathname}`,
      `Browser: ${navigator.userAgent}`,
      '',
      error?.stack ?? '(no stack)',
      componentStack ? `\nComponent stack:${componentStack}` : '',
    ].join('\n');
  }

  private handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(this.buildReport());
      this.setState({ copied: true });
    } catch {
      // Clipboard can be blocked (insecure origin, permissions). The report is
      // on screen and selectable, so the tester can still copy it by hand.
      this.setState({ copied: false });
    }
  };

  render() {
    const { error, copied } = this.state;

    if (!error) return this.props.children;

    return (
      <div className="error-screen">
        <div className="error-panel">
          <div className="error-face" aria-hidden="true">
            🤖💤
          </div>

          <h1 className="font-display">Bloxie needs a moment</h1>
          <p className="subtext">
            Something went wrong on our side, not yours. Nothing your child has
            done has been lost — their profile and progress are safe.
          </p>

          <div className="error-actions">
            <button className="error-btn-primary" onClick={this.handleTryAgain}>
              Try again
            </button>
            <button className="error-btn-secondary" onClick={this.handleStartOver}>
              Back to the start
            </button>
          </div>

          <details className="error-report">
            <summary>Something to report? Show the details</summary>
            <pre className="error-details">{this.buildReport()}</pre>
            <button className="error-copy" onClick={this.handleCopy}>
              {copied ? 'Copied — paste this to us' : 'Copy report'}
            </button>
          </details>
        </div>
      </div>
    );
  }
}
