/**
 * 单组件错误边界
 *
 * 一个组件的 `render` 抛错**不能**带走卡片层、托盘或别的组件 —— 这是规范里的硬要求
 * （token-meter 那版浮窗就是「一个组件抛错 → 整层白」）。React 18 只能靠 class 组件捕获，
 * 所以这里是全插件唯一的 class 组件。
 *
 * @module @dshp/widget-kit/client/ErrorBoundary
 */
import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { Button } from '@deepseek-ai/dsh-client-ui-primitives';
import styles from './styles.module.css';

interface Props {
  /** 出错时显示的名字（组件 id 或标题）。 */
  label: string;
  children: ReactNode;
  /** 重新渲染内部内容（父级换 key / 重取数据）。 */
  onRetry?: (() => void) | undefined;
  onError?: ((message: string, error: unknown) => void) | undefined;
}

interface State {
  message: string | null;
}

export class WidgetErrorBoundary extends Component<Props, State> {
  override state: State = { message: null };

  static getDerivedStateFromError(error: unknown): State {
    return { message: String((error as Error)?.message ?? error) };
  }

  override componentDidCatch(error: unknown, info: ErrorInfo): void {
    this.props.onError?.(`组件「${this.props.label}」渲染失败（已隔离，其余组件不受影响）`, error);
    void info;
  }

  override render(): ReactNode {
    if (this.state.message === null) return this.props.children;
    return (
      <div className={styles.notice + ' ' + styles.noticeBad} role="alert">
        <div>
          组件「{this.props.label}」渲染失败：{this.state.message}
        </div>
        <div className={styles.footer} style={{ marginTop: 8 }}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              this.setState({ message: null });
              this.props.onRetry?.();
            }}
          >
            重试
          </Button>
        </div>
      </div>
    );
  }
}
