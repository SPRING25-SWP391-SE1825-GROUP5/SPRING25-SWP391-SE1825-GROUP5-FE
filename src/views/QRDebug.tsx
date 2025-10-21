import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import QRCode from 'qrcode'

const QRDebug: React.FC = () => {
  const [searchParams] = useSearchParams()
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const bookingId = searchParams.get('bookingId')
  const paymentUrl = searchParams.get('paymentUrl')
  const amount = searchParams.get('amount')
  
  useEffect(() => {
    console.log('QRDebug mounted with params:', { bookingId, paymentUrl, amount })
    
    if (paymentUrl) {
      generateQRCode(paymentUrl)
    } else {
      setError('No paymentUrl provided')
    }
  }, [paymentUrl])

  const generateQRCode = async (data: string) => {
    try {
      console.log('Generating QR code for:', data)
      setIsGenerating(true)
      setError(null)
      
      const dataUrl = await QRCode.toDataURL(data, {
        width: 300,
        margin: 2,
        color: {
          dark: '#10b981',
          light: '#ffffff'
        }
      })
      
      console.log('QR code generated successfully')
      setQrCodeDataUrl(dataUrl)
    } catch (err: any) {
      console.error('Error generating QR code:', err)
      setError(err.message || 'Failed to generate QR code')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      <h1>QR Code Debug</h1>
      
      <div style={{ marginBottom: '1rem' }}>
        <h3>URL Parameters:</h3>
        <p><strong>bookingId:</strong> {bookingId || 'null'}</p>
        <p><strong>paymentUrl:</strong> {paymentUrl || 'null'}</p>
        <p><strong>amount:</strong> {amount || 'null'}</p>
      </div>
      
      <div style={{ marginBottom: '1rem' }}>
        <h3>Status:</h3>
        <p><strong>isGenerating:</strong> {isGenerating ? 'true' : 'false'}</p>
        <p><strong>hasQRCode:</strong> {qrCodeDataUrl ? 'true' : 'false'}</p>
        <p><strong>error:</strong> {error || 'none'}</p>
      </div>
      
      <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
        <h3>QR Code:</h3>
        {isGenerating && <p>Generating...</p>}
        {error && <p style={{ color: 'red' }}>Error: {error}</p>}
        {qrCodeDataUrl && (
          <img 
            src={qrCodeDataUrl} 
            alt="QR Code" 
            style={{ 
              width: '300px', 
              height: '300px', 
              border: '2px solid #10b981',
              borderRadius: '8px'
            }}
          />
        )}
      </div>
      
      <div style={{ marginBottom: '1rem' }}>
        <h3>Raw Payment URL:</h3>
        <textarea 
          value={paymentUrl || ''} 
          readOnly 
          style={{ width: '100%', height: '100px', fontSize: '12px' }}
        />
      </div>
    </div>
  )
}

export default QRDebug
