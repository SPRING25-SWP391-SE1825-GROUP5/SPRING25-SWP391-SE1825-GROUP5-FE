import { CenterService, NearbyCentersParams, NearbyCenter } from './centerService'

export interface LocationCoordinates {
    latitude: number
    longitude: number
}

export interface AddressSuggestion {
    address: string
    coordinates: LocationCoordinates
    formattedAddress: string
}

export interface LocationSearchResult {
    address: string
    coordinates: LocationCoordinates
    nearbyCenters: NearbyCenter[]
    selectedCenter?: NearbyCenter
}

export class LocationService {
    /**
     * Lấy vị trí hiện tại của user
     */
    static async getCurrentLocation(): Promise<LocationCoordinates> {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Trình duyệt không hỗ trợ định vị'))
                return
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    })
                },
                (error) => {
                    let message = 'Không thể lấy vị trí hiện tại'
                    switch (error.code) {
                        case error.PERMISSION_DENIED:
                            message = 'Bạn đã từ chối quyền truy cập vị trí'
                            break
                        case error.POSITION_UNAVAILABLE:
                            message = 'Thông tin vị trí không khả dụng'
                            break
                        case error.TIMEOUT:
                            message = 'Yêu cầu vị trí hết thời gian chờ'
                            break
                    }
                    reject(new Error(message))
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 300000 // 5 phút
                }
            )
        })
    }

    /**
     * Chuyển đổi tọa độ thành địa chỉ (reverse geocoding)
     * Sử dụng OpenStreetMap Nominatim API (miễn phí)
     */
    static async reverseGeocode(coordinates: LocationCoordinates): Promise<string> {
        try {
            const { latitude, longitude } = coordinates
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1&accept-language=vi`
            )

            if (!response.ok) {
                throw new Error('Không thể lấy địa chỉ từ tọa độ')
            }

            const data = await response.json()

            if (data && data.display_name) {
                // Format địa chỉ theo định dạng Việt Nam
                const address = data.display_name
                return address
            }

            return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
        } catch (error) {

            return `${coordinates.latitude.toFixed(6)}, ${coordinates.longitude.toFixed(6)}`
        }
    }

    /**
     * Tìm kiếm địa chỉ (forward geocoding)
     * Sử dụng OpenStreetMap Nominatim API
     */
    static async searchAddress(query: string): Promise<AddressSuggestion[]> {
        if (!query.trim()) return []

        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=5&accept-language=vi&countrycodes=vn`
            )

            if (!response.ok) {
                throw new Error('Không thể tìm kiếm địa chỉ')
            }

            const data = await response.json()

            return data.map((item: any) => ({
                address: item.display_name,
                coordinates: {
                    latitude: parseFloat(item.lat),
                    longitude: parseFloat(item.lon)
                },
                formattedAddress: item.display_name
            }))
        } catch (error) {

            return []
        }
    }

    /**
     * Tìm chi nhánh gần nhất dựa trên tọa độ
     */
    static async findNearbyCenters(
        coordinates: LocationCoordinates,
        radiusKm: number = 10,
        limit: number = 5
    ): Promise<NearbyCenter[]> {
        try {
            const params: NearbyCentersParams = {
                lat: coordinates.latitude,
                lng: coordinates.longitude,
                radiusKm,
                limit
            }

            const nearbyCenters = await CenterService.getNearbyCenters(params)
            return nearbyCenters || []
        } catch (error) {

            return []
        }
    }

    /**
     * Tìm chi nhánh gần nhất dựa trên địa chỉ
     */
    static async findNearbyCentersByAddress(
        address: string,
        radiusKm: number = 10,
        limit: number = 5
    ): Promise<LocationSearchResult | null> {
        try {
            // Tìm kiếm địa chỉ trước
            const suggestions = await this.searchAddress(address)

            if (suggestions.length === 0) {
                return null
            }

            // Lấy tọa độ từ kết quả đầu tiên
            const firstSuggestion = suggestions[0]
            const coordinates = firstSuggestion.coordinates

            // Tìm chi nhánh gần nhất
            const nearbyCenters = await this.findNearbyCenters(coordinates, radiusKm, limit)

            return {
                address: firstSuggestion.formattedAddress,
                coordinates,
                nearbyCenters,
                selectedCenter: nearbyCenters.length > 0 ? nearbyCenters[0] : undefined
            }
        } catch (error) {

            return null
        }
    }

    /**
     * Tính khoảng cách giữa hai điểm (Haversine formula)
     */
    static calculateDistance(
        point1: LocationCoordinates,
        point2: LocationCoordinates
    ): number {
        const R = 6371 // Bán kính Trái Đất (km)
        const dLat = this.toRadians(point2.latitude - point1.latitude)
        const dLon = this.toRadians(point2.longitude - point1.longitude)

        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRadians(point1.latitude)) *
            Math.cos(this.toRadians(point2.latitude)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2)

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        return R * c
    }

    private static toRadians(degrees: number): number {
        return degrees * (Math.PI / 180)
    }

    /**
     * Lấy vị trí hiện tại và tìm chi nhánh gần nhất
     */
    static async getCurrentLocationWithNearbyCenters(
        radiusKm: number = 10,
        limit: number = 5
    ): Promise<LocationSearchResult | null> {
        try {
            const coordinates = await this.getCurrentLocation()
            const address = await this.reverseGeocode(coordinates)
            const nearbyCenters = await this.findNearbyCenters(coordinates, radiusKm, limit)

            return {
                address,
                coordinates,
                nearbyCenters,
                selectedCenter: nearbyCenters.length > 0 ? nearbyCenters[0] : undefined
            }
        } catch (error) {

            return null
        }
    }
}

export default LocationService
