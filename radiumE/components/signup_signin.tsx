"use client";
import React, { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";
import { GoogleLogin, googleLogout, CredentialResponse } from '@react-oauth/google';
import { useLogin, useRegister, usePatchProfile } from "../lib/hooks/useAuth";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  IconBrandGoogle,
} from "@tabler/icons-react";
import { useYearChoices, useDepartmentChoices } from "@/lib/api/choices";

interface AuthFormData {
  username: string;
  email: string;
  rollno?: string;
  department?: string;
  year?: string;
  phone_number?: string;
  display_name?: string;
  gender?: string;
  degree?: string;
  first_name?: string;
  last_name?: string;
  password: string;
  password2?: string;
  isVerified: boolean;
  googleCredential?: string;
}



export default function AuthForm() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState<AuthFormData>({
    username: '',
    email: '',
    password: '',
    password2: '',
    isVerified: false,
  });
  const [isGoogleVerified, setIsGoogleVerified] = useState(false);
  const [isDepartmentModalOpen, setIsDepartmentModalOpen] = useState(false);
  const [isDegreeModalOpen, setIsDegreeModalOpen] = useState(false);
  const [tempCustomDepartment, setTempCustomDepartment] = useState('');
  const [tempCustomDegree, setTempCustomDegree] = useState('');
  const [authError, setAuthError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [googleEmail, setGoogleEmail] = useState<string>('');

  // API hooks
  const loginMutation = useLogin();
  const registerMutation = useRegister();
  const patchProfileMutation = usePatchProfile();
  
  // Fetch dynamic choices
  const { years, loading: yearsLoading } = useYearChoices();
  const { departments: dynamicDepartments, loading: deptsLoading } = useDepartmentChoices();

  // Validate Google email match when email changes
  useEffect(() => {
    if (googleEmail && formData.email && isGoogleVerified) {
      if (formData.email.toLowerCase() !== googleEmail.toLowerCase()) {
        setAuthError('The email address from Google Login does not match the email you entered. Please use the same email for both.');
        setIsGoogleVerified(false);
        setFormData(prev => ({
          ...prev,
          isVerified: false,
          googleCredential: undefined
        }));
      } else {
        // Clear error if emails match again
        if (authError.includes('Google Login does not match')) {
          setAuthError('');
        }
      }
    }
  }, [formData.email, googleEmail, isGoogleVerified, authError]);

  // Degree options (keeping this hardcoded as it's not dynamic in backend)
  const degrees = [
    'B.Tech', 'B.E', 'M.Tech', 'M.E', 'MBA', 'Ph.D'
  ];

  // Function to decode JWT token
  const decodeJWT = (token: string) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error decoding JWT:', error);
      return null;
    }
  };

  const handleGoogleSuccess = (credentialResponse: CredentialResponse) => {
    console.log('Google Login Success:', credentialResponse);

    if (credentialResponse.credential) {
      // Decode the JWT token to get user info
      const decodedToken = decodeJWT(credentialResponse.credential);
      console.log('Decoded Google token:', decodedToken);

      if (decodedToken && decodedToken.email) {
        const googleUserEmail = decodedToken.email;
        setGoogleEmail(googleUserEmail);

        // Check if the email from Google matches the email in the form
        if (formData.email && formData.email.toLowerCase() !== googleUserEmail.toLowerCase()) {
          setAuthError('The email address from Google Login does not match the email you entered. Please use the same email for both.');
          setIsGoogleVerified(false);
          setFormData(prev => ({
            ...prev,
            isVerified: false,
            googleCredential: undefined
          }));
          return;
        }

        // Emails match, proceed with verification
        setIsGoogleVerified(true);
        setFormData(prev => ({
          ...prev,
          isVerified: true,
          googleCredential: credentialResponse.credential
        }));

        // Clear any previous auth error related to email mismatch
        if (authError.includes('Google Login does not match')) {
          setAuthError('');
        }

        console.log('User verified with Google Login - emails match');
      } else {
        setAuthError('Failed to decode Google Login token. Please try again.');
        setIsGoogleVerified(false);
        setFormData(prev => ({
          ...prev,
          isVerified: false,
          googleCredential: undefined
        }));
      }
    }
  };

  const handleGoogleError = () => {
    console.log('Google Login Failed');
    setIsGoogleVerified(false);
    setFormData(prev => ({
      ...prev,
      isVerified: false,
      googleCredential: undefined
    }));
  };

  const handleLogout = () => {
    googleLogout();
    setIsGoogleVerified(false);
    setGoogleEmail('');
    setFormData(prev => ({
      ...prev,
      isVerified: false,
      googleCredential: undefined
    }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { id, value } = e.target;

    if (id === 'department' && value === 'others') {
      // Open modal for custom department input
      setTempCustomDepartment('');
      setIsDepartmentModalOpen(true);
    } else if (id === 'degree' && value === 'other') {
      // Open modal for custom degree input
      setTempCustomDegree('');
      setIsDegreeModalOpen(true);
    } else {
      setFormData(prev => ({
        ...prev,
        [id]: value
      }));
    }
  };

  const handleCustomDepartmentSave = () => {
    if (tempCustomDepartment.trim()) {
      setFormData(prev => ({
        ...prev,
        department: tempCustomDepartment.trim()
      }));
      setIsDepartmentModalOpen(false);
      setTempCustomDepartment('');
    }
  };

  const handleCustomDepartmentCancel = () => {
    setIsDepartmentModalOpen(false);
    setTempCustomDepartment('');
  };

  const handleCustomDegreeSave = () => {
    if (tempCustomDegree.trim()) {
      setFormData(prev => ({
        ...prev,
        degree: tempCustomDegree.trim()
      }));
      setIsDegreeModalOpen(false);
      setTempCustomDegree('');
    }
  };

  const handleCustomDegreeCancel = () => {
    setIsDegreeModalOpen(false);
    setTempCustomDegree('');
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setAuthError('');

    try {
      if (isSignUp) {
        // Step 1: Register user with username, email, password1, password2
        if (!formData.username || !formData.email || !formData.password || !formData.password2 || !formData.first_name || !formData.last_name) {
          setAuthError('Please fill in all required fields');
          setIsLoading(false);
          return;
        }

        if (formData.password !== formData.password2) {
          setAuthError('Passwords do not match');
          setIsLoading(false);
          return;
        }

        // Google Login verification is mandatory for signup
        if (!isGoogleVerified || !formData.isVerified || !formData.googleCredential) {
          setAuthError('Google Login verification is required. Please verify your email with Google before signing up.');
          setIsLoading(false);
          return;
        }

        // Validate Google Login email match
        if (googleEmail && formData.email && googleEmail.toLowerCase() !== formData.email.toLowerCase()) {
          setAuthError('The email address from Google Login does not match the email you entered. Please use the same email for both.');
          setIsLoading(false);
          return;
        }

        // Step 1: Register user (this also authenticates the user with a key token)
        console.log('Step 1: Registering user...');
        await registerMutation.mutateAsync({
          username: formData.username,
          email: formData.email,
          password1: formData.password,
          password2: formData.password2,
          first_name: formData.first_name,
          last_name: formData.last_name
        });

        console.log('Registration successful! User is now authenticated.');

        // Step 2: Build profile data with additional fields
        const profileData: Record<string, string | boolean> = {};
        if (formData.rollno) profileData.rollno = formData.rollno;
        if (formData.department) profileData.department = formData.department;
        if (formData.phone_number) profileData.phone_number = formData.phone_number;
        if (formData.display_name) profileData.display_name = formData.display_name;
        if (formData.gender) profileData.gender = formData.gender;
        if (formData.degree) profileData.degree = formData.degree;
        if (formData.year) profileData.year = formData.year;

        // If user verified with Google Login in frontend, mark as verified
        if (formData.isVerified && formData.googleCredential) {
          profileData.is_verified = true;
          console.log('User verified with Google Login - setting is_verified to true');
        }

        // Step 3: Update profile if there's any additional data
        if (Object.keys(profileData).length > 0) {
          console.log('Step 2: Updating profile with additional data:', profileData);

          try {
            await patchProfileMutation.mutateAsync(profileData);
            console.log('Profile updated successfully');
          } catch (profileError) {
            console.error('Profile update failed:', profileError);
            // Don't fail the entire registration if profile update fails
            // User can update profile later
            console.warn('Profile update failed, but user is registered and authenticated. They can update profile later.');
          }
        }

        // Registration and profile update complete, redirect to home
        console.log('Registration flow complete, redirecting to home');
        router.push('/');

      } else {
        // Login: username (or email) and password
        if (!formData.username || !formData.password) {
          setAuthError('Please enter username and password');
          setIsLoading(false);
          return;
        }

        // Call login API
        await loginMutation.mutateAsync({
          username: formData.username,
          password: formData.password
        });

        // Login successful, redirect
        router.push('/');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setAuthError(`${isSignUp ? 'Registration' : 'Login'} failed: ${errorMessage}`);
      console.error('Auth error:', error);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="shadow-input mx-auto w-full max-w-md rounded-none bg-white p-4 md:rounded-2xl md:p-2 dark:bg-black text-center">
      <div className="flex justify-center mb-4">
        <Image
          src="/radiumLogo.png"
          alt="Radium Logo"
          width={64}
          height={64}
          className="h-16 w-auto"
        />
      </div>
      <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-200">
        {isSignUp ? 'DEVS Radium Login' : 'DEVS Radium Login'}
      </h2>
      {/* <p className="mt-2 max-w-sm text-sm text-neutral-600 dark:text-neutral-300">
        {isSignUp 
          ? 'Create your account to get started with Radium'
          : 'Sign in to your Radium account'
        }
      </p> */}

      <form className="my-8 text-start" onSubmit={handleSubmit}>
        {isSignUp && (
          <LabelInputContainer className="mb-4">
            <Label htmlFor="username">Username *</Label>
            <Input
              id="username"
              placeholder="johndoe"
              type="text"
              onChange={handleInputChange}
              value={formData.username}
              required
            />
          </LabelInputContainer>
        )}
        {isSignUp && (
          <div className="mb-4 flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-2">
            <LabelInputContainer>
              <Label htmlFor="first_name">First Name *</Label>
              <Input
                id="first_name"
                placeholder="John"
                type="text"
                onChange={handleInputChange}
                value={formData.first_name || ''}
                required
              />
            </LabelInputContainer>
            <LabelInputContainer>
              <Label htmlFor="last_name">Last Name *</Label>
              <Input
                id="last_name"
                placeholder="Doe"
                type="text"
                onChange={handleInputChange}
                value={formData.last_name || ''}
                required
              />
            </LabelInputContainer>
          </div>
        )}
        <LabelInputContainer className="mb-4">
          <Label htmlFor={isSignUp ? "email" : "username"}>{isSignUp ? "Email Address *" : "Username *"}</Label>
          <Input
            id={isSignUp ? "email" : "username"}
            placeholder={isSignUp ? "brucewayne@rajalakshmi.edu.in" : "johndoe"}
            type={isSignUp ? "email" : "text"}
            onChange={handleInputChange}
            value={isSignUp ? formData.email : formData.username}
            required
          />
        </LabelInputContainer>
        {isSignUp && (
          <div className="mb-4 flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-2">
            <LabelInputContainer>
              <Label htmlFor="rollno">Roll Number</Label>
              <Input
                id="rollno"
                placeholder="241901059"
                type="text"
                onChange={handleInputChange}
                value={formData.rollno || ''}
              />
            </LabelInputContainer>
            <LabelInputContainer>
              <Label htmlFor="department">Department</Label>
              <Select
                id="department"
                onChange={handleSelectChange}
                value={formData.department || ''}
                disabled={deptsLoading}
              >
                <option value="">{deptsLoading ? 'Loading...' : 'Select Department'}</option>
                {dynamicDepartments.map((dept) => (
                  <option key={dept.code} value={dept.code}>
                    {dept.full_name}
                  </option>
                ))}
                {formData.department && !dynamicDepartments.find(d => d.code === formData.department) && (
                  <option value={formData.department}>
                    {formData.department} (Custom)
                  </option>
                )}
                <option value="others">Others</option>
              </Select>
            </LabelInputContainer>
            <LabelInputContainer>
              <Label htmlFor="degree">Degree</Label>
              <Select
                id="degree"
                onChange={handleSelectChange}
                value={formData.degree || ''}
              >
                <option value="">Select Degree</option>
                {degrees.map((deg) => (
                  <option key={deg} value={deg}>
                    {deg}
                  </option>
                ))}
                {formData.degree && !degrees.includes(formData.degree) && (
                  <option value={formData.degree}>
                    {formData.degree} (Custom)
                  </option>
                )}
                <option value="other">Other</option>
              </Select>
            </LabelInputContainer>
            <LabelInputContainer>
              <Label htmlFor="year">Year</Label>
              <Select
                id="year"
                onChange={handleSelectChange}
                value={formData.year || ''}
                disabled={yearsLoading}
              >
                <option value="">{yearsLoading ? 'Loading...' : 'Select Year'}</option>
                {years.map((year) => (
                  <option key={year.code} value={year.code}>
                    {year.display_name}
                  </option>
                ))}
              </Select>
            </LabelInputContainer>
          </div>
        )}
        {isSignUp && (<LabelInputContainer className="mb-4">
          <Label htmlFor="phone_number">Phone Number</Label>
          <Input
            id="phone_number"
            placeholder="+919876543210"
            type="tel"
            onChange={handleInputChange}
            value={formData.phone_number || ''}
          />
        </LabelInputContainer>
        )}
        <LabelInputContainer className="mb-4">
          <Label htmlFor="password">Password *</Label>
          <Input
            id="password"
            placeholder="••••••••"
            type="password"
            onChange={handleInputChange}
            value={formData.password}
            required
          />
        </LabelInputContainer>
        {isSignUp && (
          <LabelInputContainer className="mb-8">
            <Label htmlFor="password2">Confirm Password *</Label>
            <Input
              id="password2"
              placeholder="••••••••"
              type="password"
              onChange={handleInputChange}
              value={formData.password2 || ''}
              required
            />
          </LabelInputContainer>
        )}

        {/* Google Login Verification Section */}
        {isSignUp && (
          <div className="mb-6 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Verify your account with Google <span className="text-red-500">*</span>
            </h3>
            {!isGoogleVerified ? (
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                useOneTap={false}
                theme="outline"
              />
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <IconBrandGoogle className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-600 dark:text-green-400">
                      ✓ Verified with Google
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="text-xs text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                  >
                    Remove verification
                  </button>
                </div>
                {googleEmail && (
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Verified email: {googleEmail}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Error Display */}
        {authError && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <p className="text-sm text-red-600 dark:text-red-400">{authError}</p>
          </div>
        )}



        <button
          className="group/btn relative block h-10 w-full rounded-md bg-gradient-to-br from-white to-neutral-200 font-medium text-white shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] dark:bg-zinc-800 dark:from-zinc-900 dark:to-zinc-900 dark:shadow-[0px_1px_0px_0px_#27272a_inset,0px_-1px_0px_0px_#27272a_inset] disabled:opacity-50 disabled:cursor-not-allowed"
          type="submit"
          disabled={isLoading}
        >
          {isSignUp ? (
            isLoading ? 'Creating account...' : 'Sign up'
          ) : (
            isLoading ? 'Signing in...' : 'Sign in'
          )} &rarr;
          <BottomGradient />
        </button>

        {/* Alternative Login Section */}
        {/* <div className="my-8 h-[1px] w-full bg-gradient-to-r from-transparent via-neutral-300 to-transparent dark:via-neutral-700" />

        <div className="flex flex-col space-y-4">
          <button
            className="group/btn shadow-input relative flex h-10 w-full items-center justify-start space-x-2 rounded-md bg-gray-50 px-4 font-medium text-black dark:bg-zinc-900 dark:shadow-[0px_0px_1px_1px_#262626]"
            type="button"
          >
            <IconBrandGithub className="h-4 w-4 text-neutral-800 dark:text-neutral-300" />
            <span className="text-sm text-neutral-700 dark:text-neutral-300">
              {isSignUp ? 'Sign up with GitHub' : 'Sign in with GitHub'}
            </span>
            <BottomGradient />
          </button>
          
          {!isSignUp && (
            <button
              className="group/btn shadow-input relative flex h-10 w-full items-center justify-start space-x-2 rounded-md bg-gray-50 px-4 font-medium text-black dark:bg-zinc-900 dark:shadow-[0px_0px_1px_1px_#262626]"
              type="button"
            >
              <IconBrandGoogle className="h-4 w-4 text-neutral-800 dark:text-neutral-300" />
              <span className="text-sm text-neutral-700 dark:text-neutral-300">
                Sign in with Google
              </span>
              <BottomGradient />
            </button>
          )}
        </div> */}

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-sm text-neutral-600 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200"
          >
            {isSignUp
              ? 'Already have an account? Sign in'
              : "Don't have an account? Sign up"
            }
          </button>
        </div>

        {!isSignUp && (
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => router.push('/forgot-password')}
              className="text-sm text-neutral-500 hover:text-neutral-700 dark:text-neutral-500 dark:hover:text-neutral-300"
            >
              Forgot your password?
            </button>
          </div>
        )}

      </form>

      {/* Custom Department Modal */}
      <Modal
        isOpen={isDepartmentModalOpen}
        onClose={handleCustomDepartmentCancel}
        title="Enter Custom Department"
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="customDepartment">Department Name</Label>
            <Input
              id="customDepartment"
              placeholder="Enter your department"
              type="text"
              value={tempCustomDepartment}
              onChange={(e) => setTempCustomDepartment(e.target.value)}
              autoFocus
            />
          </div>
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleCustomDepartmentCancel}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCustomDepartmentSave}
              disabled={!tempCustomDepartment.trim()}
              className="px-4 py-2 bg-black text-white text-sm rounded hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-white dark:text-black dark:hover:bg-gray-200"
            >
              Save
            </button>
          </div>
        </div>
      </Modal>

      {/* Custom Degree Modal */}
      <Modal
        isOpen={isDegreeModalOpen}
        onClose={handleCustomDegreeCancel}
        title="Enter Custom Degree"
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="customDegree">Degree Name</Label>
            <Input
              id="customDegree"
              placeholder="Enter your degree (e.g., B.Sc, M.Tech)"
              type="text"
              value={tempCustomDegree}
              onChange={(e) => setTempCustomDegree(e.target.value)}
              autoFocus
            />
          </div>
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleCustomDegreeCancel}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCustomDegreeSave}
              disabled={!tempCustomDegree.trim()}
              className="px-4 py-2 bg-black text-white text-sm rounded hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-white dark:text-black dark:hover:bg-gray-200"
            >
              Save
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

const BottomGradient = () => {
  return (
    <>
      <span className="absolute inset-x-0 -bottom-px block h-px w-full bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-0 transition duration-500 group-hover/btn:opacity-100" />
      <span className="absolute inset-x-10 -bottom-px mx-auto block h-px w-1/2 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-0 blur-sm transition duration-500 group-hover/btn:opacity-100" />
    </>
  );
};

const LabelInputContainer = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={cn("flex w-full flex-col space-y-2", className)}>
      {children}
    </div>
  );
};
