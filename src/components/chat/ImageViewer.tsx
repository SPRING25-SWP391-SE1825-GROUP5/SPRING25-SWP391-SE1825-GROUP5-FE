import React, { useEffect, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { ChatAttachment } from '@/types/chat'
import './ImageViewer.scss'

interface ImageViewerProps {
  images: ChatAttachment[]
  initialIndex: number
  onClose: () => void
}

const ImageViewer: React.FC<ImageViewerProps> = ({
  images,
  initialIndex,
  onClose
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [isLoading, setIsLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  useEffect(() => {
    setCurrentIndex(initialIndex)
    setIsLoading(true)
  }, [initialIndex])

  const handlePrevious = useCallback(() => {
    setCurrentIndex((prev) => {
      if (prev > 0) {
        setIsLoading(true)
        return prev - 1
      }
      return prev
    })
  }, [])

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => {
      if (prev < images.length - 1) {
        setIsLoading(true)
        return prev + 1
      }
      return prev
    })
  }, [images.length])

  useEffect(() => {
    if (!mounted) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowLeft') {
        handlePrevious()
      } else if (e.key === 'ArrowRight') {
        handleNext()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [currentIndex, mounted, onClose, handlePrevious, handleNext])

  const handleImageLoad = () => {
    setIsLoading(false)
  }

  const currentImage = images[currentIndex]

  if (!mounted || !currentImage) return null

  const content = (
    <div className="image-viewer" onClick={onClose}>
      <div className="image-viewer__overlay" />

      <div className="image-viewer__container" onClick={(e) => e.stopPropagation()}>
        {/* Image Container */}
        <div className="image-viewer__image-container">
          {isLoading && (
            <div className="image-viewer__loading">
              <div className="image-viewer__spinner" />
            </div>
          )}
          <img
            src={currentImage.url}
            alt={currentImage.name || `Image ${currentIndex + 1}`}
            className="image-viewer__image"
            onLoad={handleImageLoad}
            style={{ opacity: isLoading ? 0 : 1 }}
          />
        </div>

        {/* Navigation */}
        {images.length > 1 && (
          <>
            {currentIndex > 0 && (
              <button
                className="image-viewer__nav image-viewer__nav--prev"
                onClick={handlePrevious}
                aria-label="Ảnh trước"
                title="Ảnh trước"
              >
                <ChevronLeft size={32} />
              </button>
            )}
            {currentIndex < images.length - 1 && (
              <button
                className="image-viewer__nav image-viewer__nav--next"
                onClick={handleNext}
                aria-label="Ảnh tiếp theo"
                title="Ảnh tiếp theo"
              >
                <ChevronRight size={32} />
              </button>
            )}
          </>
        )}

        {/* Thumbnail Strip */}
        {images.length > 1 && (
          <div className="image-viewer__thumbnails">
            {images.map((image, index) => (
              <button
                key={image.id || index}
                className={`image-viewer__thumbnail ${
                  index === currentIndex ? 'image-viewer__thumbnail--active' : ''
                }`}
                onClick={() => {
                  setCurrentIndex(index)
                  setIsLoading(true)
                }}
                aria-label={`Xem ảnh ${index + 1}`}
              >
                <img
                  src={image.thumbnail || image.url}
                  alt={image.name || `Thumbnail ${index + 1}`}
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )

  return createPortal(content, document.body)
}

export default ImageViewer


