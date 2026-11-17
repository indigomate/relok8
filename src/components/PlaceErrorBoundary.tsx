import { Component, type ReactNode } from 'react';
export class PlaceErrorBoundary extends Component<{ children: ReactNode; pl: boolean }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (!this.state.failed) return this.props.children;
    return <section role="alert" className="rounded-xl border border-rose-200 bg-white p-6 space-y-3">
      <h2>{this.props.pl ? 'Nie udało się wczytać Twoich lokali' : 'Could not load your places'}</h2>
      <p className="text-sm text-slate-600">{this.props.pl ? 'Odśwież stronę, aby ponownie połączyć się i spróbować jeszcze raz.' : 'Refresh the page to reconnect and try again.'}</p>
      <button type="button" className="min-h-11 px-4 rounded-lg border font-semibold" onClick={() => window.location.reload()}>{this.props.pl ? 'Odśwież stronę' : 'Refresh page'}</button>
    </section>;
  }
}
