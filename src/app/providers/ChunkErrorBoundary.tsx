import { Component, type ReactNode } from 'react';
import { AppUpdateScreen } from '../../shared/components/AppUpdateScreen';
import { isChunkLoadError, hasReloadBeenAttempted, performRecoveryReload } from '../../shared/utils/chunkErrors';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  isChunkError: boolean;
  alreadyRetried: boolean;
}

export class ChunkErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      isChunkError: false,
      alreadyRetried: hasReloadBeenAttempted(),
    };
  }

  static getDerivedStateFromError(error: unknown): Partial<State> {
    return {
      hasError: true,
      isChunkError: isChunkLoadError(error),
      alreadyRetried: hasReloadBeenAttempted(),
    };
  }

  componentDidUpdate(_prevProps: Props, prevState: State) {
    const justErrored = this.state.hasError && !prevState.hasError;
    if (justErrored && this.state.isChunkError && !this.state.alreadyRetried) {
      performRecoveryReload();
    }
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    // Chunk error: show recovery screen.
    // Non-chunk error: same screen — at root level these are catastrophic either way.
    return (
      <AppUpdateScreen
        alreadyRetried={this.state.alreadyRetried || !this.state.isChunkError}
      />
    );
  }
}
