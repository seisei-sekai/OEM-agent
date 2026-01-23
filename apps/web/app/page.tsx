export default function Home() {
  return (
    <main className="min-h-screen p-24">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-6xl font-bold text-center mb-6">
          Welcome to OEM Agent
        </h1>
        <p className="text-xl text-center text-gray-600 mb-12">
          AI-powered assistant to turn your ideas into real, physical products
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 bg-white rounded-lg shadow-md">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="text-xl font-semibold mb-2">Create Branded Merch</h3>
            <p className="text-gray-600">
              Upload your logo and instantly see it on products
            </p>
          </div>
          
          <div className="p-6 bg-white rounded-lg shadow-md">
            <div className="text-4xl mb-4">✨</div>
            <h3 className="text-xl font-semibold mb-2">Custom Products</h3>
            <p className="text-gray-600">
              Design fully custom manufactured products
            </p>
          </div>
          
          <div className="p-6 bg-white rounded-lg shadow-md">
            <div className="text-4xl mb-4">🤖</div>
            <h3 className="text-xl font-semibold mb-2">AI Assistant</h3>
            <p className="text-gray-600">
              Get help from our AI agent every step of the way
            </p>
          </div>
        </div>
        
        <div className="mt-16 text-center">
          <p className="text-gray-600">
            👉 Click the AI assistant button in the bottom-right to get started
          </p>
        </div>
      </div>
    </main>
  )
}


