import GridImageGenerator from "@/components/GridImageUploader";

export default function GridImagePage() {
  return (
      <div className="min-h-screen bg-gray-50 py-8">
        <header className="max-w-4xl mx-auto px-4 mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-800">九宫格图片生成工具</h1>
          <p className="mt-2 text-gray-600">
            上传图片按1-9序号排列，自动生成3×3九宫格图片
          </p>
        </header>

        <main>
          <GridImageGenerator />
        </main>
      </div>
  );
}