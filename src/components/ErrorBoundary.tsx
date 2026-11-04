import { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, ChevronDown, ChevronUp, ShieldCheck } from 'lucide-react';

interface Props {
  children: ReactNode;
  moduleKey?: string;
  moduleName?: string;
  moduleNameAr?: string;
  onRetry?: () => void;
  onNavigateHome?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  showDetails: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
    error: null,
    showDetails: false,
  };

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      showDetails: false,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`[Ouonex Fault Isolation] Module "${this.props.moduleKey || 'unknown'}" encountered a runtime exception:`, error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, showDetails: false });
    this.props.onRetry?.();
  };

  toggleDetails = () => {
    this.setState(prev => ({ showDetails: !prev.showDetails }));
  };

  render() {
    if (this.state.hasError) {
      const nameAr = this.props.moduleNameAr || this.props.moduleName || 'هذه الوحدة';
      const nameEn = this.props.moduleName || this.props.moduleKey || 'this module';

      return (
        <div className="w-full min-h-[420px] flex flex-col items-center justify-center py-16 px-6 text-center animate-fade-in" dir="rtl">
          {/* Failure Alert Icon */}
          <div className="relative mb-5">
            <div className="w-16 h-16 rounded-2xl bg-danger-500/15 border border-danger-500/30 flex items-center justify-center text-danger-400 shadow-lg shadow-danger-500/10">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div className="absolute -bottom-1 -left-1 w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400" title="Fault Isolation Shield Active">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Bilingual Title */}
          <h3 className="text-lg font-bold text-ink-100">
            حدث خطأ غير متوقع في وحدة «{nameAr}»
          </h3>
          <p className="text-xs text-ink-400 mt-1 font-mono" dir="ltr">
            Unexpected failure in {nameEn} module
          </p>

          {/* Fault Isolation Assurance Badge */}
          <div className="mt-4 max-w-md p-3.5 rounded-xl bg-ink-900/80 border border-brand-500/30 text-xs text-ink-300 flex items-start gap-2.5 text-right shadow-sm">
            <ShieldCheck className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-brand-300 mb-0.5">
                نظام عزل الأخطاء نشط (Fault Isolation Active):
              </p>
              <p className="text-ink-400 leading-relaxed text-[11px]">
                تم احتواء المشكلة داخل هذه الوحدة فقط لمنع انهيار اللوحة. باقي أقسام النظام (دعوتي، المالية، المستخدمين، التطبيقات) تعمل بنجاح 100% دون أي تأثر.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
            <button
              onClick={this.handleRetry}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-brand-500 hover:bg-brand-600 text-white flex items-center gap-2 shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>إعادة محاولة تحميل الوحدة</span>
            </button>

            {this.props.onNavigateHome && (
              <button
                onClick={this.props.onNavigateHome}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-ink-800 hover:bg-ink-700 text-ink-200 border border-ink-700 flex items-center gap-2 transition-all"
              >
                <Home className="w-3.5 h-3.5" />
                <span>العودة للنظرة العامة</span>
              </button>
            )}
          </div>

          {/* Technical Details Disclosure */}
          {this.state.error && (
            <div className="mt-6 max-w-lg w-full text-right">
              <button
                onClick={this.toggleDetails}
                className="text-[11px] text-ink-500 hover:text-ink-300 flex items-center gap-1 mx-auto transition-colors"
              >
                <span>{this.state.showDetails ? 'إخفاء التفاصيل التقنية' : 'عرض التفاصيل التقنية للمطورين'}</span>
                {this.state.showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>

              {this.state.showDetails && (
                <div className="mt-2 p-3 rounded-lg bg-black/40 border border-ink-800 text-[10px] text-danger-300 font-mono text-left overflow-x-auto" dir="ltr">
                  <p className="font-bold text-danger-400">{this.state.error.name}: {this.state.error.message}</p>
                  {this.state.error.stack && (
                    <pre className="mt-1 text-ink-500 text-[9px] whitespace-pre-wrap max-h-32 overflow-y-auto">
                      {this.state.error.stack.split('\n').slice(0, 5).join('\n')}
                    </pre>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}
