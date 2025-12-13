import React, { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';

const CertificateTypes = ({ user }) => {
  const [certificateTypes, setCertificateTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [stats, setStats] = useState(null);

  // Form state for create/edit
  const [formData, setFormData] = useState({
    name: '',
    fee: 0,
    validity_days: 365,
    description: '',
    purpose: '',
    when_needed: '',
    required_data: '',
    is_active: true
  });

  useEffect(() => {
    loadCertificateTypes();
    loadStats();
  }, []);

  const loadCertificateTypes = async () => {
    try {
      const response = await apiRequest('certificate-types');
      const data = await response.json();
      setCertificateTypes(data || []);
    } catch (error) {
      console.error('Error loading certificate types:', error);
      alert('Failed to load certificate types');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      // Get some basic stats about certificate types
      const typesWithTemplates = await Promise.all(
        certificateTypes.map(async (type) => {
          try {
            const response = await apiRequest(`templates?document_type=${type.value}`);
            const templates = await response.json();
            return {
              ...type,
              templateCount: templates.data?.length || 0
            };
          } catch (error) {
            console.error(`Error loading templates for ${type.name}:`, error);
            return { ...type, templateCount: 0 };
          }
        })
      );
      setStats({
        total: certificateTypes.length,
        withTemplates: typesWithTemplates.filter(t => t.templateCount > 0).length,
        withoutTemplates: typesWithTemplates.filter(t => t.templateCount === 0).length
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  // Use useEffect to trigger loadStats when certificateTypes changes
  useEffect(() => {
    if (certificateTypes.length > 0) {
      loadStats();
    }
  }, [certificateTypes]);

  const handleCreateType = async (e) => {
    e.preventDefault();
    try {
      // Format required_data as JSON array
      const formattedData = {
        ...formData,
        required_data: formData.required_data
          ? JSON.stringify(formData.required_data.split('\n').filter(item => item.trim()))
          : null
      };

      // For now, we'll simulate creating in database
      // In a full implementation, this would call a backend API
      alert(`Create Certificate Type: ${formData.name}\n\nThis feature will be fully implemented once the backend API is ready.`);

      setShowCreateModal(false);
      resetForm();
      // Refresh would happen here: loadCertificateTypes();

    } catch (error) {
      console.error('Error creating certificate type:', error);
      alert(error.response?.data?.message || 'Failed to create certificate type');
    }
  };

  const handleUpdateType = async (e) => {
    e.preventDefault();
    try {
      // For now, simulate update
      alert(`Update Certificate Type: ${formData.name}\n\nThis feature will be fully implemented once the backend API is ready.`);

      setShowEditModal(false);
      setSelectedType(null);
      resetForm();
      // Refresh would happen here: loadCertificateTypes();

    } catch (error) {
      console.error('Error updating certificate type:', error);
      alert(error.response?.data?.message || 'Failed to update certificate type');
    }
  };

  const handleDeleteType = async (typeId, typeName) => {
    if (!window.confirm(`Are you sure you want to delete certificate type "${typeName}"? This may affect existing templates.`)) {
      return;
    }

    try {
      alert(`Delete Certificate Type: ${typeName}\n\nThis feature will be fully implemented once the backend API is ready.`);
      // refresh: loadCertificateTypes();
    } catch (error) {
      console.error('Error deleting certificate type:', error);
      alert(error.response?.data?.message || 'Failed to delete certificate type');
    }
  };

  const handleEditType = (type) => {
    // For now, just simulate editing
    alert(`Edit Certificate Type: ${type.name}\n\nThis feature will be fully implemented once the backend API is ready.`);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      fee: 0,
      validity_days: 365,
      description: '',
      purpose: '',
      when_needed: '',
      required_data: '',
      is_active: true
    });
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Certificate Types</h1>
            <p className="text-gray-600 mt-2">Manage available certificate types for document generation</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Certificate Type
          </button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-gray-600">Total Certificate Types</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-2xl font-bold text-green-600">{stats.withTemplates}</div>
              <div className="text-gray-600">Have Templates</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-2xl font-bold text-red-600">{stats.withoutTemplates}</div>
              <div className="text-gray-600">Need Templates</div>
            </div>
          </div>
        )}
      </div>

      {/* Certificate Types List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Certificate Types</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fee (₱)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Validity (Days)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {certificateTypes.map((type) => (
                <tr key={type.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {type.label || type.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      ₱{type.fee || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {type.validity_days || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate">
                      {type.description || 'No description'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      type.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {type.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleEditType(type)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteType(type.id, type.label || type.name)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {certificateTypes.length === 0 && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No certificate types</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new certificate type.</p>
          </div>
        )}
      </div>

      {/* Create Certificate Type Modal */}
      {showCreateModal && (
        <CertificateTypeModal
          title="Create New Certificate Type"
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleCreateType}
          onClose={() => {
            setShowCreateModal(false);
            resetForm();
          }}
          handleInputChange={handleInputChange}
        />
      )}

      {/* Edit Certificate Type Modal */}
      {showEditModal && (
        <CertificateTypeModal
          title="Edit Certificate Type"
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleUpdateType}
          onClose={() => {
            setShowEditModal(false);
            setSelectedType(null);
            resetForm();
          }}
          handleInputChange={handleInputChange}
        />
      )}
    </div>
  );
};

// Certificate Type Modal Component
const CertificateTypeModal = ({
  title,
  formData,
  setFormData,
  onSubmit,
  onClose,
  handleInputChange
}) => {
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">{title}</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={onSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Certificate Type Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Certificate of Indigency"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Processing Fee (₱)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.fee}
                  onChange={(e) => handleInputChange('fee', parseFloat(e.target.value))}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Validity Period (Days)</label>
                <input
                  type="number"
                  min="1"
                  value={formData.validity_days}
                  onChange={(e) => handleInputChange('validity_days', parseInt(e.target.value))}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="365"
                />
              </div>

              <div className="flex items-center pt-6">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => handleInputChange('is_active', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                  Active Certificate Type
                </label>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Brief description of what this certificate is for"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Purpose</label>
                <input
                  type="text"
                  value={formData.purpose}
                  onChange={(e) => handleInputChange('purpose', e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="What does this certificate prove?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">When Needed</label>
                <input
                  type="text"
                  value={formData.when_needed}
                  onChange={(e) => handleInputChange('when_needed', e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="When is this certificate typically required?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Required Data (one per line)</label>
                <textarea
                  rows={5}
                  value={formData.required_data}
                  onChange={(e) => handleInputChange('required_data', e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="List the data points required for this certificate:&#10;Valid ID&#10;Proof of Residency&#10;Birth Certificate"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700"
              >
                {title.includes('Create') ? 'Create Certificate Type' : 'Update Certificate Type'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CertificateTypes;
