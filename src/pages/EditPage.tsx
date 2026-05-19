import { useState, useCallback, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Heart, Palette, Sparkles, Image as ImageIcon, Eye, Save, ArrowLeft, Type, QrCode, FileImage } from 'lucide-react';
import { Difficulty, PuzzleConfig, PuzzleData, SavedPuzzle } from '@/types';
import {
  generatePuzzle,
  PRESET_COLORS,
  getRandomColor,
  DIFFICULTY_OPTIONS,
  CANVAS_CONFIG,
  PRESET_TEXT_COLORS,
  getRandomTextColor,
} from '@/utils/puzzle';
import { compressImage } from '@/utils/qrcode';
import { getPuzzleById, updatePuzzleConfig } from '@/utils/storage';
import { useAppStore } from '@/store/appStore';
import { useToast } from '@/components/Toast';
import Layout from '@/components/Layout';
import QRCodeModal from '@/components/QRCodeModal';
import ImageCropper from '@/components/CreatePuzzle/ImageCropper';
import styles from '@/components/CreatePuzzle/index.module.scss';

const MAX_TEXT_LENGTH = 100;
type CreateMode = 'text' | 'image';

export function EditPage() {
  const { showToast } = useToast();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const setPuzzleData = useAppStore(state => state.setPuzzleData);
  const setPuzzleThumbnail = useAppStore(state => state.setPuzzleThumbnail);

  const [mode, setMode] = useState<CreateMode>('text');
  const [text, setText] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>(9);
  const [backgroundColor, setBackgroundColor] = useState(PRESET_COLORS[0]);
  const [textColor, setTextColor] = useState('#2a2a2a');
  const [backgroundImage, setBackgroundImage] = useState<string>('');
  const [uploadedImage, setUploadedImage] = useState<string>('');
  const [originalImage, setOriginalImage] = useState<string>('');
  const [tempImage, setTempImage] = useState<string>('');
  const [cropState, setCropState] = useState<{ scale: number; position: { x: number; y: number }; cropArea: { x: number; y: number; size: number } } | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewImage, setPreviewImage] = useState<string>('');
  const [puzzleData, setPuzzleDataState] = useState<PuzzleData | null>(null);
  const [savedPuzzle, setSavedPuzzle] = useState<SavedPuzzle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showQRModal, setShowQRModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (id) {
      const loadPuzzle = async () => {
        const puzzle = await getPuzzleById(id);
        if (puzzle) {
          setSavedPuzzle(puzzle);
          setText(puzzle.config.text);
          setDifficulty(puzzle.config.difficulty);
          setBackgroundColor(puzzle.config.backgroundColor);
          setTextColor(puzzle.config.textColor || '#2a2a2a');
          setBackgroundImage(puzzle.config.backgroundImage || '');
          setPreviewImage(puzzle.thumbnail);
          if (!puzzle.config.text && puzzle.config.backgroundImage) {
            setMode('image');
            setUploadedImage(puzzle.config.backgroundImage);
          }
        }
        setIsLoading(false);
      };
      loadPuzzle();
    }
  }, [id]);

  useEffect(() => {
    if (mode === 'text') {
      const config: PuzzleConfig = {
        text: text.trim() || '预览效果',
        difficulty,
        backgroundColor,
        textColor,
        backgroundImage: backgroundImage || undefined,
      };

      if (backgroundImage) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
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
      }
    }
  }, [mode, text, difficulty, backgroundColor, textColor, backgroundImage, uploadedImage]);

  const generatePreview = (config: PuzzleConfig): string => {
    const canvas = document.createElement('canvas');
    canvas.width = CANVAS_CONFIG.SIZE;
    canvas.height = CANVAS_CONFIG.SIZE;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = config.backgroundColor;
    ctx.fillRect(0, 0, CANVAS_CONFIG.SIZE, CANVAS_CONFIG.SIZE);

    const padding = CANVAS_CONFIG.SIZE * 0.08;
    const availableWidth = CANVAS_CONFIG.SIZE - padding * 2;
    const availableHeight = CANVAS_CONFIG.SIZE - padding * 2;

    const result = calculateOptimalTextLayout(ctx, config.text || '预览效果', availableWidth, availableHeight);

    ctx.font = `bold ${result.fontSize}px 'Caveat', cursive`;
    ctx.fillStyle = config.textColor || '#2a2a2a';
    ctx.textBaseline = 'middle';

    const totalTextHeight = result.lines.length * result.lineHeight;
    let startY = (CANVAS_CONFIG.SIZE - totalTextHeight) / 2 + result.lineHeight / 2;

    result.lines.forEach((line) => {
      ctx.textAlign = 'center';
      ctx.fillText(line.text, CANVAS_CONFIG.SIZE / 2, startY);
      startY += result.lineHeight;
    });

    drawGridLines(ctx, config.difficulty);

    return canvas.toDataURL('image/png');
  };

  const calculateOptimalTextLayout = (
    ctx: CanvasRenderingContext2D,
    text: string,
    maxWidth: number,
    maxHeight: number
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
    maxWidth: number
  ): Array<{ text: string; width: number; align: CanvasTextAlign }> => {
    const lines: Array<{ text: string; width: number; align: CanvasTextAlign }> = [];
    const paragraphs = text.split('\n');

    paragraphs.forEach((paragraph) => {
      if (paragraph.trim() === '') {
        if (lines.length > 0) {
          lines[lines.length - 1].text += ' ';
        }
        return;
      }

      const chars = paragraph.split('');
      let currentLine = '';
      let currentWidth = 0;

      chars.forEach((char) => {
        const charWidth = ctx.measureText(char).width;

        if (currentWidth + charWidth > maxWidth && currentLine !== '') {
          lines.push({
            text: currentLine,
            width: ctx.measureText(currentLine).width,
            align: 'left',
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
          align: 'left',
        });
      }
    });

    return lines;
  };

  const drawGridLines = (ctx: CanvasRenderingContext2D, difficulty: number) => {
    const gridSize = Math.sqrt(difficulty);
    const pieceSize = CANVAS_CONFIG.SIZE / gridSize;

    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.lineWidth = 1.5;
    ctx.lineJoin = 'round';

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
    const canvas = document.createElement('canvas');
    canvas.width = CANVAS_CONFIG.SIZE;
    canvas.height = CANVAS_CONFIG.SIZE;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = config.backgroundColor;
    ctx.fillRect(0, 0, CANVAS_CONFIG.SIZE, CANVAS_CONFIG.SIZE);

    ctx.globalAlpha = 0.25;
    ctx.drawImage(img, 0, 0, CANVAS_CONFIG.SIZE, CANVAS_CONFIG.SIZE);
    ctx.globalAlpha = 1;

    const padding = CANVAS_CONFIG.SIZE * 0.08;
    const availableWidth = CANVAS_CONFIG.SIZE - padding * 2;
    const availableHeight = CANVAS_CONFIG.SIZE - padding * 2;

    const result = calculateOptimalTextLayout(ctx, config.text || '预览效果', availableWidth, availableHeight);

    ctx.font = `bold ${result.fontSize}px 'Caveat', cursive`;
    ctx.fillStyle = config.textColor || '#2a2a2a';
    ctx.textBaseline = 'middle';

    const totalTextHeight = result.lines.length * result.lineHeight;
    let startY = (CANVAS_CONFIG.SIZE - totalTextHeight) / 2 + result.lineHeight / 2;

    result.lines.forEach((line) => {
      ctx.textAlign = 'center';
      ctx.fillText(line.text, CANVAS_CONFIG.SIZE / 2, startY);
      startY += result.lineHeight;
    });

    drawGridLines(ctx, config.difficulty);

    return canvas.toDataURL('image/png');
  };

  const generateImagePreview = (uploadedImageData: string, difficulty: Difficulty): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = CANVAS_CONFIG.SIZE;
      canvas.height = CANVAS_CONFIG.SIZE;
      const ctx = canvas.getContext('2d')!;

      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, CANVAS_CONFIG.SIZE, CANVAS_CONFIG.SIZE);
        drawGridLines(ctx, difficulty);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => {
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, CANVAS_CONFIG.SIZE, CANVAS_CONFIG.SIZE);
        drawGridLines(ctx, difficulty);
        resolve(canvas.toDataURL('image/png'));
      };
      img.src = uploadedImageData;
    });
  };

  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= MAX_TEXT_LENGTH) {
      setText(value);
    }
  }, []);

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 500 * 1024) {
        showToast('图片大小不能超过500KB', 'warning');
        return;
      }
      try {
        const compressed = await compressImage(file, CANVAS_CONFIG.SIZE, CANVAS_CONFIG.SIZE, 0.5);
        setBackgroundImage(compressed);
      } catch {
        showToast('图片处理失败，请重试', 'error');
      }
    }
  }, [showToast]);

  const handleMainImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        showToast('图片大小不能超过10MB', 'warning');
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
        showToast('图片处理失败，请重试', 'error');
      }
    }
  }, [showToast]);

  const handleCropComplete = useCallback((croppedImage: string, state: { scale: number; position: { x: number; y: number }; cropArea: { x: number; y: number; size: number } }) => {
    setUploadedImage(croppedImage);
    setPreviewImage(croppedImage);
    setCropState(state);
    setShowCropper(false);
    setTempImage('');
  }, []);

  const handleCropCancel = useCallback(() => {
    setShowCropper(false);
    setTempImage('');
  }, []);

  const handleReCrop = useCallback(() => {
    if (originalImage) {
      setTempImage(originalImage);
      setShowCropper(true);
    }
  }, [originalImage]);

  const removeImage = useCallback(() => {
    setBackgroundImage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const removeMainImage = useCallback(() => {
    setUploadedImage('');
    setPreviewImage('');
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  }, []);

  const handleGenerate = useCallback(async () => {
    if (mode === 'text' && !text.trim()) return;
    if (mode === 'image' && !uploadedImage) return;

    setIsGenerating(true);

    try {
      const config: PuzzleConfig = {
        text: mode === 'text' ? text.trim() : '',
        difficulty,
        backgroundColor: mode === 'text' ? backgroundColor : '#ffffff',
        textColor,
        backgroundImage: mode === 'text' ? (backgroundImage || undefined) : uploadedImage,
      };

      const newPuzzleData = generatePuzzle(config, true);
      setPuzzleDataState(newPuzzleData);
    } catch (error) {
      console.error('Failed to generate puzzle:', error);
      showToast(error instanceof Error ? error.message : '生成失败，请重试', 'error');
    } finally {
      setIsGenerating(false);
    }
  }, [mode, text, difficulty, backgroundColor, textColor, backgroundImage, uploadedImage, showToast]);

  const handleSavePuzzle = useCallback(async () => {
    if ((mode === 'text' && text.trim() && previewImage && savedPuzzle && puzzleData) ||
        (mode === 'image' && uploadedImage && previewImage && savedPuzzle && puzzleData)) {
      await updatePuzzleConfig(savedPuzzle.id, puzzleData.config, previewImage);
      showToast('拼图已更新！', 'success');
    }
  }, [mode, text, uploadedImage, previewImage, savedPuzzle, puzzleData, showToast]);

  const handleStartPuzzle = useCallback(() => {
    if (savedPuzzle) {
      setPuzzleData(puzzleData);
      setPuzzleThumbnail(previewImage);
      navigate(`/play/${savedPuzzle.id}`);
    }
  }, [puzzleData, setPuzzleData, setPuzzleThumbnail, navigate, previewImage, savedPuzzle]);

  const handleBack = useCallback(() => {
    navigate('/list');
  }, [navigate]);

  const handleShowQRCode = useCallback(() => {
    setShowQRModal(true);
  }, []);

  const currentConfig: PuzzleConfig = {
    text: mode === 'text' ? text.trim() : '',
    difficulty,
    backgroundColor: mode === 'text' ? backgroundColor : '#ffffff',
    textColor,
    backgroundImage: mode === 'text' ? (backgroundImage || undefined) : uploadedImage,
  };

  if (isLoading) {
    return (
      <Layout>
        <div className={styles.create}>
          <div className={styles.loading}>加载中...</div>
        </div>
      </Layout>
    );
  }

  if (!savedPuzzle) {
    return (
      <Layout>
        <div className={styles.create}>
          <div className={styles.notFound}>
            <h2>拼图不存在</h2>
            <button onClick={handleBack}>返回列表</button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className={styles.create}>
        <div className={styles.editHeader}>
          <button className={styles.backBtn} onClick={handleBack}>
            <ArrowLeft size={20} />
            返回
          </button>
          <h2>编辑拼图</h2>
        </div>

        <div className={styles.contentWrapper}>
          <div className={styles.formSection}>
            <div className={styles.card}>
              <div className={styles.header}>
                <Heart className={styles.headerIcon} />
                <h2>修改拼图内容</h2>
              </div>

            <div className={styles.modeSelector}>
              <button
                className={`${styles.modeBtn} ${mode === 'text' ? styles.modeBtnActive : ''}`}
                disabled
              >
                <Type size={18} />
                <span>文字模式</span>
              </button>
              <button
                className={`${styles.modeBtn} ${mode === 'image' ? styles.modeBtnActive : ''}`}
                disabled
              >
                <FileImage size={18} />
                <span>图片模式</span>
              </button>
            </div>

            {mode === 'text' && (
              <>
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    <span className={styles.labelText}>想说的话</span>
                    <span className={styles.labelHint}>（最多100字）</span>
                  </label>
                  <textarea
                    className={styles.textarea}
                    value={text}
                    onChange={handleTextChange}
                    placeholder="输入你的心意密语..."
                    rows={4}
                  />
                  <div className={styles.charCount}>
                    <span className={text.length >= MAX_TEXT_LENGTH ? styles.charCountWarning : ''}>
                      {text.length}
                    </span>
                    /{MAX_TEXT_LENGTH}
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
                        className={`${styles.colorBtn} ${backgroundColor === color ? styles.colorBtnActive : ''}`}
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
                    <Type size={16} />
                    <span className={styles.labelText}>文字颜色</span>
                  </label>
                  <div className={styles.colorOptions}>
                    {PRESET_TEXT_COLORS.map((color) => (
                      <button
                        key={color}
                        className={`${styles.colorBtn} ${textColor === color ? styles.colorBtnActive : ''}`}
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
                    <ImageIcon size={16} />
                    <span className={styles.labelText}>背景图片（可选，最大500KB）</span>
                  </label>
                  {!backgroundImage ? (
                    <label className={styles.uploadBtn}>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className={styles.uploadInput}
                      />
                      <ImageIcon size={20} />
                      <span>选择图片</span>
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

            {mode === 'image' && (
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
            )}

            <div className={styles.formGroup}>
              <label className={styles.label}>
                <span className={styles.labelText}>拼图难度</span>
              </label>
              <div className={styles.difficultyRow}>
                {DIFFICULTY_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    className={`${styles.difficultyBtn} ${difficulty === option.value ? styles.difficultyBtnActive : ''}`}
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
              disabled={(mode === 'text' && !text.trim()) || (mode === 'image' && !uploadedImage) || isGenerating}
            >
              {isGenerating ? (
                <>
                  <span className={styles.spinner} />
                  生成中...
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  重新生成预览
                </>
              )}
            </button>

            <div className={styles.actionButtons}>
              <button
                className={styles.btnSave}
                onClick={handleSavePuzzle}
                disabled={(mode === 'text' && !text.trim()) || (mode === 'image' && !uploadedImage)}
              >
                <Save size={16} />
                保存修改
              </button>
              <button
                className={styles.btnSave}
                onClick={handleShowQRCode}
                disabled={(mode === 'text' && !text.trim()) || (mode === 'image' && !uploadedImage)}
              >
                <QrCode size={16} />
                分享二维码
              </button>
              {puzzleData && (
                <button
                  className={styles.btnPrimary}
                  onClick={handleStartPuzzle}
                >
                  <Sparkles size={16} />
                  开始拼图
                </button>
              )}
            </div>
          </div>
        </div>

        <div className={styles.previewSection}>
          <div className={styles.previewCard}>
            <div className={styles.previewHeader}>
              <Eye className={styles.previewIcon} />
              <h3>拼图预览</h3>
            </div>
            <div className={styles.previewWrapper}>
              <img
                src={previewImage}
                alt="拼图预览"
                className={styles.previewImage}
              />
            </div>
            <p className={styles.previewHint}>
              {difficulty}片拼图，完成后会显示完整密语
            </p>
          </div>
        </div>
      </div>

      <QRCodeModal
        thumbnail={previewImage}
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        config={currentConfig}
      />

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
    </div>
    </Layout>
  );
}
