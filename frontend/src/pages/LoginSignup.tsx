import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AxiosError } from 'axios';
import axiosInstance from '../api/axiosInstance';
import { LoginRequest, SignupRequest, LoginResponse, ApiError, SignupResponse, PossibleDateSlot } from '../types';

const LoginSignup = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Signup form state
  const [signupUsername, setSignupUsername] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupProgram, setSignupProgram] = useState('');
  const [signupDegree, setSignupDegree] = useState('');
  const [possibleDates, setPossibleDates] = useState<PossibleDateSlot[]>([]);
  
  const navigate = useNavigate();

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const loginData: LoginRequest = {
        email: loginEmail,
        password: loginPassword,
      };

      const response = await axiosInstance.post<LoginResponse>('/login', loginData);
      
      console.log('Login response:', response.data);
      
      // Backend returns user data directly in response.data
      if (response.data && response.data.user_id) {
        localStorage.setItem('user', JSON.stringify(response.data));
        localStorage.setItem('user_id', response.data.user_id);
        console.log('Redirecting to profile:', `/profile/${response.data.user_id}`);
        navigate(`/profile/${response.data.user_id}`);
      } else {
        console.error('Invalid response - no user_id:', response.data);
        setError('Invalid response from server');
      }
    } catch (err) {
      console.error('Login error:', err);
      if (err instanceof AxiosError) {
        if (err.response) {
          // Server responded with error status
          const errorData = err.response.data as ApiError;
          setError(errorData.error || `Login failed: ${err.response.status} ${err.response.statusText}`);
        } else if (err.request) {
          // Request was made but no response received
          setError('Cannot connect to server. Please check if the backend is running on http://localhost:8000');
        } else {
          // Error setting up request
          setError('Error setting up request. Please try again.');
        }
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const signupData: SignupRequest = {
        username: signupUsername,
        email: signupEmail,
        password: signupPassword,
        program: signupProgram,
        degree: signupDegree,
        possible_dates: possibleDates,
        profile: {},
      };

      const response = await axiosInstance.post<SignupResponse>('/signup', signupData);
      
      // Backend returns { message: "User created successfully" }
      if (response.data && response.data.message) {
        // After successful signup, switch to login mode and show success message
        setIsLogin(true);
        setError('');
        setLoginEmail(signupEmail); // Pre-fill email for convenience
        setSignupUsername('');
        setSignupEmail('');
        setSignupPassword('');
        setSignupProgram('');
        setSignupDegree('');
        setPossibleDates([]);
      }
    } catch (err) {
      console.error('Signup error:', err);
      if (err instanceof AxiosError) {
        if (err.response) {
          // Server responded with error status
          const errorData = err.response.data as ApiError;
          setError(errorData.error || `Signup failed: ${err.response.status} ${err.response.statusText}`);
        } else if (err.request) {
          // Request was made but no response received
          setError('Cannot connect to server. Please check if the backend is running on http://localhost:8000');
        } else {
          // Error setting up request
          setError('Error setting up request. Please try again.');
        }
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const addLocation = () => {
    setPossibleDates([...possibleDates, { location: '', slots: [] }]);
  };

  const removeLocation = (index: number) => {
    setPossibleDates(possibleDates.filter((_, i) => i !== index));
  };

  const updateLocation = (index: number, location: string) => {
    const updated = [...possibleDates];
    updated[index].location = location;
    setPossibleDates(updated);
  };

  const addTimeSlot = (locationIndex: number) => {
    const updated = [...possibleDates];
    updated[locationIndex] = {
      ...updated[locationIndex],
      slots: [...updated[locationIndex].slots, '']
    };
    setPossibleDates(updated);
  };

  const removeTimeSlot = (locationIndex: number, slotIndex: number) => {
    const updated = [...possibleDates];
    updated[locationIndex].slots = updated[locationIndex].slots.filter((_, i) => i !== slotIndex);
    setPossibleDates(updated);
  };

  const updateTimeSlot = (locationIndex: number, slotIndex: number, value: string) => {
    const updated = [...possibleDates];
    updated[locationIndex].slots[slotIndex] = value;
    setPossibleDates(updated);
  };
  const switchMode = (login: boolean) => {
    setIsLogin(login);
    setError('');
  };

  return (
    <div className="min-h-screen">
      {/* Sticky header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-purple-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
              R
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              ReUseU
            </span>
          </div>
          <nav className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => switchMode(true)}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-purple-700 rounded-lg transition-all"
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => switchMode(false)}
              className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg hover:from-purple-600 hover:to-pink-600 shadow-md transition-all"
            >
              Sign Up
            </button>
          </nav>
        </div>
      </header>

      <main className="min-h-[calc(100vh-4rem)] max-w-7xl mx-auto px-6 lg:px-10 py-10 grid gap-12 lg:gap-20 lg:grid-cols-[1.2fr_1fr] items-center">
        {/* Left: site description */}
        <section className="order-2 lg:order-1 lg:sticky lg:top-28 space-y-8">
          <div>
            <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-800 leading-tight">
              Borrow what you need.{' '}
              <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 bg-clip-text text-transparent">
                Lend what you don't.
              </span>
            </h1>
            <p className="mt-5 text-lg xl:text-xl text-gray-600 max-w-xl">
              ReUseU is a lending marketplace for university students. Share textbooks,
              electronics and everyday essentials with people on your own campus, so you
              spend less and waste less.
            </p>
          </div>

          <ul className="space-y-4">
            <li className="flex gap-4">
              <span className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-xl">📚</span>
              <div>
                <p className="font-semibold text-gray-800">Post what you're not using</p>
                <p className="text-sm text-gray-600">List an item with a photo, its condition and a return date.</p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="flex-shrink-0 w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center text-xl">🤝</span>
              <div>
                <p className="font-semibold text-gray-800">Borrow from your campus</p>
                <p className="text-sm text-gray-600">Browse items from students at your school and request what you need.</p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="flex-shrink-0 w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-xl">⭐</span>
              <div>
                <p className="font-semibold text-gray-800">Build trust with ratings</p>
                <p className="text-sm text-gray-600">Rate lenders after each return so everyone knows who's reliable.</p>
              </div>
            </li>
          </ul>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
              Verified student emails only
            </p>
            <div className="flex flex-wrap gap-2">
              {['TMU', 'UofT', 'York', 'Western'].map((school) => (
                <span key={school} className="px-3 py-1 text-sm font-medium text-purple-700 bg-white border border-purple-200 rounded-full">
                  {school}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Right: login / signup card */}
        <div className="order-1 lg:order-2 w-full max-w-sm xl:max-w-md mx-auto lg:mr-0 space-y-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-purple-100">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 bg-clip-text text-transparent">
            {isLogin ? 'Welcome Back!' : 'Join Us!'}
          </h2>
          <p className="mt-2 text-gray-600">
            {isLogin ? 'Sign in to your account' : 'Create your account'}
          </p>
        </div>

        {/* Toggle Buttons */}
        <div className="flex gap-2 bg-gray-100 rounded-lg p-1">
          <button
            type="button"
            onClick={() => switchMode(true)}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
              isLogin
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => switchMode(false)}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
              !isLogin
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Login Form */}
        {isLogin ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="login-email"
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder="your.email@university.ca"
              />
            </div>

            <div>
              <label htmlFor="login-password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="login-password"
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        ) : (
          /* Signup Form */
          <form onSubmit={handleSignup} className="space-y-5">
            <div>
              <label htmlFor="signup-username" className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                id="signup-username"
                type="text"
                required
                value={signupUsername}
                onChange={(e) => setSignupUsername(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder="Choose a username"
              />
            </div>

            <div>
              <label htmlFor="signup-email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="signup-email"
                type="email"
                required
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder="your.email@university.ca"
              />
              <p className="mt-1 text-xs text-gray-500">
                Must be from TMU, UofT, York, or Western
              </p>
            </div>

            <div>
              <label htmlFor="signup-password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="signup-password"
                type="password"
                required
                value={signupPassword}
                onChange={(e) => setSignupPassword(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder="Create a password"
              />
            </div>

            <div>
              <label htmlFor="signup-program" className="block text-sm font-medium text-gray-700 mb-1">
                Program
              </label>
              <input
                id="signup-program"
                type="text"
                required
                value={signupProgram}
                onChange={(e) => setSignupProgram(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder="e.g., Computer Science"
              />
            </div>

            <div>
              <label htmlFor="signup-degree" className="block text-sm font-medium text-gray-700 mb-1">
                Degree
              </label>
              <input
                id="signup-degree"
                type="text"
                required
                value={signupDegree}
                onChange={(e) => setSignupDegree(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder="e.g., Bachelor of Science"
              />
            </div>

            {/* Possible Dates Section */}
            <div className="border-t border-gray-200 pt-5">
              <div className="flex justify-between items-center mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Available Times & Locations (Optional)
                </label>
                <button
                  type="button"
                  onClick={addLocation}
                  className="px-3 py-1.5 text-sm bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all shadow-md"
                >
                  + Add Location
                </button>
              </div>

              {possibleDates.map((dateSlot, locationIndex) => (
                <div key={locationIndex} className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <input
                      type="text"
                      value={dateSlot.location}
                      onChange={(e) => updateLocation(locationIndex, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      placeholder="Location (e.g., ENG, DCC)"
                    />
                    <button
                      type="button"
                      onClick={() => removeLocation(locationIndex)}
                      className="ml-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="space-y-2">
                    {dateSlot.slots.map((slot, slotIndex) => (
                      <div key={slotIndex} className="flex gap-2">
                        <input
                          type="datetime-local"
                          value={slot}
                          onChange={(e) => updateTimeSlot(locationIndex, slotIndex, e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => removeTimeSlot(locationIndex, slotIndex)}
                          className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addTimeSlot(locationIndex)}
                      className="w-full px-3 py-2 text-sm text-purple-600 hover:bg-purple-50 rounded-lg border border-purple-200 transition-all"
                    >
                      + Add Time Slot
                    </button>
                  </div>
                </div>
              ))}

              {possibleDates.length === 0 && (
                <p className="text-sm text-gray-500 italic">
                  Click "Add Location" to specify when and where you're available
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
            >
              {loading ? 'Creating account...' : 'Sign Up'}
            </button>
          </form>
        )}
        </div>
      </main>
    </div>
  );
};

export default LoginSignup;
