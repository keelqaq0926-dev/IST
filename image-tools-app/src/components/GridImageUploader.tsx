"use client";

import { useState, useRef, useCallback, useEffect } from "react";

type GridPosition = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

const GridImageUploader = () => {
    const [imageMap, setImageMap] = useState<Record<GridPosition, string | null>>({
        1: null,
        2: null,
        3: null,
        4: null,
        5: null,
        6: null,
        7: null,
        8: null,
        9: null,
    });
    const [isGenerating, setIsGenerating] = useState(false);
    const [hasPreview, setHasPreview] = useState(false);
    const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);

    const fileInputsRef = useRef<Record<GridPosition, HTMLInputElement | null>>({
        1: null,
        2: null,
        3: null,
        4: null,
        5: null,
        6: null,
        7: null,
        8: null,
        9: null,
    });
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // 确保 canvas 存在
    useEffect(() => {
        if (!canvasRef.current) {
            canvasRef.current = document.createElement("canvas");
        }
    }, []);

    const getImageCount = useCallback(() => {
        return Object.values(imageMap).filter(Boolean).length;
    }, [imageMap]);

    const handleFileChange = (pos: GridPosition, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !file.type.startsWith("image/")) {
            alert("请选择图片格式文件（JPG、PNG等）");
            return;
        }
        const reader = new FileReader();
        reader.onload = (evt) => {
            const base64 = evt.target?.result as string;
            if (base64) {
                setImageMap((prev) => ({ ...prev, [pos]: base64 }));
                // 清除旧预览（因为内容变了）
                setHasPreview(false);
                setGeneratedImageUrl(null);
            } else {
                alert("图片读取失败");
            }
        };
        reader.onerror = () => {
            alert("图片读取失败");
        };
        reader.readAsDataURL(file);
    };

    const removeImage = (pos: GridPosition) => {
        setImageMap((prev) => ({ ...prev, [pos]: null }));
        if (fileInputsRef.current[pos]) {
            fileInputsRef.current[pos]!.value = "";
        }
        setHasPreview(false);
        setGeneratedImageUrl(null);
    };

    const generateGridImage = async () => {
        const count = getImageCount();
        if (count === 0) {
            alert("请至少上传一张图片");
            return;
        }

        setIsGenerating(true);
        try {
            const colCount = 3;
            const cellSize = 300;
            const gap = 10;
            const rowCount = Math.ceil(count / colCount);

            const canvas = canvasRef.current!;
            canvas.width = colCount * cellSize + (colCount - 1) * gap;
            canvas.height = rowCount * cellSize + (rowCount - 1) * gap;

            const ctx = canvas.getContext("2d");
            if (!ctx) throw new Error("无法获取 Canvas 上下文");

            // 填充白色背景
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const promises: Promise<void>[] = [];

            for (let row = 0; row < rowCount; row++) {
                for (let col = 0; col < colCount; col++) {
                    const pos = (row * colCount + col + 1) as GridPosition;
                    const imgUrl = imageMap[pos];
                    const x = col * (cellSize + gap);
                    const y = row * (cellSize + gap);

                    if (imgUrl) {
                        const p = new Promise<void>((resolve, reject) => {
                            const img = new Image();
                            img.crossOrigin = "anonymous";
                            img.onload = () => {
                                const ratio = Math.min(cellSize / img.width, cellSize / img.height);
                                const drawW = img.width * ratio;
                                const drawH = img.height * ratio;
                                const offsetX = x + (cellSize - drawW) / 2;
                                const offsetY = y + (cellSize - drawH) / 2;
                                ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
                                ctx.strokeStyle = "#ccc";
                                ctx.lineWidth = 1;
                                ctx.strokeRect(x + 5, y + 5, cellSize, cellSize);
                                resolve();
                            };
                            img.onerror = () => reject(new Error(`位置 ${pos} 图片加载失败`));
                            img.src = imgUrl;
                        });
                        promises.push(p);
                    } else {
                        // 绘制空格子边框
                        ctx.strokeStyle = "#ccc";
                        ctx.lineWidth = 1;
                        ctx.strokeRect(x + 5, y + 5, cellSize, cellSize);
                    }
                }
            }

            await Promise.all(promises);

            const dataUrl = canvas.toDataURL("image/png");
            console.log("✅ 生成的图片 URL：", dataUrl);

            // ✅ 关键修复：只通过状态更新 UI，不操作 DOM
            setGeneratedImageUrl(dataUrl);
            setHasPreview(true); // 现在 hasPreview 一定为 true

        } catch (err) {
            console.error("❌ 生成图片失败：", err);
            alert(`生成失败：${(err as Error).message}`);
            setHasPreview(false);
            setGeneratedImageUrl(null);
        } finally {
            setIsGenerating(false);
        }
    };

    const downloadImage = () => {
        if (!generatedImageUrl) {
            alert("请先生成图片");
            return;
        }

        const link = document.createElement("a");
        link.href = generatedImageUrl;
        link.download = "九宫格图片.png";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="max-w-4xl mx-auto p-4">
            {/* 上传区域 */}
            <div className="mb-8">
                <h2 className="text-xl font-bold mb-4">上传图片（最多9张）</h2>
                <div
                    className="grid grid-cols-3 gap-4 border-2 border-dashed border-gray-300 p-4 rounded-lg bg-white"
                    style={{ gridTemplateRows: "repeat(3, 150px)" }}
                >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((pos) => {
                        const imageUrl = imageMap[pos as GridPosition];
                        return (
                            <div
                                key={pos}
                                className={`relative border border-gray-200 rounded-md overflow-hidden ${
                                    imageUrl ? "" : "bg-gray-50 flex items-center justify-center"
                                }`}
                            >
                                <input
                                    ref={(el) => (fileInputsRef.current[pos as GridPosition] = el)}
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleFileChange(pos as GridPosition, e)}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                />
                                {imageUrl ? (
                                    <>
                                        <img
                                            src={imageUrl}
                                            alt={`位置 ${pos}`}
                                            className="w-full h-full object-cover"
                                        />
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeImage(pos as GridPosition);
                                            }}
                                            className="absolute top-2 right-2 bg-red-500 text-white w-6 h-6 flex items-center justify-center text-xs rounded-full hover:bg-red-600 z-20"
                                        >
                                            ×
                                        </button>
                                        <span className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-1 rounded z-20">
                                            {pos}
                                        </span>
                                    </>
                                ) : (
                                    <div
                                        className="flex flex-col items-center justify-center p-2 cursor-pointer"
                                        onClick={() => {
                                            fileInputsRef.current[pos as GridPosition]?.click();
                                        }}
                                    >
                                        <svg
                                            className="w-8 h-8 mx-auto mb-1 text-gray-400"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                            />
                                        </svg>
                                        <div className="text-sm text-gray-500 text-center">
                                            点击上传<br />
                                            位置 {pos}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-4 mb-8">
                <button
                    onClick={generateGridImage}
                    disabled={isGenerating || getImageCount() === 0}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                >
                    {isGenerating ? "生成中..." : "生成九宫格"}
                </button>
                <button
                    onClick={downloadImage}
                    disabled={!hasPreview}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                >
                    下载图片
                </button>
            </div>

            {/* 预览区域 —— ✅ src 来自 state，不再写死为空 */}
            {hasPreview && generatedImageUrl && (
                <div className="mt-8">
                    <h2 className="text-xl font-bold mb-4">生成预览</h2>
                    <div className="border border-gray-200 rounded-lg p-4 bg-white">
                        <img
                            src={generatedImageUrl}
                            alt="九宫格预览"
                            className="max-w-full h-auto"
                        />
                    </div>
                </div>
            )}

            {/* 隐藏的 canvas */}
            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
};

export default GridImageUploader;