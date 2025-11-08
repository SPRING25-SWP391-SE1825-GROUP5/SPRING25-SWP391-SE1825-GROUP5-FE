import api from "./api";

export interface VehicleModel {
  modelId: number;
  modelName: string;
  brand: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  imageUrl?: string; // Cloudinary URL (BE column ImageUrl)
}

export interface CreateVehicleModelRequest {
  modelName: string;
  brand: string;
  isActive?: boolean;
}

export interface UpdateVehicleModelRequest {
  modelName?: string;
  brand?: string;
  isActive?: boolean;
}

export interface VehicleModelResponse {
  modelId: number;
  modelName: string;
  brand: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  imageUrl?: string; // Cloudinary URL
}

export interface VehicleModelSearchParams {
  searchTerm?: string;
  brand?: string;
  isActive?: boolean;
  pageNumber?: number;
  pageSize?: number;
}

// Service functions cho VehicleModel
export const vehicleModelService = {
  // get all vehicle model
  async getAll(): Promise<VehicleModelResponse[]> {
    try {
      const response = await api.get('/VehicleModel');
      return response.data;
    } catch (error) {
      console.error('Error fetching vehicle models:', error);
      throw error;
    }
  },

  // get vm by id
  async getById(id: number): Promise<VehicleModelResponse> {
    try {
      const response = await api.get(`/VehicleModel/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching vehicle model ${id}:`, error);
      throw error;
    }
  },

  // get vm by brand
  async getByBrand(brand: string): Promise<VehicleModelResponse[]> {
    try {
      const response = await api.get(`/VehicleModel/brand/${encodeURIComponent(brand)}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching vehicle models by brand ${brand}:`, error);
      throw error;
    }
  },

  // get active vm
  async getActive(): Promise<VehicleModelResponse[]> {
    try {
      const response = await api.get('/VehicleModel/active');
      return response.data;
    } catch (error) {
      console.error('Error fetching active vehicle models:', error);
      throw error;
    }
  },

  // search 
  async search(searchTerm: string): Promise<VehicleModelResponse[]> {
    try {
      const response = await api.get(`/VehicleModel/search?searchTerm=${encodeURIComponent(searchTerm)}`);
      return response.data;
    } catch (error) {
      console.error(`Error searching vehicle models with term ${searchTerm}:`, error);
      throw error;
    }
  },

  // create vm
  async create(data: CreateVehicleModelRequest): Promise<VehicleModelResponse> {
    try {
      const response = await api.post('/VehicleModel', data);
      return response.data;
    } catch (error) {
      console.error('Error creating vehicle model:', error);
      throw error;
    }
  },

  // update vm
  async update(id: number, data: UpdateVehicleModelRequest): Promise<VehicleModelResponse> {
    try {
      const response = await api.put(`/VehicleModel/${id}`, data);
      return response.data;
    } catch (error) {
      console.error(`Error updating vehicle model ${id}:`, error);
      throw error;
    }
  },

  // delete vm
  async delete(id: number): Promise<boolean> {
    try {
      await api.delete(`/VehicleModel/${id}`);
      return true;
    } catch (error) {
      console.error(`Error deleting vehicle model ${id}:`, error);
      throw error;
    }
  },

  // active/deactive vm
  async toggleActive(id: number): Promise<boolean> {
    try {
      const response = await api.patch(`/VehicleModel/${id}/toggle-active`);
      return response.status === 200;
    } catch (error) {
      console.error(`Error toggling active status for vehicle model ${id}:`, error);
      throw error;
    }
  }
};

// Export default cho backward compatibility
export default vehicleModelService;
