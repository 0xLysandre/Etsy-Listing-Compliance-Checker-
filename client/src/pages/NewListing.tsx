import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { ArrowLeft, Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { listingsService } from '../services/listings.service';
import { getErrorMessage } from '../services/api';

const ETSY_CATEGORIES = [
  'Art & Collectibles',
  'Bags & Purses',
  'Bath & Beauty',
  'Books, Movies & Music',
  'Clothing',
  'Craft Supplies & Tools',
  'Electronics & Accessories',
  'Gifts',
  'Home & Living',
  'Jewelry',
  'Paper & Party Supplies',
  'Pet Supplies',
  'Shoes',
  'Toys & Games',
  'Weddings',
];

export default function NewListing() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    price: '',
    etsyUrl: '',
  });
  const [tags, setTags] = useState<string[]>([]);
  const [materials, setMaterials] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [materialInput, setMaterialInput] = useState('');

  const createMutation = useMutation({
    mutationFn: listingsService.createListing,
    onSuccess: (listing) => {
      toast.success('Listing created successfully!');
      navigate(`/listings/${listing.id}`);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.description || !formData.category) {
      toast.error('Please fill in all required fields');
      return;
    }

    createMutation.mutate({
      title: formData.title,
      description: formData.description,
      category: formData.category,
      price: parseFloat(formData.price) || 0,
      tags,
      materials,
      etsyUrl: formData.etsyUrl || undefined,
    });
  };

  const addTag = () => {
    if (tagInput.trim() && tags.length < 13) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  const addMaterial = () => {
    if (materialInput.trim()) {
      setMaterials([...materials, materialInput.trim()]);
      setMaterialInput('');
    }
  };

  const removeMaterial = (index: number) => {
    setMaterials(materials.filter((_, i) => i !== index));
  };

  return (
    <div className="mx-auto max-w-3xl">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Listings
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Add New Listing</h1>
        <p className="text-gray-500">
          Enter your listing details to check for policy compliance
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card p-6 space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="title" className="label">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              type="text"
              maxLength={140}
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="input"
              placeholder="Enter your listing title"
            />
            <p className="mt-1 text-xs text-gray-500">
              {formData.title.length}/140 characters
            </p>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="label">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              rows={6}
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="input resize-none"
              placeholder="Describe your item in detail..."
            />
          </div>

          {/* Category */}
          <div>
            <label htmlFor="category" className="label">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              id="category"
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
              className="input"
            >
              <option value="">Select a category</option>
              {ETSY_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Price */}
          <div>
            <label htmlFor="price" className="label">
              Price (USD)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                $
              </span>
              <input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
                className="input pl-7"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="label">Tags (up to 13)</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                className="input flex-1"
                placeholder="Add a tag"
              />
              <button
                type="button"
                onClick={addTag}
                disabled={tags.length >= 13}
                className="btn-secondary"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            {tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-sm"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(index)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <p className="mt-1 text-xs text-gray-500">{tags.length}/13 tags</p>
          </div>

          {/* Materials */}
          <div>
            <label className="label">Materials</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={materialInput}
                onChange={(e) => setMaterialInput(e.target.value)}
                onKeyPress={(e) =>
                  e.key === 'Enter' && (e.preventDefault(), addMaterial())
                }
                className="input flex-1"
                placeholder="Add a material"
              />
              <button
                type="button"
                onClick={addMaterial}
                className="btn-secondary"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            {materials.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {materials.map((material, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-sm"
                  >
                    {material}
                    <button
                      type="button"
                      onClick={() => removeMaterial(index)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Etsy URL */}
          <div>
            <label htmlFor="etsyUrl" className="label">
              Etsy Listing URL (optional)
            </label>
            <input
              id="etsyUrl"
              type="url"
              value={formData.etsyUrl}
              onChange={(e) =>
                setFormData({ ...formData, etsyUrl: e.target.value })
              }
              className="input"
              placeholder="https://www.etsy.com/listing/..."
            />
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="btn-primary"
          >
            {createMutation.isPending ? 'Creating...' : 'Create Listing'}
          </button>
        </div>
      </form>
    </div>
  );
}
