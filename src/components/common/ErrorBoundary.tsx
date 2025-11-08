import React from 'react'

type Props = { children: React.ReactNode }
type State = { hasError: boolean; error?: any }

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error }
  }
  componentDidCatch(error: any) {

  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24, background: '#fff' }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#EF4444' }}>Đã xảy ra lỗi không mong muốn</h3>
          <p style={{ fontSize: 13, color: '#6B7280' }}>Vui lòng tải lại trang hoặc thử lại thao tác.</p>
        </div>
      )
    }
    return this.props.children
  }
}


