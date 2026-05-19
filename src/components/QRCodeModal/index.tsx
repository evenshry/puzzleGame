import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, Copy, Check, Share2, Download, Image as ImageIcon, Link } from 'lucide-react';
import { PuzzleConfig } from '@/types';
import { generateQRCode, generateShareURL } from '@/utils/qrcode';
import { useToast } from '@/components/Toast';
import styles from './index.module.scss';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: PuzzleConfig;
  thumbnail?: string;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({ isOpen, onClose, config, thumbnail }) => {
  const { showToast } = useToast();
  const [qrCode, setQrCode] = useState<string>('');
  const [shareUrl, setShareUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [isImageMode, setIsImageMode] = useState(false);
  const [canGenerateQR, setCanGenerateQR] = useState(true);
  const [showLinkSection, setShowLinkSection] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const hasLargeImage = Boolean(config.backgroundImage && config.backgroundImage.length > 500);
    setIsImageMode(hasLargeImage);
    setCanGenerateQR(!hasLargeImage);
    setShowLinkSection(!hasLargeImage);
    
    if (isOpen) {
      if (!hasLargeImage) {
        const url = generateShareURL(config);
        setShareUrl(url);
        
        generateQRCode(config).then(setQrCode).catch((err) => {
          console.error('QR generation failed:', err);
          setCanGenerateQR(false);
        });
      }
    }
  }, [isOpen, config]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      showToast('链接已复制', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast('复制失败，请手动复制', 'error');
    }
  }, [shareUrl, showToast]);

  const handleShare = useCallback(async () => {
    if (isImageMode) {
      showToast('图片拼图请使用分享图分享', 'info');
      return;
    }
    
    if (navigator.share && shareUrl) {
      try {
        await navigator.share({
          title: '快来挑战我的拼图！',
          text: config.text || '文字拼图',
          url: shareUrl,
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else if (shareUrl) {
      handleCopyLink();
    }
  }, [shareUrl, config.text, handleCopyLink, isImageMode, showToast]);

  const generateShareImage = useCallback(async () => {
    if (!canvasRef.current || !thumbnail) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 600;
    canvas.height = 800;

    const gradient = ctx.createLinearGradient(0, 0, 600, 800);
    gradient.addColorStop(0, '#667eea');
    gradient.addColorStop(1, '#764ba2');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 600, 800);

    ctx.fillStyle = 'white';
    ctx.roundRect(30, 30, 540, 740, 20);
    ctx.fill();

    ctx.fillStyle = '#333';
    ctx.font = 'bold 28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
    ctx.textAlign = 'center';
    ctx.fillText('🧩 快来挑战我的拼图！', 300, 80);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(100, 110, 400, 400, 12);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(img, 100, 110, 400, 400);
      ctx.restore();

      ctx.fillStyle = '#666';
      ctx.font = '18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
      ctx.fillText(`${config.difficulty}片拼图`, 300, 540);
      
      if (config.text) {
        ctx.fillStyle = '#333';
        ctx.font = '16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
        const displayText = config.text.length > 20 ? config.text.substring(0, 20) + '...' : config.text;
        ctx.fillText(`「${displayText}」`, 300, 570);
      }

      ctx.beginPath();
      ctx.moveTo(80, 600);
      ctx.lineTo(520, 600);
      ctx.strokeStyle = '#e8e8e8';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#333';
      ctx.font = '20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
      ctx.fillText('扫码开始拼图', 300, 640);

      if (qrCode && canGenerateQR) {
        const qrImg = new Image();
        qrImg.onload = () => {
          ctx.drawImage(qrImg, 200, 660, 200, 200);
          
          const dataUrl = canvas.toDataURL('image/png');
          const link = document.createElement('a');
          link.download = `拼图分享-${Date.now()}.png`;
          link.href = dataUrl;
          link.click();
          showToast('分享图已下载', 'success');
        };
        qrImg.src = qrCode;
      } else {
        ctx.fillStyle = '#999';
        ctx.font = '16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
        ctx.fillText('保存图片分享给朋友', 300, 680);
        
        ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
        ctx.fillText('对方打开 App 后扫描或粘贴链接', 300, 710);
        
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `拼图分享-${Date.now()}.png`;
        link.href = dataUrl;
        link.click();
        showToast('分享图已下载', 'success');
      }
    };
    img.src = thumbnail;
  }, [thumbnail, config.difficulty, config.text, qrCode, canGenerateQR, showToast]);

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>分享拼图</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {isImageMode ? (
          <div className={styles.imageModeContent}>
            <div className={styles.imageModeIcon}>
              <ImageIcon size={48} />
            </div>
            <h3 className={styles.imageModeTitle}>图片拼图分享</h3>
            <p className={styles.imageModeDesc}>
              图片内容较大，无法生成二维码和短链接
            </p>
            <p className={styles.imageModeTip}>
              💡 建议下载分享图，通过微信、QQ等社交软件直接发送给朋友
            </p>
            
            {thumbnail && (
              <div className={styles.imagePreview}>
                <img src={thumbnail} alt="拼图预览" className={styles.previewImage} />
                <p className={styles.previewInfo}>{config.difficulty}片拼图</p>
              </div>
            )}
          </div>
        ) : (
          <>
            {qrCode && canGenerateQR && (
              <div className={styles.qrContainer}>
                <img src={qrCode} alt="二维码" className={styles.qrCode} />
                <p className={styles.qrHint}>扫码开始拼图</p>
              </div>
            )}

            {showLinkSection && shareUrl && (
              <div className={styles.shareSection}>
                <label className={styles.shareLabel}>分享链接</label>
                <div className={styles.shareInput}>
                  <input type="text" value={shareUrl} readOnly className={styles.urlInput} />
                  <button 
                    className={`${styles.copyBtn} ${copied ? styles.copied : ''}`} 
                    onClick={handleCopyLink}
                  >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                    {copied ? '已复制' : '复制'}
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        <div className={styles.actionButtons}>
          {thumbnail && (
            <button className={styles.downloadBtn} onClick={generateShareImage}>
              <Download size={16} />
              下载分享图
            </button>
          )}
          {!isImageMode && (
            <button className={styles.shareBtn} onClick={handleShare}>
              <Share2 size={16} />
              去分享
            </button>
          )}
          {isImageMode && (
            <button className={styles.linkBtn} onClick={() => showToast('图片拼图请使用分享图分享', 'info')}>
              <Link size={16} />
              了解分享方式
            </button>
          )}
          <button className={styles.cancelBtn} onClick={onClose}>
            关闭
          </button>
        </div>

        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>
    </div>
  );
};

export default QRCodeModal;
