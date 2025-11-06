import styles from './PromotionBanner.module.scss'

export default function PromotionBanner() {
  return (
    <div className={styles.banner}>
      <div className={styles.bannerContent}>
        <div className={styles.bannerText}>
          <h1 className={styles.title}>Khuyến Mãi Đặc Biệt</h1>
          <p className={styles.subtitle}>Nhận ngay ưu đãi hấp dẫn cho dịch vụ và sản phẩm của chúng tôi</p>
        </div>
        <div className={styles.decorativeElement}>
          <div className={styles.ribbon}></div>
        </div>
      </div>
    </div>
  )
}

