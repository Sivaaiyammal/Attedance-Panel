import React, { useState, useEffect } from 'react';
import { Building2, Plus, Edit2, Trash2, Save, X, AlertCircle, CheckCircle } from 'lucide-react';
import { Party } from '../types';
import { apiService } from '../services/api';

const PartyManagement: React.FC = () => {
  const [parties, setParties] = useState<Party[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingParty, setEditingParty] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  useEffect(() => {
    loadParties();
  }, []);

  const loadParties = async () => {
    try {
      setLoading(true);
      const partiesData = await apiService.getAllParties();
      setParties(partiesData);
    } catch (error) {
      console.error('Failed to load parties:', error);
      setError('Failed to load parties');
    } finally {
      setLoading(false);
    }
  };

  const handleAddParty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Party name is required');
      return;
    }

    try {
      setError('');
      await apiService.createParty(formData.name.trim(), formData.description.trim());
      setSuccess('Party created successfully');
      setFormData({ name: '', description: '' });
      setShowAddForm(false);
      await loadParties();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Failed to create party:', error);
      setError('Failed to create party. It may already exist.');
    }
  };

  const handleEditParty = async (party: Party) => {
    if (!formData.name.trim()) {
      setError('Party name is required');
      return;
    }

    try {
      setError('');
      await apiService.updateParty(party._id, formData.name.trim(), formData.description.trim(), party.isActive);
      setSuccess('Party updated successfully');
      setEditingParty(null);
      setFormData({ name: '', description: '' });
      await loadParties();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Failed to update party:', error);
      setError('Failed to update party. Name may already exist.');
    }
  };

  const handleDeleteParty = async (partyId: string) => {
    if (!confirm('Are you sure you want to delete this party? This action cannot be undone.')) {
      return;
    }

    try {
      setError('');
      await apiService.deleteParty(partyId);
      setSuccess('Party deleted successfully');
      await loadParties();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Failed to delete party:', error);
      setError('Failed to delete party');
    }
  };

  const startEdit = (party: Party) => {
    setEditingParty(party._id);
    setFormData({
      name: party.name,
      description: party.description
    });
    setShowAddForm(false);
  };

  const cancelEdit = () => {
    setEditingParty(null);
    setFormData({ name: '', description: '' });
    setError('');
  };

  const startAdd = () => {
    setShowAddForm(true);
    setEditingParty(null);
    setFormData({ name: '', description: '' });
    setError('');
  };

  const cancelAdd = () => {
    setShowAddForm(false);
    setFormData({ name: '', description: '' });
    setError('');
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 sm:p-8 text-center shadow-lg border border-white/20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading parties...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0 mb-6 sm:mb-8">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Party Management</h2>
          <p className="text-sm sm:text-base text-gray-600">Create and manage party names for attendance tracking</p>
        </div>
        
        <button
          onClick={startAdd}
          disabled={showAddForm}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" />
          <span>Add Party</span>
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start space-x-2 text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span className="text-sm">{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start space-x-2 text-green-700">
            <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span className="text-sm">{success}</span>
          </div>
        </div>
      )}

      {/* Add Form */}
      {showAddForm && (
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Party</h3>
          <form onSubmit={handleAddParty} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Party Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                placeholder="Enter party name"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                placeholder="Enter description (optional)"
                rows={3}
              />
            </div>
            
            <div className="flex space-x-3">
              <button
                type="submit"
                className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors duration-200"
              >
                <Save className="w-4 h-4" />
                <span>Save Party</span>
              </button>
              
              <button
                type="button"
                onClick={cancelAdd}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors duration-200"
              >
                <X className="w-4 h-4" />
                <span>Cancel</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Parties List */}
      <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 overflow-hidden">
        {parties.length === 0 ? (
          <div className="p-6 sm:p-8 text-center">
            <Building2 className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-base sm:text-lg">No parties found</p>
            <p className="text-sm text-gray-400 mt-2">Create your first party to get started</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {parties.map((party) => (
              <div key={party._id} className="p-4 sm:p-6">
                {editingParty === party._id ? (
                  <form onSubmit={(e) => { e.preventDefault(); handleEditParty(party); }} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Party Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                        rows={3}
                      />
                    </div>
                    
                    <div className="flex space-x-3">
                      <button
                        type="submit"
                        className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors duration-200"
                      >
                        <Save className="w-4 h-4" />
                        <span>Save</span>
                      </button>
                      
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="flex items-center space-x-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors duration-200"
                      >
                        <X className="w-4 h-4" />
                        <span>Cancel</span>
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                          {party.name}
                        </h3>
                        {party.description && (
                          <p className="text-sm text-gray-600 mt-1 truncate">{party.description}</p>
                        )}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 mt-1 space-y-1 sm:space-y-0">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            party.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {party.isActive ? 'Active' : 'Inactive'}
                          </span>
                          <span className="text-xs text-gray-500">
                            Created by {party.createdBy.name}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <button
                        onClick={() => startEdit(party)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                        title="Edit party"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => handleDeleteParty(party._id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                        title="Delete party"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PartyManagement;