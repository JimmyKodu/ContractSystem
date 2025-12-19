// API封装
const API_BASE_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3000/api' 
  : '/api';

const api = {
  // 存储token
  token: localStorage.getItem('token'),
  
  // 设置token
  setToken(token) {
    this.token = token;
    localStorage.setItem('token', token);
  },
  
  // 清除token
  clearToken() {
    this.token = null;
    localStorage.removeItem('token');
  },
  
  // 通用请求方法
  async request(url, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}${url}`, {
        ...options,
        headers
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || '请求失败');
      }
      
      return data;
    } catch (error) {
      console.error('API请求错误:', error);
      throw error;
    }
  },
  
  // 文件上传请求
  async uploadFile(url, formData) {
    const headers = {};
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}${url}`, {
        method: 'POST',
        headers,
        body: formData
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || '上传失败');
      }
      
      return data;
    } catch (error) {
      console.error('文件上传错误:', error);
      throw error;
    }
  },
  
  // 用户相关API
  users: {
    login(username, password) {
      return api.request('/users/login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
      });
    },
    
    getMe() {
      return api.request('/users/me');
    },
    
    getAll() {
      return api.request('/users');
    },
    
    getByRole(role) {
      return api.request(`/users/role/${role}`);
    },
    
    updateSignature(userId, signatureImageUrl) {
      return api.request(`/users/${userId}/signature`, {
        method: 'PUT',
        body: JSON.stringify({ signatureImageUrl })
      });
    }
  },
  
  // 客户相关API
  customers: {
    getAll() {
      return api.request('/customers');
    },
    
    getById(id) {
      return api.request(`/customers/${id}`);
    },
    
    create(data) {
      return api.request('/customers', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    }
  },
  
  // 合同相关API
  contracts: {
    getAll(filters = {}) {
      const params = new URLSearchParams(filters);
      return api.request(`/contracts?${params}`);
    },
    
    getById(id) {
      return api.request(`/contracts/${id}`);
    },
    
    getPending(role) {
      return api.request(`/contracts/pending/${role}`);
    },
    
    create(data) {
      return api.request('/contracts', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    
    submit(id, data) {
      return api.request(`/contracts/${id}/submit`, {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    
    approve(id, data) {
      return api.request(`/contracts/${id}/approve`, {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    
    reject(id, data) {
      return api.request(`/contracts/${id}/reject`, {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    
    uploadFile(id, file) {
      const formData = new FormData();
      formData.append('file', file);
      return api.uploadFile(`/contracts/${id}/upload`, formData);
    },
    
    compare(id, file) {
      const formData = new FormData();
      formData.append('returnedFile', file);
      return api.uploadFile(`/contracts/${id}/compare`, formData);
    },
    
    generateFinal(id) {
      return api.request(`/contracts/${id}/generate-final`, {
        method: 'POST'
      });
    },
    
    saveSignaturePosition(id, data) {
      return api.request(`/contracts/${id}/signature-position`, {
        method: 'POST',
        body: JSON.stringify(data)
      });
    }
  }
};

// 暴露到全局
window.api = api;
