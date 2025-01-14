import React, { useState, useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { debounce } from 'lodash';

const ComplexForm = ({ fields, onSubmit, onValidate }) => {
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const [dependentFields, setDependentFields] = useState({});

  // Watch for dependent field changes
  useEffect(() => {
    const subscription = watch((value, { name, type }) => {
      if (fields.some(f => f.dependent === name)) {
        setDependentFields(prev => ({
          ...prev,
          [name]: value[name]
        }));
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, fields]);

  const validateField = useCallback(debounce((name, value) => {
    onValidate?.({ name, value });
  }, 300), [onValidate]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="complex-form">
      {fields.map(field => {
        const shouldShow = !field.dependent || dependentFields[field.dependent];
        
        return shouldShow && (
          <div key={field.id} className="form-field">
            {field.type === 'select' ? (
              <select
                {...register(field.id, {
                  required: field.validation.includes('required'),
                  validate: value => validateField(field.id, value)
                })}
              >
                <option value="">Select...</option>
                {/* Dynamic options would go here */}
              </select>
            ) : (
              <input
                type={field.validation.includes('email') ? 'email' : 'text'}
                {...register(field.id, {
                  required: field.validation.includes('required'),
                  pattern: field.validation.includes('email') 
                    ? /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i 
                    : undefined,
                  validate: value => validateField(field.id, value)
                })}
              />
            )}
            {errors[field.id] && (
              <span className="error">{errors[field.id].message}</span>
            )}
          </div>
        );
      })}
      <button type="submit">Submit</button>
    </form>
  );
};

export default ComplexForm;