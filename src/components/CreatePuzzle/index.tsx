import { useState, useCallback, useRef, useEffect } from "react";
import { Heart, Palette, Sparkles, Image as ImageIcon, Eye, Type, FileImage, Copy, Check, Share2 } from "lucide-react";
import { Difficulty, PuzzleConfig, PuzzleData } from "@/types";
import {
  generatePuzzle,
  PRESET_COLORS,
  getRandomColor,
  DIFFICULTY_OPTIONS,
  CANVAS_CONFIG,
  PRESET_TEXT_COLORS,
  getRandomTextColor,
} from "@/utils/puzzle";
import { compressImage, generateQRCode, generateShareURL } from "@/utils/qrcode";
import { savePuzzle } from "@/utils/storage";
import { useToast } from "@/components/Toast";
import styles from "./index.module.scss";
import ImageCropper from "./ImageCropper";

interface CreatePuzzleProps {
  onGenerate?: (puzzleData: PuzzleData, thumbnail: string) => void;
  onStartPuzzle?: (puzzleData: PuzzleData) => void;
}

const MAX_TEXT_LENGTH = 100;

type CreateMode = "text" | "image";

export default function CreatePuzzle({ onGenerate, onStartPuzzle }: CreatePuzzleProps) {
  const { showToast } = useToast();
  const [mode, setMode] = useState<CreateMode>("text");
  const [text, setText] = useState("");
  const [imagePuzzleName, setImagePuzzleName] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>(9);
  const [backgroundColor, setBackgroundColor] = useState(PRESET_COLORS[0]);
  const [textColor, setTextColor] = useState("#2a2a2a");
  const [backgroundImage, setBackgroundImage] = useState<string>("");
  const [uploadedImage, setUploadedImage] = useState<string>("");
  const [originalImage, setOriginalImage] = useState<string>("");
  const [tempImage, setTempImage] = useState<string>("");
  const [cropState, setCropState] = useState<{
    scale: number;
    position: { x: number; y: number };
    cropArea: { x: number; y: number; size: number };
  } | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [previewImage, setPreviewImage] = useState<string>("");
  const [puzzleData, setPuzzleData] = useState<PuzzleData | null>(null);
  const [qrCode, setQrCode] = useState<string>("");
  const [shareUrl, setShareUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (mode === "text") {
      const config: PuzzleConfig = {
        text: text.trim() || "预览效果",
        difficulty,
        backgroundColor,
        textColor,
        backgroundImage: backgroundImage || undefined,
      };

      if (backgroundImage) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          const preview = generatePreviewWithImage(config, img);
          setPreviewImage(preview);
        };
        img.src = backgroundImage;
      } else {
        const preview = generatePreview(config);
        setPreviewImage(preview);
      }
    } else {
      if (uploadedImage) {
        generateImagePreview(uploadedImage, difficulty).then(setPreviewImage);
      } else {
        const preview = generateImageModePreview(difficulty);
        setPreviewImage(preview);
      }
    }
  }, [mode, text, difficulty, backgroundColor, textColor, backgroundImage, uploadedImage]);

  const generateImageModePreview = (difficulty: Difficulty): string => {
    const canvas = document.createElement("canvas");
    canvas.width = CANVAS_CONFIG.SIZE;
    canvas.height = CANVAS_CONFIG.SIZE;
    const ctx = canvas.getContext("2d")!;

    ctx.fillStyle = "#f0f0f0";
    ctx.fillRect(0, 0, CANVAS_CONFIG.SIZE, CANVAS_CONFIG.SIZE);

    ctx.strokeStyle = "#d0d0d0";
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 10]);
    const gridSize = Math.sqrt(difficulty);
    const cellSize = CANVAS_CONFIG.SIZE / gridSize;

    for (let i = 0; i <= gridSize; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cellSize, 0);
      ctx.lineTo(i * cellSize, CANVAS_CONFIG.SIZE);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * cellSize);
      ctx.lineTo(CANVAS_CONFIG.SIZE, i * cellSize);
      ctx.stroke();
    }

    ctx.fillStyle = "#999";
    ctx.font = "bold 20px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.setLineDash([]);
    ctx.fillText("上传图片", CANVAS_CONFIG.SIZE / 2, CANVAS_CONFIG.SIZE / 2 - 15);
    ctx.font = "16px sans-serif";
    ctx.fillText("预览效果", CANVAS_CONFIG.SIZE / 2, CANVAS_CONFIG.SIZE / 2 + 15);

    return canvas.toDataURL("image/png");
  };

  const generateImagePreview = (uploadedImageData: string, difficulty: Difficulty): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      canvas.width = CANVAS_CONFIG.SIZE;
      canvas.height = CANVAS_CONFIG.SIZE;
      const ctx = canvas.getContext("2d")!;

      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, CANVAS_CONFIG.SIZE, CANVAS_CONFIG.SIZE);
        const gridSize = Math.sqrt(difficulty);
        const pieceSize = CANVAS_CONFIG.SIZE / gridSize;

        ctx.strokeStyle = "rgba(0, 0, 0, 0.3)";
        ctx.lineWidth = 1.5;
        ctx.lineJoin = "round";

        for (let i = 1; i < gridSize; i++) {
          ctx.beginPath();
          ctx.moveTo(i * pieceSize, 0);
          ctx.lineTo(i * pieceSize, CANVAS_CONFIG.SIZE);
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(0, i * pieceSize);
          ctx.lineTo(CANVAS_CONFIG.SIZE, i * pieceSize);
          ctx.stroke();
        }
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = () => {
        ctx.fillStyle = "#f0f0f0";
        ctx.fillRect(0, 0, CANVAS_CONFIG.SIZE, CANVAS_CONFIG.SIZE);
        resolve(canvas.toDataURL("image/png"));
      };
      img.src = uploadedImageData;
    });
  };

  const generatePreview = (config: PuzzleConfig): string => {
    const canvas = document.createElement("canvas");
    canvas.width = CANVAS_CONFIG.SIZE;
    canvas.height = CANVAS_CONFIG.SIZE;
    const ctx = canvas.getContext("2d")!;

    ctx.fillStyle = config.backgroundColor;
    ctx.fillRect(0, 0, CANVAS_CONFIG.SIZE, CANVAS_CONFIG.SIZE);

    const padding = CANVAS_CONFIG.SIZE * 0.08;
    const availableWidth = CANVAS_CONFIG.SIZE - padding * 2;
    const availableHeight = CANVAS_CONFIG.SIZE - padding * 2;

    const result = calculateOptimalTextLayout(ctx, config.text || "预览效果", availableWidth, availableHeight);

    ctx.font = `bold ${result.fontSize}px 'Caveat', cursive`;
    ctx.fillStyle = config.textColor || "#2a2a2a";
    ctx.textBaseline = "middle";

    const totalTextHeight = result.lines.length * result.lineHeight;
    let startY = (CANVAS_CONFIG.SIZE - totalTextHeight) / 2 + result.lineHeight / 2;

    result.lines.forEach((line) => {
      ctx.textAlign = "center";
      ctx.fillText(line.text, CANVAS_CONFIG.SIZE / 2, startY);
      startY += result.lineHeight;
    });

    drawGridLines(ctx, config.difficulty);

    return canvas.toDataURL("image/png");
  };

  const calculateOptimalTextLayout = (
    ctx: CanvasRenderingContext2D,
    text: string,
    maxWidth: number,
    maxHeight: number,
  ): {
    fontSize: number;
    lineHeight: number;
    lines: Array<{ text: string; width: number; align: CanvasTextAlign }>;
  } => {
    let fontSize = 120;
    const minFontSize = 14;

    while (fontSize >= minFontSize) {
      ctx.font = `bold ${fontSize}px 'Caveat', cursive`;
      const lineHeight = fontSize * 1.2;

      const lines = wrapTextToLines(ctx, text, maxWidth);
      const totalHeight = lines.length * lineHeight;

      if (totalHeight <= maxHeight) {
        return {
          fontSize,
          lineHeight,
          lines,
        };
      }

      fontSize -= 2;
    }

    ctx.font = `bold ${minFontSize}px 'Caveat', cursive`;
    return {
      fontSize: minFontSize,
      lineHeight: minFontSize * 1.2,
      lines: wrapTextToLines(ctx, text, maxWidth),
    };
  };

  const wrapTextToLines = (
    ctx: CanvasRenderingContext2D,
    text: string,
    maxWidth: number,
  ): Array<{ text: string; width: number; align: CanvasTextAlign }> => {
    const lines: Array<{ text: string; width: number; align: CanvasTextAlign }> = [];
    const paragraphs = text.split("\n");

    paragraphs.forEach((paragraph) => {
      if (paragraph.trim() === "") {
        if (lines.length > 0) {
          lines[lines.length - 1].text += " ";
        }
        return;
      }

      const chars = paragraph.split("");
      let currentLine = "";
      let currentWidth = 0;

      chars.forEach((char) => {
        const charWidth = ctx.measureText(char).width;

        if (currentWidth + charWidth > maxWidth && currentLine !== "") {
          lines.push({
            text: currentLine,
            width: ctx.measureText(currentLine).width,
            align: "left",
          });
          currentLine = char;
          currentWidth = charWidth;
        } else {
          currentLine += char;
          currentWidth += charWidth;
        }
      });

      if (currentLine) {
        lines.push({
          text: currentLine,
          width: ctx.measureText(currentLine).width,
          align: "left",
        });
      }
    });

    return lines;
  };

  const drawGridLines = (ctx: CanvasRenderingContext2D, difficulty: number) => {
    const gridSize = Math.sqrt(difficulty);
    const pieceSize = CANVAS_CONFIG.SIZE / gridSize;

    ctx.strokeStyle = "rgba(0, 0, 0, 0.3)";
    ctx.lineWidth = 1.5;
    ctx.lineJoin = "round";

    for (let i = 1; i < gridSize; i++) {
      ctx.beginPath();
      ctx.moveTo(i * pieceSize, 0);
      ctx.lineTo(i * pieceSize, CANVAS_CONFIG.SIZE);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i * pieceSize);
      ctx.lineTo(CANVAS_CONFIG.SIZE, i * pieceSize);
      ctx.stroke();
    }
  };

  const generatePreviewWithImage = (config: PuzzleConfig, img: HTMLImageElement): string => {
    const canvas = document.createElement("canvas");
    canvas.width = CANVAS_CONFIG.SIZE;
    canvas.height = CANVAS_CONFIG.SIZE;
    const ctx = canvas.getContext("2d")!;

    ctx.fillStyle = config.backgroundColor;
    ctx.fillRect(0, 0, CANVAS_CONFIG.SIZE, CANVAS_CONFIG.SIZE);

    ctx.globalAlpha = 0.25;
    ctx.drawImage(img, 0, 0, CANVAS_CONFIG.SIZE, CANVAS_CONFIG.SIZE);
    ctx.globalAlpha = 1;

    const padding = CANVAS_CONFIG.SIZE * 0.08;
    const availableWidth = CANVAS_CONFIG.SIZE - padding * 2;
    const availableHeight = CANVAS_CONFIG.SIZE - padding * 2;

    const result = calculateOptimalTextLayout(ctx, config.text || "预览效果", availableWidth, availableHeight);

    ctx.font = `bold ${result.fontSize}px 'Caveat', cursive`;
    ctx.fillStyle = config.textColor || "#2a2a2a";
    ctx.textBaseline = "middle";

    const totalTextHeight = result.lines.length * result.lineHeight;
    let startY = (CANVAS_CONFIG.SIZE - totalTextHeight) / 2 + result.lineHeight / 2;

    result.lines.forEach((line) => {
      ctx.textAlign = "center";
      ctx.fillText(line.text, CANVAS_CONFIG.SIZE / 2, startY);
      startY += result.lineHeight;
    });

    drawGridLines(ctx, config.difficulty);

    return canvas.toDataURL("image/png");
  };

  const handleTextChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      if (value.length <= MAX_TEXT_LENGTH) {
        setText(value);
      }
    },
    [showToast],
  );

  const handleModeChange = useCallback(
    (newMode: CreateMode) => {
      setMode(newMode);
      if (newMode === "text") {
        setUploadedImage("");
        setOriginalImage("");
        setTempImage("");
        setCropState(null);
        setShowCropper(false);
        setImagePuzzleName("");
      } else {
        setText("");
        setBackgroundImage("");
        setBackgroundColor(PRESET_COLORS[0]);
        setTextColor("#2a2a2a");
      }
      setShowResult(false);
      setPuzzleData(null);
      setQrCode("");
      setShareUrl("");
      setPreviewImage("");
    },
    [],
  );

  const handleMainImageUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        if (file.size > 10 * 1024 * 1024) {
          showToast("图片大小不能超过10MB", "warning");
          return;
        }
        try {
          const reader = new FileReader();
          reader.onload = (event) => {
            const imageData = event.target?.result as string;
            setOriginalImage(imageData);
            setTempImage(imageData);
            setShowCropper(true);
          };
          reader.readAsDataURL(file);
        } catch {
          showToast("图片处理失败，请重试", "error");
        }
      }
    },
    [showToast],
  );

  const handleCropComplete = useCallback(
    (
      croppedImage: string,
      state: { scale: number; position: { x: number; y: number }; cropArea: { x: number; y: number; size: number } },
    ) => {
      setUploadedImage(croppedImage);
      setPreviewImage(croppedImage);
      setCropState(state);
      setShowCropper(false);
      setTempImage("");
    },
    [],
  );

  const handleCropCancel = useCallback(() => {
    setShowCropper(false);
    setTempImage("");
  }, []);

  const handleReCrop = useCallback(() => {
    if (originalImage) {
      setTempImage(originalImage);
      setShowCropper(true);
    }
  }, [originalImage]);

  const removeMainImage = useCallback(() => {
    setUploadedImage("");
    setPreviewImage("");
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  }, []);

  const handleBackgroundImageUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        if (file.size > 500 * 1024) {
          showToast("图片大小不能超过500KB", "warning");
          return;
        }
        try {
          const compressed = await compressImage(file, CANVAS_CONFIG.SIZE, CANVAS_CONFIG.SIZE, 0.5);
          setBackgroundImage(compressed);
        } catch {
          showToast("图片处理失败，请重试", "error");
        }
      }
    },
    [showToast],
  );

  const removeImage = useCallback(() => {
    setBackgroundImage("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast("复制失败，请手动复制", "error");
    }
  }, [shareUrl, showToast]);

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);

    try {
      const config: PuzzleConfig = {
        text: mode === "text" ? text.trim() : "",
        difficulty,
        backgroundColor: mode === "text" ? backgroundColor : "#ffffff",
        textColor,
        backgroundImage: mode === "text" ? backgroundImage || undefined : uploadedImage,
      };

      const newPuzzleData = generatePuzzle(config, true);

      if (mode === "text") {
        const qrCodeData = await generateQRCode(newPuzzleData.config);
        const url = generateShareURL(newPuzzleData.config);
        setQrCode(qrCodeData);
        setShareUrl(url);
      } else {
        setQrCode("");
        setShareUrl("");
      }

      setPuzzleData(newPuzzleData);

      const puzzleName = mode === "text" ? text.trim().substring(0, 20) : imagePuzzleName.trim().substring(0, 20);
      await savePuzzle(newPuzzleData.config, previewImage, puzzleName);

      setShowResult(true);
      if (onGenerate) {
        onGenerate(newPuzzleData, previewImage);
      }
    } catch (error) {
      console.error("Failed to generate puzzle:", error);
      showToast(error instanceof Error ? error.message : "生成失败，请重试", "error");
    } finally {
      setIsGenerating(false);
    }
  }, [mode, text, difficulty, backgroundColor, textColor, backgroundImage, uploadedImage, previewImage, imagePuzzleName, onGenerate, showToast]);

  const handleStartPuzzle = useCallback(() => {
    if (puzzleData && onStartPuzzle) {
      onStartPuzzle(puzzleData);
    }
  }, [puzzleData, onStartPuzzle]);

  const handleShare = useCallback(() => {
    const shareSection = document.querySelector(`.${styles.shareSection}`);
    if (shareSection) {
      shareSection.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, []);

  const handleReset = useCallback(() => {
    setText("");
    setDifficulty(9);
    setBackgroundColor(PRESET_COLORS[0]);
    setTextColor("#2a2a2a");
    setBackgroundImage("");
    setUploadedImage("");
    setShowResult(false);
    setPuzzleData(null);
    setPreviewImage("");
    setQrCode("");
    setShareUrl("");
    setCopied(false);
  }, []);

  if (showResult && puzzleData) {
    return (
      <div className={styles.result}>
        <div className={styles.resultCard}>
          <div className={styles.resultHeader}>
            <Sparkles className={styles.resultIcon} />
            <h2>拼图已生成</h2>
          </div>

          {mode === "text" && qrCode && (
            <>
              <div className={styles.qrContainer}>
                <img src={qrCode} alt="QR Code" className={styles.qrCode} />
                <p className={styles.qrHint}>扫码开始拼图</p>
              </div>

              <div className={styles.shareSection}>
                <p className={styles.shareLabel}>或复制链接发送给朋友</p>
                <div className={styles.shareInput}>
                  <input type="text" value={shareUrl} readOnly className={styles.urlInput} />
                  <button className={styles.copyBtn} onClick={handleCopyLink}>
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                    {copied ? "已复制" : "复制"}
                  </button>
                </div>
              </div>
            </>
          )}

          <div className={styles.resultActions}>
            <span className={styles.savedText}>已保存</span>
            {mode === "text" && (
              <button className={styles.btnShare} onClick={handleShare}>
                <Share2 size={16} />
                去分享
              </button>
            )}
            <button className={styles.btnPrimary} onClick={handleStartPuzzle}>
              <Sparkles size={16} />
              开始挑战
            </button>
            <button className={styles.btnSecondary} onClick={handleReset}>
              再做一个
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={styles.create}>
        <div className={styles.contentWrapper}>
          <div className={styles.formSection}>
            <div className={styles.card}>
              <div className={styles.header}>
                <Heart className={styles.headerIcon} />
                <h2>制作拼图游戏</h2>
              </div>

              <div className={styles.modeSelector}>
                <button
                  className={`${styles.modeBtn} ${mode === "text" ? styles.modeBtnActive : ""}`}
                  onClick={() => handleModeChange("text")}
                >
                  <Type size={18} />
                  <span>文字模式</span>
                </button>
                <button
                  className={`${styles.modeBtn} ${mode === "image" ? styles.modeBtnActive : ""}`}
                  onClick={() => handleModeChange("image")}
                >
                  <FileImage size={18} />
                  <span>图片模式</span>
                </button>
              </div>

              {mode === "text" && (
                <>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      <span className={styles.labelText}>图片文字</span>
                      <span className={styles.labelHint}>（最多100字）</span>
                    </label>
                    <textarea
                      className={styles.textarea}
                      value={text}
                      onChange={handleTextChange}
                      placeholder="输入拼图上的文字..."
                      rows={4}
                    />
                    <div className={styles.charCount}>
                      <span className={text.length >= MAX_TEXT_LENGTH ? styles.charCountWarning : ""}>{text.length}</span>/{MAX_TEXT_LENGTH}
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      <Type size={16} />
                      <span className={styles.labelText}>文字颜色</span>
                    </label>
                    <div className={styles.colorOptions}>
                      {PRESET_TEXT_COLORS.map((color) => (
                        <button
                          key={color}
                          className={`${styles.colorBtn} ${textColor === color ? styles.colorBtnActive : ""}`}
                          style={{ backgroundColor: color }}
                          onClick={() => setTextColor(color)}
                          aria-label={`选择文字颜色 ${color}`}
                        />
                      ))}
                      <button
                        className={`${styles.colorBtn} ${styles.colorBtnRandom}`}
                        onClick={() => setTextColor(getRandomTextColor())}
                        aria-label="随机文字颜色"
                      >
                        <Sparkles size={16} />
                      </button>
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      <Palette size={16} />
                      <span className={styles.labelText}>背景颜色</span>
                    </label>
                    <div className={styles.colorOptions}>
                      {PRESET_COLORS.map((color) => (
                        <button
                          key={color}
                          className={`${styles.colorBtn} ${backgroundColor === color ? styles.colorBtnActive : ""}`}
                          style={{ backgroundColor: color }}
                          onClick={() => setBackgroundColor(color)}
                          aria-label={`选择颜色 ${color}`}
                        />
                      ))}
                      <button
                        className={`${styles.colorBtn} ${styles.colorBtnRandom}`}
                        onClick={() => setBackgroundColor(getRandomColor())}
                        aria-label="随机颜色"
                      >
                        <Sparkles size={16} />
                      </button>
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      <ImageIcon size={16} />
                      <span className={styles.labelText}>背景图片（可选）</span>
                    </label>
                    {!backgroundImage ? (
                      <label className={styles.uploadBtn}>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleBackgroundImageUpload}
                          className={styles.uploadInput}
                        />
                        <ImageIcon size={20} />
                        <span>选择背景图片</span>
                      </label>
                    ) : (
                      <div className={styles.imagePreview}>
                        <img src={backgroundImage} alt="背景预览" className={styles.previewImg} />
                        <button className={styles.removeImageBtn} onClick={removeImage}>
                          移除
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}

              {mode === "image" && (
                <>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      <ImageIcon size={16} />
                      <span className={styles.labelText}>上传图片</span>
                    </label>
                    {!uploadedImage ? (
                      <label className={styles.uploadBtn}>
                        <input
                          ref={imageInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleMainImageUpload}
                          className={styles.uploadInput}
                        />
                        <ImageIcon size={20} />
                        <span>选择图片（会自动裁剪为正方形）</span>
                      </label>
                    ) : (
                      <div className={styles.imagePreview}>
                        <img src={uploadedImage} alt="上传预览" className={styles.previewImg} />
                        <div className={styles.imageActions}>
                          <button className={styles.cropAgainBtn} onClick={handleReCrop}>
                            重新裁剪
                          </button>
                          <button className={styles.removeImageBtn} onClick={removeMainImage}>
                            更换图片
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      <span className={styles.labelText}>拼图名称</span>
                      <span className={styles.labelHint}>（最多20字）</span>
                    </label>
                    <input
                      type="text"
                      className={styles.input}
                      value={imagePuzzleName}
                      onChange={(e) => setImagePuzzleName(e.target.value.slice(0, 20))}
                      placeholder="给你的拼图起个名字..."
                    />
                  </div>
                </>
              )}

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  <span className={styles.labelText}>拼图难度</span>
                </label>
                <div className={styles.difficultyRow}>
                  {DIFFICULTY_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      className={`${styles.difficultyBtn} ${difficulty === option.value ? styles.difficultyBtnActive : ""}`}
                      onClick={() => setDifficulty(option.value as Difficulty)}
                    >
                      {option.label}
                      <span className={styles.difficultyDesc}>{option.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                className={styles.submitBtn}
                onClick={handleGenerate}
                disabled={mode === "text" ? !text.trim() || isGenerating : !uploadedImage || isGenerating}
              >
                {isGenerating ? (
                  <>
                    <span className={styles.spinner} />
                    生成中...
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    生成拼图
                  </>
                )}
              </button>
            </div>
          </div>

          <div className={styles.previewSection}>
            <div className={styles.previewCard}>
              <div className={styles.previewHeader}>
                <Eye className={styles.previewIcon} />
                <h3>拼图预览</h3>
              </div>
              <div className={styles.previewWrapper}>
                <img src={previewImage} alt="拼图预览" className={styles.previewImage} />
              </div>
              <p className={styles.previewHint}>{difficulty}片拼图</p>
            </div>
          </div>
        </div>
      </div>

      {showCropper && tempImage && (
        <ImageCropper
          image={tempImage}
          onCrop={handleCropComplete}
          onCancel={handleCropCancel}
          initialScale={cropState?.scale}
          initialPosition={cropState?.position}
          initialCropArea={cropState?.cropArea}
        />
      )}
    </>
  );
}
