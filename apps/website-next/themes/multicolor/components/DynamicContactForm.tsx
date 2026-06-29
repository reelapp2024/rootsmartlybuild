'use client';

import React, { useState, useEffect } from 'react';
import { httpFile } from "@/config";

interface FormField {
  _id: string;
  name: string;
  label: string;
  type: string;
  required: boolean;
  placeholder?: string;
  options?: string[];
}

interface DynamicForm {
  _id: string;
  projectId: string;
  name: string;
  fields: FormField[];
  isEnabled: boolean;
}

interface DynamicContactFormProps {
  projectId: string;
  colors?: any;
  onSuccess?: () => void;
  className?: string;
}

export const DynamicContactForm: React.FC<DynamicContactFormProps> = ({
  projectId,
  colors,
  onSuccess,
  className = ""
}) => {
  const [form, setForm] = useState<DynamicForm | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    fetchForm();
  }, [projectId]);

  const fetchForm = async () => {
    try {
      const response = await httpFile.post("/admin/v1/fetch_dynamic_forms", {
        projectId
      });

      if (response.data?.data && response.data.data.length > 0) {
        const activeForm = response.data.data[0]; // Get the first (and only) enabled form
        setForm(activeForm);
        
        // Initialize form data with empty values
        const initialData: Record<string, any> = {};
        activeForm.fields.forEach((field: FormField) => {
          initialData[field.name] = '';
        });
        setFormData(initialData);
      }
    } catch (error) {
      console.error("Error fetching form:", error);
    }
  };

  const validateField = (field: FormField, value: any): string => {
    // Required field validation
    if (field.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
      return `${field.label} is required`;
    }

    // Email validation
    if (field.type === 'email' && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return 'Please enter a valid email address';
      }
    }

    // Phone validation (basic)
    if (field.type === 'tel' && value) {
      const phoneRegex = /^[\d\s\-\+\(\)]+$/;
      if (!phoneRegex.test(value) || value.replace(/\D/g, '').length < 10) {
        return 'Please enter a valid phone number';
      }
    }

    // Number validation
    if (field.type === 'number' && value !== '') {
      if (isNaN(Number(value))) {
        return 'Please enter a valid number';
      }
    }

    return '';
  };

  const handleInputChange = (field: FormField, value: any) => {
    setFormData(prev => ({ ...prev, [field.name]: value }));
    
    // Clear error for this field when user starts typing
    if (errors[field.name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field.name];
        return newErrors;
      });
    }
  };

  const handleFileChange = (field: FormField, file: File | null) => {
    setFormData(prev => ({ ...prev, [field.name]: file }));
    
    if (errors[field.name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field.name];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    if (!form) return false;

    const newErrors: Record<string, string> = {};
    
    form.fields.forEach(field => {
      const error = validateField(field, formData[field.name]);
      if (error) {
        newErrors[field.name] = error;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form || !validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    try {
      // Create FormData for file uploads
      const submitData = new FormData();
      submitData.append('formId', form._id);

      // Add all form fields
      form.fields.forEach(field => {
        const value = formData[field.name];
        
        if (field.type === 'file' && value instanceof File) {
          submitData.append(field.name, value);
        } else if (value !== undefined && value !== null && value !== '') {
          submitData.append(field.name, String(value));
        }
      });

      const response = await httpFile.post("/admin/v1/submit_form_data", submitData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.status === 201) {
        setSubmitSuccess(true);
        
        // Reset form
        const resetData: Record<string, any> = {};
        form.fields.forEach(field => {
          resetData[field.name] = '';
        });
        setFormData(resetData);

        // Call success callback
        if (onSuccess) {
          onSuccess();
        }

        // Hide success message after 5 seconds
        setTimeout(() => {
          setSubmitSuccess(false);
        }, 5000);
      }
    } catch (error: any) {
      console.error("Error submitting form:", error);
      setSubmitError(error.response?.data?.message || "Failed to submit form. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (field: FormField) => {
    const inputClasses = `w-full px-4 py-3 rounded-xl border ${
      errors[field.name] ? 'border-red-500' : 'border-gray-300'
    } focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-300 text-sm`;

    const inputStyle = colors ? {
      '--tw-ring-color': colors.primaryButton?.bg || '#3B82F6'
    } as React.CSSProperties : {};

    switch (field.type) {
      case 'textarea':
        return (
          <div key={field._id}>
            <label htmlFor={field.name} className="block text-xs font-semibold text-gray-700 mb-2">
              {field.label} {field.required && '*'}
            </label>
            <textarea
              id={field.name}
              name={field.name}
              value={formData[field.name] || ''}
              onChange={(e) => handleInputChange(field, e.target.value)}
              placeholder={field.placeholder}
              rows={4}
              className={`${inputClasses} resize-none`}
              style={inputStyle}
            />
            {errors[field.name] && (
              <p className="mt-1 text-xs text-red-600">{errors[field.name]}</p>
            )}
          </div>
        );

      case 'file':
        return (
          <div key={field._id}>
            <label htmlFor={field.name} className="block text-xs font-semibold text-gray-700 mb-2">
              {field.label} {field.required && '*'}
            </label>
            <input
              type="file"
              id={field.name}
              name={field.name}
              onChange={(e) => handleFileChange(field, e.target.files?.[0] || null)}
              className={inputClasses}
              style={inputStyle}
            />
            {errors[field.name] && (
              <p className="mt-1 text-xs text-red-600">{errors[field.name]}</p>
            )}
          </div>
        );

      case 'select':
        return (
          <div key={field._id}>
            <label htmlFor={field.name} className="block text-xs font-semibold text-gray-700 mb-2">
              {field.label} {field.required && '*'}
            </label>
            <select
              id={field.name}
              name={field.name}
              value={formData[field.name] || ''}
              onChange={(e) => handleInputChange(field, e.target.value)}
              className={inputClasses}
              style={inputStyle}
            >
              <option value="">Select an option</option>
              {field.options?.map((option, idx) => (
                <option key={idx} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {errors[field.name] && (
              <p className="mt-1 text-xs text-red-600">{errors[field.name]}</p>
            )}
          </div>
        );

      default:
        return (
          <div key={field._id}>
            <label htmlFor={field.name} className="block text-xs font-semibold text-gray-700 mb-2">
              {field.label} {field.required && '*'}
            </label>
            <input
              type={field.type}
              id={field.name}
              name={field.name}
              value={formData[field.name] || ''}
              onChange={(e) => handleInputChange(field, e.target.value)}
              placeholder={field.placeholder}
              className={inputClasses}
              style={inputStyle}
            />
            {errors[field.name] && (
              <p className="mt-1 text-xs text-red-600">{errors[field.name]}</p>
            )}
          </div>
        );
    }
  };

  if (!form) {
    return null; // Don't render anything if no form exists
  }

  return (
    <form onSubmit={handleSubmit} className={`space-y-5 ${className}`}>
      {/* Success Message */}
      {submitSuccess && (
        <div className="p-4 rounded-xl bg-green-50 border border-green-200">
          <p className="text-sm font-medium text-green-800">
            ✓ Thank you! Your message has been sent successfully.
          </p>
        </div>
      )}

      {/* Error Message */}
      {submitError && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200">
          <p className="text-sm font-medium text-red-800">{submitError}</p>
        </div>
      )}

      {/* Render dynamic fields */}
      {form.fields.map(field => renderField(field))}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-4 rounded-xl font-semibold text-white transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-lg"
        style={{
          backgroundColor: colors?.primaryButton?.bg || '#3B82F6',
          color: colors?.primaryButton?.text || '#FFFFFF'
        }}
      >
        {isSubmitting ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Sending...
          </span>
        ) : (
          'Send Message'
        )}
      </button>
    </form>
  );
};

export default DynamicContactForm;








