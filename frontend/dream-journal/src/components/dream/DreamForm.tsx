import React from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/card';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { dreamService } from '../../services/dreamService';
import { useAuth } from '../../context/AuthContext';

interface DreamFormProps {
  onSubmit?: (values: { text: string; public: boolean }) => void;
}

const DreamForm: React.FC<DreamFormProps> = ({ onSubmit }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const formik = useFormik({
    initialValues: {
      text: '',
      public: false,
    },
    validationSchema: Yup.object({
      text: Yup.string().required('Required'),
      public: Yup.boolean(),
    }),
    onSubmit: async (values, { setSubmitting, setErrors }) => {
      try {
        if (!user) {
          throw new Error('User not authenticated');
        }

        const dream = await dreamService.createDream({
          userId: user.id,
          text: values.text,
          public: values.public,
        });

        if (onSubmit) {
          onSubmit(values);
        }

        // Reset form and navigate to home
        formik.resetForm();
        navigate('/');
      } catch (error) {
        console.error('Failed to create dream:', error);
        setErrors({ text: 'Failed to create dream. Please try again.' });
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-2xl mx-auto"
    >
      <Card>
        <form onSubmit={formik.handleSubmit}>
          <CardHeader>
            <CardTitle className="text-2xl text-center">Record Your Dream</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="text" className="text-sm font-medium">
                Dream Description
              </label>
              <Textarea
                id="text"
                name="text"
                rows={6}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.text}
                className={formik.touched.text && formik.errors.text ? 'border-destructive' : ''}
                placeholder="Describe your dream..."
              />
              {formik.touched.text && formik.errors.text && (
                <div className="text-sm text-destructive">{formik.errors.text}</div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="public"
                name="public"
                onChange={formik.handleChange}
                checked={formik.values.public}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor="public" className="text-sm font-medium">
                Make this dream public
              </label>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/')}
              disabled={formik.isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={formik.isSubmitting}>
              {formik.isSubmitting ? 'Saving...' : 'Save Dream'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </motion.div>
  );
};

export default DreamForm; 