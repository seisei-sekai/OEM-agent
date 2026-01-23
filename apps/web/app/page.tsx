export default function Home() {
  return (
    <main className="min-h-screen relative bg-gray-50">
      {/* Agent 提示 - 右下角 - 日系简约风格 */}
      <div
        className="fixed bottom-32 right-8 flex flex-col items-end gap-3 z-40 pointer-events-none"
        style={{
          animation: 'fadeIn 1s ease-out',
        }}
      >
        {/* Agent 文字 */}
        <div className="text-gray-800 font-light text-sm tracking-wider opacity-70">
          OEM AGENT
        </div>

        {/* 细箭头 */}
        <svg
          className="w-8 h-8 text-gray-700 opacity-60"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 5v14M19 12l-7 7-7-7" />
        </svg>
      </div>
    </main>
  )
}


