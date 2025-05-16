import React from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

interface LoginFormProps {
  onSubmit: (values: { email: string; password: string }) => void;
  onRegisterClick: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSubmit, onRegisterClick }) => {
  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
    },
    validationSchema: Yup.object({
      email: Yup.string().email('Invalid email address').required('Required'),
      password: Yup.string().required('Required'),
    }),
    onSubmit: async (values, { setStatus, setSubmitting }) => {
      setStatus(undefined);
      try {
        await onSubmit(values);
      } catch (error) {
        setStatus('Invalid email or password');
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
      className="w-full max-w-md mx-auto mt-8"
    >
      <Card>
        <form onSubmit={formik.handleSubmit}>
          <CardHeader>
            <CardTitle className="text-2xl text-center">Welcome Back</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {formik.status && (
              <div className="text-sm text-destructive text-center mb-2">{formik.status}</div>
            )}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.email}
                className={formik.touched.email && formik.errors.email ? 'border-destructive' : ''}
              />
              {formik.touched.email && formik.errors.email && (
                <div className="text-sm text-destructive">{formik.errors.email}</div>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.password}
                className={formik.touched.password && formik.errors.password ? 'border-destructive' : ''}
              />
              {formik.touched.password && formik.errors.password && (
                <div className="text-sm text-destructive">{formik.errors.password}</div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={formik.isSubmitting}>
              {formik.isSubmitting ? 'Signing in...' : 'Sign In'}
            </Button>
            <div className="text-center text-sm">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary hover:underline">
                Create Account
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </motion.div>
  );
};

export default LoginForm; 