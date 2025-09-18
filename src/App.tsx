function App() {
  return (
    <div className="container py-4" style={{
      scrollbarWidth: 'thin',
      scrollbarColor: '#4CAF50 #f1f1f1'
    }}>
      <h1 className="text-2xl font-semibold text-primary-700 mb-4">React + Vite + TypeScript</h1>
      <p className="text-secondary-700">Giao diện đang tái sử dụng lại màu sắc và style từ dự án cũ.</p>
      <div className="mt-8 selectable p-4">
        <p className="mb-4">Hãy bắt đầu chuyển từng component/trang từ Vue sang React (TSX). CSS/SCSS và Tailwind đã sẵn sàng.</p>
        <a className="btn-primary px-4 py-2 inline-block" href="#">Ví dụ nút theo style cũ</a>
      </div>
    </div>
  )
}

export default App
