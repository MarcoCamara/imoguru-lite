import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add token to requests
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Handle token expiration
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user');
          window.location.href = '/auth';
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async register(email: string, password: string, full_name: string) {
    const response = await this.api.post('/auth/register', { email, password, full_name });
    return response.data;
  }

  async login(email: string, password: string) {
    const response = await this.api.post('/auth/login', { email, password });
    if (response.data.token) {
      localStorage.setItem('auth_token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  }

  async resetPassword(email: string) {
    const response = await this.api.post('/auth/reset-password', { email });
    return response.data;
  }

  async updatePassword(token: string, password: string) {
    const response = await this.api.post('/auth/update-password', { token, password });
    return response.data;
  }

  // User endpoints
  async getCurrentUser() {
    const response = await this.api.get('/users/me');
    return response.data;
  }

  async updateProfile(data: any) {
    const response = await this.api.put('/users/profile', data);
    return response.data;
  }

  async getUsers() {
    const response = await this.api.get('/users');
    return response.data;
  }

  async deleteUser(userId: string) {
    const response = await this.api.delete(`/users/${userId}`);
    return response.data;
  }

  async updateUserRole(userId: string, role: string) {
    const response = await this.api.put(`/users/${userId}/role`, { role });
    return response.data;
  }

  // Properties endpoints
  async getProperties(filters?: any) {
    const response = await this.api.get('/properties', { params: filters });
    return response.data;
  }

  async getProperty(id: string) {
    const response = await this.api.get(`/properties/${id}`);
    return response.data;
  }

  async createProperty(data: any) {
    const response = await this.api.post('/properties', data);
    return response.data;
  }

  async updateProperty(id: string, data: any) {
    const response = await this.api.put(`/properties/${id}`, data);
    return response.data;
  }

  async deleteProperty(id: string) {
    const response = await this.api.delete(`/properties/${id}`);
    return response.data;
  }

  // Companies endpoints
  async getCompanies() {
    const response = await this.api.get('/companies');
    return response.data;
  }

  async getCompany(id: string) {
    const response = await this.api.get(`/companies/${id}`);
    return response.data;
  }

  async createCompany(data: any) {
    const response = await this.api.post('/companies', data);
    return response.data;
  }

  async updateCompany(id: string, data: any) {
    const response = await this.api.put(`/companies/${id}`, data);
    return response.data;
  }

  async deleteCompany(id: string) {
    const response = await this.api.delete(`/companies/${id}`);
    return response.data;
  }

  // Templates endpoints
  async getShareTemplates() {
    const response = await this.api.get('/templates/share');
    return response.data;
  }

  async getPrintTemplates() {
    const response = await this.api.get('/templates/print');
    return response.data;
  }

  async getAuthorizationTemplates() {
    const response = await this.api.get('/templates/authorization');
    return response.data;
  }

  async createTemplate(type: string, data: any) {
    const response = await this.api.post(`/templates/${type}`, data);
    return response.data;
  }

  async updateTemplate(type: string, id: string, data: any) {
    const response = await this.api.put(`/templates/${type}/${id}`, data);
    return response.data;
  }

  async deleteTemplate(type: string, id: string) {
    const response = await this.api.delete(`/templates/${type}/${id}`);
    return response.data;
  }

  // Email endpoints
  async sendPropertyEmail(propertyId: string, recipients: string[]) {
    const response = await this.api.post('/email/send-property', { propertyId, recipients });
    return response.data;
  }

  // Upload endpoints
  async uploadPropertyImages(propertyId: string, files: File[]) {
    const formData = new FormData();
    files.forEach(file => formData.append('images', file));
    
    const response = await this.api.post(`/upload/property-images/${propertyId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }

  async uploadPropertyVideo(propertyId: string, file: File, title?: string) {
    const formData = new FormData();
    formData.append('video', file);
    if (title) formData.append('title', title);
    
    const response = await this.api.post(`/upload/property-videos/${propertyId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }

  async uploadPropertyDocuments(propertyId: string, files: File[], documentType: string) {
    const formData = new FormData();
    files.forEach(file => formData.append('documents', file));
    formData.append('document_type', documentType);
    
    const response = await this.api.post(`/upload/property-documents/${propertyId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }

  async uploadCompanyLogo(companyId: string, file: File) {
    const formData = new FormData();
    formData.append('logo', file);
    
    const response = await this.api.post(`/upload/company-logos/${companyId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }

  // File download endpoints
  getPropertyDocumentUrl(filename: string) {
    return `${API_BASE_URL}/files/property-documents/${filename}`;
  }

  getPropertyVideoUrl(filename: string) {
    return `${API_BASE_URL}/files/property-videos/${filename}`;
  }
}

export const apiService = new ApiService();
