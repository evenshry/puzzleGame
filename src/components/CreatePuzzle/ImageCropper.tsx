import { useState, useRef, useCallback, useEffect } from 'react';
import { Move, Check, X, ZoomIn, ZoomOut } from 'lucide-react';
import styles from './ImageCropper.module.scss';

interface ImageCropperProps {
  image: string;
  onCrop: (croppedImage: string, state: { scale: number; position: { x: number; y: number }; cropArea: { x: number; y: number; size: number } }) => void;
  onCancel: () => void;
  canvasSize?: number;
  initialScale?: number;
  initialPosition?: { x: number; y: number };
  initialCropArea?: { x: number; y: number; size: number };
}

export default function ImageCropper({ 
  image, 
  onCrop, 
  onCancel,
  canvasSize = 400,
  initialScale = 1,
  initialPosition = { x: 0, y: 0 },
  initialCropArea 
}: ImageCropperProps) {
  const [scale, setScale] = useState(initialScale);
  const [position, setPosition] = useState(initialPosition);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [cropArea, setCropArea] = useState({ x: 0, y: 0, size: 200 });
  
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0, posX: 0, posY: 0, cropX: 0, cropY: 0, cropSize: 0 });
  const dragTypeRef = useRef<'image' | 'crop' | 'resize' | null>(null);

  useEffect(() => {
    if (imageRef.current && image) {
      imageRef.current.onload = () => {
        setImageLoaded(true);
      };
      
      if (imageRef.current.complete) {
        setImageLoaded(true);
      }
    }
  }, [image]);

  const hasInitialized = useRef(false);
  
  useEffect(() => {
    if (imageLoaded && containerRef.current && !hasInitialized.current) {
      hasInitialized.current = true;
      
      setScale(initialScale);
      setPosition(initialPosition || { x: 0, y: 0 });
      
      const containerWidth = containerRef.current.clientWidth;
      const containerHeight = containerRef.current.clientHeight;
      
      if (initialCropArea) {
        setCropArea(initialCropArea);
      } else {
        const initialSize = Math.min(containerWidth, containerHeight) * 0.7;
        setCropArea({
          x: (containerWidth - initialSize) / 2,
          y: (containerHeight - initialSize) / 2,
          size: initialSize
        });
      }
    }
  }, [imageLoaded, initialScale]);

  const handleZoomIn = useCallback(() => {
    setScale(prev => Math.min(prev + 0.2, 3));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale(prev => {
      const newScale = Math.max(prev - 0.2, 0.5);
      if (newScale < 1) {
        setPosition({ x: 0, y: 0 });
      }
      return newScale;
    });
  }, []);

  const handleReset = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    
    if (containerRef.current) {
      const containerWidth = containerRef.current.clientWidth;
      const containerHeight = containerRef.current.clientHeight;
      const initialSize = Math.min(containerWidth, containerHeight) * 0.7;
      
      setCropArea({
        x: (containerWidth - initialSize) / 2,
        y: (containerHeight - initialSize) / 2,
        size: initialSize
      });
    }
  }, []);

  const handleImageContainerMouseDown = useCallback((e: React.MouseEvent) => {
    // 检查点击的元素是否是 resize handle 或 crop area
    const target = e.target as HTMLElement;
    if (target.classList.contains(styles.resizeHandle)) {
      return; // 由 resize handle 自己处理
    }
    if (target.closest(`.${styles.cropArea}`)) {
      return; // 由 crop area 自己处理
    }
    
    e.preventDefault();
    e.stopPropagation();
    dragTypeRef.current = 'image';
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      posX: position.x,
      posY: position.y,
      cropX: 0,
      cropY: 0,
      cropSize: 0
    };
  }, [position]);

  const handleCropMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragTypeRef.current = 'crop';
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      posX: 0,
      posY: 0,
      cropX: cropArea.x,
      cropY: cropArea.y,
      cropSize: cropArea.size
    };
  }, [cropArea]);

  const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragTypeRef.current = 'resize';
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      posX: 0,
      posY: 0,
      cropX: cropArea.x,
      cropY: cropArea.y,
      cropSize: cropArea.size
    };
  }, [cropArea]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragTypeRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    const maxSize = Math.min(containerWidth, containerHeight);

    if (dragTypeRef.current === 'image') {
      const deltaX = e.clientX - dragStartRef.current.x;
      const deltaY = e.clientY - dragStartRef.current.y;
      
      let newX = dragStartRef.current.posX + deltaX;
      let newY = dragStartRef.current.posY + deltaY;
      
      const maxOffsetX = Math.max(0, (containerWidth * scale - containerWidth) / 2);
      const maxOffsetY = Math.max(0, (containerHeight * scale - containerHeight) / 2);
      
      newX = Math.max(-maxOffsetX, Math.min(newX, maxOffsetX));
      newY = Math.max(-maxOffsetY, Math.min(newY, maxOffsetY));
      
      setPosition({ x: newX, y: newY });
    } else if (dragTypeRef.current === 'crop') {
      const deltaX = e.clientX - dragStartRef.current.x;
      const deltaY = e.clientY - dragStartRef.current.y;
      
      let newX = dragStartRef.current.cropX + deltaX;
      let newY = dragStartRef.current.cropY + deltaY;
      
      newX = Math.max(0, Math.min(newX, containerWidth - cropArea.size));
      newY = Math.max(0, Math.min(newY, containerHeight - cropArea.size));
      
      setCropArea(prev => ({ ...prev, x: newX, y: newY }));
    } else if (dragTypeRef.current === 'resize') {
      const deltaX = e.clientX - dragStartRef.current.x;
      const deltaY = e.clientY - dragStartRef.current.y;
      const delta = Math.max(deltaX, deltaY);
      
      let newSize = dragStartRef.current.cropSize + delta;
      newSize = Math.max(50, Math.min(maxSize, newSize));
      
      const centerX = dragStartRef.current.cropX + dragStartRef.current.cropSize / 2;
      const centerY = dragStartRef.current.cropY + dragStartRef.current.cropSize / 2;
      
      let newX = centerX - newSize / 2;
      let newY = centerY - newSize / 2;
      
      newX = Math.max(0, Math.min(newX, containerWidth - newSize));
      newY = Math.max(0, Math.min(newY, containerHeight - newSize));
      
      setCropArea({ x: newX, y: newY, size: newSize });
    }
  }, [scale, cropArea.size]);

  const handleMouseUp = useCallback(() => {
    dragTypeRef.current = null;
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setScale(prev => {
      const newScale = Math.max(0.5, Math.min(prev + delta, 3));
      return newScale;
    });
  }, []);

  const handleConfirm = useCallback(() => {
    if (!containerRef.current || !imageRef.current) return;

    const container = containerRef.current;
    const img = imageRef.current;
    
    const cropSize = cropArea.size;
    const cropX = cropArea.x;
    const cropY = cropArea.y;
    
    const imgNaturalWidth = img.naturalWidth;
    const imgNaturalHeight = img.naturalHeight;
    
    // 使用浏览器 API 获取图片的实际渲染信息
    const imgRect = img.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    
    // 获取图片相对于容器的位置
    const imgX = imgRect.left - containerRect.left;
    const imgY = imgRect.top - containerRect.top;
    const imgRenderWidth = imgRect.width;
    const imgRenderHeight = imgRect.height;
    
    // 注意：getBoundingClientRect 返回的是变换后的位置和尺寸
    // 所以裁剪框的相对位置直接计算即可，不需要再除以缩放因子
    
    // 计算裁剪框在图片上的相对位置
    const relX = cropX - imgX;
    const relY = cropY - imgY;
    const relSize = cropSize;
    
    // 计算 object-fit: cover 的源区域
    const imgRatio = imgNaturalWidth / imgNaturalHeight;
    const renderRatio = imgRenderWidth / imgRenderHeight;
    
    let srcX = 0, srcY = 0;
    let srcWidth = imgNaturalWidth;
    let srcHeight = imgNaturalHeight;
    
    if (imgRatio > renderRatio) {
      // 图片更宽
      const excess = imgNaturalWidth - (imgNaturalHeight * renderRatio);
      srcX = excess / 2;
      srcWidth = imgNaturalWidth - excess;
    } else if (imgRatio < renderRatio) {
      // 图片更高
      const excess = imgNaturalHeight - (imgNaturalWidth / renderRatio);
      srcY = excess / 2;
      srcHeight = imgNaturalHeight - excess;
    }
    
    // 将相对位置转换为原始图片坐标
    const sourceX = srcX + (relX / imgRenderWidth) * srcWidth;
    const sourceY = srcY + (relY / imgRenderHeight) * srcHeight;
    const sourceSize = (relSize / imgRenderWidth) * srcWidth;
    
    // 确保裁剪区域在图片范围内
    const clampedSourceX = Math.max(0, Math.min(sourceX, imgNaturalWidth - sourceSize));
    const clampedSourceY = Math.max(0, Math.min(sourceY, imgNaturalHeight - sourceSize));
    const clampedSourceSize = Math.min(sourceSize, imgNaturalWidth - clampedSourceX, imgNaturalHeight - clampedSourceY);
    
    // 直接从原始图片裁剪
    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = canvasSize;
    finalCanvas.height = canvasSize;
    const finalCtx = finalCanvas.getContext('2d');
    
    if (finalCtx) {
      finalCtx.fillStyle = '#ffffff';
      finalCtx.fillRect(0, 0, canvasSize, canvasSize);
      
      finalCtx.drawImage(
        img,
        clampedSourceX,
        clampedSourceY,
        clampedSourceSize,
        clampedSourceSize,
        0,
        0,
        canvasSize,
        canvasSize
      );
      
      const croppedImage = finalCanvas.toDataURL('image/jpeg', 0.9);
      onCrop(croppedImage, { scale, position, cropArea });
    }
  }, [cropArea, scale, position, canvasSize, onCrop]);

  const zoomPercent = Math.round(scale * 100);

  return (
    <div className={styles.cropperOverlay}>
      <div className={styles.cropperContainer}>
        <div className={styles.cropperHeader}>
          <h3>调整图片和裁剪区域</h3>
          <div className={styles.zoomControls}>
            <button 
              className={styles.zoomBtn}
              onClick={handleZoomOut}
              title="缩小"
              disabled={scale <= 0.5}
            >
              <ZoomOut size={18} />
            </button>
            <span className={styles.zoomLabel}>{zoomPercent}%</span>
            <button 
              className={styles.zoomBtn}
              onClick={handleZoomIn}
              title="放大"
              disabled={scale >= 3}
            >
              <ZoomIn size={18} />
            </button>
            <button 
              className={styles.resetBtn}
              onClick={handleReset}
              title="重置"
            >
              重置
            </button>
          </div>
        </div>

        <div 
          ref={containerRef}
          className={styles.imageContainer}
          onMouseDown={handleImageContainerMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        >
          <img 
            ref={imageRef}
            src={image}
            alt="待裁剪图片"
            className={styles.previewImage}
            style={{
              transform: `translate(-50%, -50%) scale(${scale}) translate(${position.x}px, ${position.y}px)`
            }}
            draggable={false}
          />
          
          {imageLoaded && (
            <>
              <div className={styles.darkOverlay} />
              
              <div 
                className={styles.cropArea}
                style={{
                  left: cropArea.x,
                  top: cropArea.y,
                  width: cropArea.size,
                  height: cropArea.size,
                }}
                onMouseDown={handleCropMouseDown}
              >
                <div className={styles.cropBorder}>
                  <div className={styles.centerLineH} />
                  <div className={styles.centerLineV} />
                  
                  <div 
                    className={styles.dragHint}
                    style={{ pointerEvents: 'none' }}
                  >
                    <Move size={14} />
                    <span>拖动裁剪框</span>
                  </div>
                  
                  <div 
                    className={`${styles.resizeHandle} ${styles.topLeft}`}
                    onMouseDown={handleResizeMouseDown}
                  />
                  <div 
                    className={`${styles.resizeHandle} ${styles.topRight}`}
                    onMouseDown={handleResizeMouseDown}
                  />
                  <div 
                    className={`${styles.resizeHandle} ${styles.bottomLeft}`}
                    onMouseDown={handleResizeMouseDown}
                  />
                  <div 
                    className={`${styles.resizeHandle} ${styles.bottomRight}`}
                    onMouseDown={handleResizeMouseDown}
                  />
                </div>
              </div>
            </>
          )}
        </div>

        <div className={styles.tips}>
          <Move size={14} />
          <span>拖动图片移动，拖动裁剪框调整位置，拖动四角调整大小，滚轮缩放</span>
        </div>

        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={onCancel}>
            <X size={18} />
            取消
          </button>
          <button className={styles.confirmBtn} onClick={handleConfirm}>
            <Check size={18} />
            确认裁剪
          </button>
        </div>
      </div>
    </div>
  );
}
