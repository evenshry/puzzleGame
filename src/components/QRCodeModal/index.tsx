import React, { useState, useEffect, useCallback } from 'react';
import { X, Copy, Check, Share2, Image as ImageIcon } from 'lucide-react';
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

  useEffect(() => {
    const hasLargeImage = Boolean(config.backgroundImage && config.backgroundImage.length > 500);
    setIsImageMode(hasLargeImage);
    
    if (isOpen) {
      if (!hasLargeImage) {
        const url = generateShareURL(config);
        setShareUrl(url);
        
        generateQRCode(config).then(setQrCode).catch((err) => {
          console.error('QR generation failed:', err);
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
      showToast('图片拼图请使用其他方式分享', 'info');
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
              💡 建议截图或保存图片后，通过微信、QQ等社交软件发送给朋友
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
            {qrCode && (
              <div className={styles.qrContainer}>
                <img src={qrCode} alt="二维码" className={styles.qrCode} />
                <p className={styles.qrHint}>扫码开始拼图</p>
              </div>
            )}

            {shareUrl && (
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
          {!isImageMode && (
            <button className={styles.shareBtn} onClick={handleShare}>
              <Share2 size={16} />
              去分享
            </button>
          )}
          <button className={styles.cancelBtn} onClick={onClose}>
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};

export default QRCodeModal;
