import { useRef, useState } from 'react'
import { BaseButton, BaseCard } from '@/components/common'
import { AuthService } from '@/services'
import { PhotoIcon, CameraIcon } from '@heroicons/react/24/outline'
import { ProfileNav, ProfileOverview, ProfileInfo, ProfileVehicles, ProfilePromotions, ProfileSettings, ProfileHistory, ProfileReviews, ProfilePackages, ProfileNotifications, ProfileTabKey } from '@/components/profile'
import './profile.scss'

export default function Profile() {
  const [coverUrl, setCoverUrl] = useState<string>('')
  const [avatarUrl, setAvatarUrl] = useState<string>('')
  const coverInputRef = useRef<HTMLInputElement>(null)
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const [activeTab, setActiveTab] = useState<ProfileTabKey>('info')

  const handleSelectCover = () => coverInputRef.current?.click()
  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setCoverUrl(String(reader.result || ''))
    reader.readAsDataURL(file)
  }

  const handleSelectAvatar = () => avatarInputRef.current?.click()
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const res = await AuthService.uploadAvatar(file)
    if (res?.success && res.data?.avatarUrl) {
      setAvatarUrl(res.data.avatarUrl)
    }
  }
  return (
    <div className="profile-v2">
      <div
        className={`profile-v2__banner ${coverUrl ? 'has-image' : ''}`}
        style={coverUrl ? { backgroundImage: `url(${coverUrl})` } : undefined}
      >
        <button className="profile-v2__add-cover" onClick={handleSelectCover} title="Thêm ảnh bìa" aria-label="Thêm ảnh bìa">
          <PhotoIcon className="profile-v2__add-cover-icon" />
          <span>Thêm ảnh bìa</span>
                </button>
        <input ref={coverInputRef} type="file" accept="image/*" onChange={handleCoverChange} style={{ display: 'none' }} />
              </div>

      <div className="profile-v2__container">
        <div className="profile-v2__header">
          <div className="profile-v2__avatar" onClick={handleSelectAvatar} aria-label="avatar">
            {avatarUrl ? (
              <img src={avatarUrl} alt="avatar" />
            ) : (
              'VT'
            )}
            <span className="profile-v2__avatar-camera" title="Change avatar">
              <CameraIcon />
                            </span>
            <input ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
                          </div>
          <div className="profile-v2__header-info">
            <h1 className="profile-v2__name">Vo Minh Tien</h1>
                      </div>
                    </div>
                        
        <ProfileNav active={activeTab} onChange={setActiveTab} />
        <div className="profile-v2__section-wrapper">
          {activeTab === 'overview' && <ProfileOverview />}
          {activeTab === 'info' && <ProfileInfo />}
          {activeTab === 'vehicles' && <ProfileVehicles />}
          {activeTab === 'history' && <ProfileHistory />}
          {activeTab === 'reviews' && <ProfileReviews />}
          {activeTab === 'promotions' && <ProfilePromotions />}
          {activeTab === 'packages' && <ProfilePackages />}
          {activeTab === 'notifications' && <ProfileNotifications />}
                    </div>
                </div>
              </div>
  )
}

