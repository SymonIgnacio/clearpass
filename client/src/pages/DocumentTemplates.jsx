/**
 * Document Templates Management Page
 * Allows admins to customize document templates
 */

import React, { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';

const DocumentTemplates = ({ user }) => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState({
    template_name: '',
    document_type: 'barangay_clearance',
    template_content: {
      title: '',
      header_text: '',
      main_content: '',
      footer_text: '',
      signature_text: '',
      validity_text: '',
      location: '',
      show_qr_code: true,
      show_control_number: true,
      font_family: 'Times-Roman',
      font_size: 12
    },
    is_active: true
  });
  const [stats, setStats] = useState(null);

  // Document type options (loaded from API)
  const [documentTypes, setDocumentTypes] = useState([]);

  useEffect(() => {
    loadCertificateTypes();
    loadTemplates();
    loadStats();
  }, []);

  const loadCertificateTypes = async () => {
    try {
      const response = await apiRequest('certificate-types');
      const data = await response.json();
      setDocumentTypes(data.data || []);
    } catch (error) {
      console.error('Error loading certificate types:', error);
      // Keep existing types as fallback
    }
  };

  const loadTemplates = async () => {
    try {
      const response = await apiRequest('templates');
      const data = await response.json();
      setTemplates(data.data || []);
    } catch (error) {
      console.error('Error loading templates:', error);
      alert('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await apiRequest('templates/stats');
      const data = await response.json();
      setStats(data.data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleCreateTemplate = async (e) => {
    e.preventDefault();
    try {
      const response = await apiRequest('templates', { method: 'POST', body: formData });
      await response.json();
      alert('Template created successfully');
      setShowCreateModal(false);
      resetForm();
      loadTemplates();
      loadStats();
    } catch (error) {
      console.error('Error creating template:', error);
      alert(error.response?.data?.message || 'Failed to create template');
    }
  };

  const handleUpdateTemplate = async (e) => {
    e.preventDefault();
    try {
      const response = await apiRequest(`templates/${selectedTemplate.id}`, { method: 'PUT', body: formData });
      await response.json();
      alert('Template updated successfully');
      setShowEditModal(false);
      setSelectedTemplate(null);
      resetForm();
      loadTemplates();
    } catch (error) {
      console.error('Error updating template:', error);
      alert(error.response?.data?.message || 'Failed to update template');
    }
  };

  const handleDeleteTemplate = async (templateId, templateName) => {
    if (!window.confirm(`Are you sure you want to delete "${templateName}"?`)) {
      return;
    }

    try {
      const response = await apiRequest(`templates/${templateId}`, { method: 'DELETE' });
      await response.json();
      alert('Template deleted successfully');
      loadTemplates();
      loadStats();
    } catch (error) {
      console.error('Error deleting template:', error);
      alert(error.response?.data?.message || 'Failed to delete template');
    }
  };

  const handleDuplicateTemplate = async (templateId) => {
    const newName = prompt('Enter new template name:');
    if (!newName) return;

    try {
      const response = await apiRequest(`templates/${templateId}/duplicate`, {
        method: 'POST',
        body: { new_template_name: newName }
      });
      await response.json();
      alert('Template duplicated successfully');
      loadTemplates();
      loadStats();
    } catch (error) {
      console.error('Error duplicating template:', error);
      alert(error.response?.data?.message || 'Failed to duplicate template');
    }
  };

  const handleEditTemplate = (template) => {
    setSelectedTemplate(template);
    setFormData({
      template_name: template.template_name,
      document_type: template.document_type,
      template_content: { ...template.template_content },
      is_active: template.is_active
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      template_name: '',
      document_type: 'barangay_clearance',
      template_content: {
        title: '',
        header_text: '',
        main_content: '',
        footer_text: '',
        signature_text: '',
        validity_text: '',
        location: '',
        show_qr_code: true,
        show_control_number: true,
        font_family: 'Times-Roman',
        font_size: 12
      },
      is_active: true
    });
  };

  const handleContentChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      template_content: {
        ...prev.template_content,
        [field]: value
      }
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
            <h1 className="text-3xl font-bold text-gray-900">Document Templates</h1>
            <p className="text-gray-600 mt-2">Customize document layouts and content</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Template
          </button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-gray-600">Total Templates</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
              <div className="text-gray-600">Active Templates</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-2xl font-bold text-red-600">{stats.inactive}</div>
              <div className="text-gray-600">Inactive Templates</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-2xl font-bold text-purple-600">{stats.by_type?.length || 0}</div>
              <div className="text-gray-600">Document Types</div>
            </div>
          </div>
        )}
      </div>

      {/* Templates List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Templates</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Template Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Document Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Updated
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {templates.map((template) => (
                <tr key={template.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {template.template_name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {documentTypes.find(dt => dt.value === template.document_type)?.label || template.document_type}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      template.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {template.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(template.updated_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleEditTemplate(template)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDuplicateTemplate(template.id)}
                        className="text-purple-600 hover:text-purple-900"
                      >
                        Duplicate
                      </button>
                      {!template.template_name.startsWith('Default ') && (
                        <button
                          onClick={() => handleDeleteTemplate(template.id, template.template_name)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {templates.length === 0 && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No templates</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new template.</p>
          </div>
        )}
      </div>

      {/* Create Template Modal */}
      {showCreateModal && (
        <TemplateModal
          title="Create New Template"
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleCreateTemplate}
          onClose={() => {
            setShowCreateModal(false);
            resetForm();
          }}
          handleContentChange={handleContentChange}
          documentTypes={documentTypes}
        />
      )}

      {/* Edit Template Modal */}
      {showEditModal && (
        <TemplateModal
          title="Edit Template"
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleUpdateTemplate}
          onClose={() => {
            setShowEditModal(false);
            setSelectedTemplate(null);
            resetForm();
          }}
          handleContentChange={handleContentChange}
          documentTypes={documentTypes}
        />
      )}
    </div>
  );
};

// Template Modal Component
const TemplateModal = ({
  title,
  formData,
  setFormData,
  onSubmit,
  onClose,
  handleContentChange,
  documentTypes
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
                <label className="block text-sm font-medium text-gray-700">Template Name</label>
                <input
                  type="text"
                  required
                  value={formData.template_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, template_name: e.target.value }))}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Document Type</label>
                <select
                  value={formData.document_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, document_type: e.target.value }))}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  {documentTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Font Family</label>
                <select
                  value={formData.template_content.font_family}
                  onChange={(e) => handleContentChange('font_family', e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Times-Roman">Times Roman</option>
                  <option value="Helvetica">Helvetica</option>
                  <option value="Courier">Courier</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Font Size</label>
                <input
                  type="number"
                  min="8"
                  max="24"
                  value={formData.template_content.font_size}
                  onChange={(e) => handleContentChange('font_size', parseInt(e.target.value))}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                  Active Template
                </label>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Document Title</label>
                <input
                  type="text"
                  value={formData.template_content.title}
                  onChange={(e) => handleContentChange('title', e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., BARANGAY CLEARANCE"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Header Text</label>
                <textarea
                  rows={2}
                  value={formData.template_content.header_text}
                  onChange={(e) => handleContentChange('header_text', e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Text that appears at the top of the document"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Main Content</label>
                <textarea
                  rows={4}
                  value={formData.template_content.main_content}
                  onChange={(e) => handleContentChange('main_content', e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Main body text. Use {resident_name}, {address}, etc. for dynamic content"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Footer Text</label>
                <textarea
                  rows={3}
                  value={formData.template_content.footer_text}
                  onChange={(e) => handleContentChange('footer_text', e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Additional text before signatures"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Signature Text</label>
                  <input
                    type="text"
                    value={formData.template_content.signature_text}
                    onChange={(e) => handleContentChange('signature_text', e.target.value)}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Given this {issued_date}"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Validity Text</label>
                  <input
                    type="text"
                    value={formData.template_content.validity_text}
                    onChange={(e) => handleContentChange('validity_text', e.target.value)}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Valid until: {valid_until}"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Location</label>
                <input
                  type="text"
                  value={formData.template_content.location}
                  onChange={(e) => handleContentChange('location', e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Barangay Batia, Bocaue, Bulacan"
                />
              </div>

              <div className="flex gap-6">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="show_qr_code"
                    checked={formData.template_content.show_qr_code}
                    onChange={(e) => handleContentChange('show_qr_code', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="show_qr_code" className="ml-2 block text-sm text-gray-900">
                    Show QR Code
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="show_control_number"
                    checked={formData.template_content.show_control_number}
                    onChange={(e) => handleContentChange('show_control_number', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="show_control_number" className="ml-2 block text-sm text-gray-900">
                    Show Control Number
                  </label>
                </div>
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
                {title.includes('Create') ? 'Create Template' : 'Update Template'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DocumentTemplates;
