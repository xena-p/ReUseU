import { useEffect, useState, FormEvent } from 'react';
import { User, Item, ItemsResponse, ItemCondition, ApiError } from '../types';
import axiosInstance from '../api/axiosInstance';
import { AxiosError } from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { imageUrl } from '../api/images';

const Profile = () => {
  const { id } = useParams<{ id: string }>(); // This extracts the 'id' from the URL
  const navigate = useNavigate();
  const loggedInUserId = localStorage.getItem('user_id');
  const isOwnProfile = id === loggedInUserId;

  const [user, setUser] = useState<User | null>(null);
  const [userItems, setUserItems] = useState<Item[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editUsername, setEditUsername] = useState('');
  const [editDegree, setEditDegree] = useState('');
  const [editProgram, setEditProgram] = useState('');
  const [editPic, setEditPic] = useState<File | null>(null);
  const [editPicPreview, setEditPicPreview] = useState<string | null>(null);
  const [editError, setEditError] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showDeletePopup, setShowDeletePopup] = useState(false);



  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [itemLoading, setItemLoading] = useState(false);

  // Add item form state
  const [itemTitle, setItemTitle] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [itemCategory, setItemCategory] = useState('');
  const [itemCondition, setItemCondition] = useState<ItemCondition>('fair');
  const [itemReturnDate, setItemReturnDate] = useState('');
  const [itemImage, setItemImage] = useState<File | null>(null);
  const [itemError, setItemError] = useState('');

  const [deletingId, setDeletingId] = useState<string | null>(null);
  useEffect(() => {
      if (!editPic) {
        setEditPicPreview(null);
        return;
      }
      const url = URL.createObjectURL(editPic);
      setEditPicPreview(url);
      return () => URL.revokeObjectURL(url);
    }, [editPic]);

  useEffect(() => {
    
    
    const loadProfileData = async () => {
      if (!id) return;
      
      setLoading(true);
       try {
         // Fetch specific user details from backend by ID
         const userResponse = await axiosInstance.get<User>(`/user/${id}`);
         setUser(userResponse.data);
         
         // Fetch that user's items
         await fetchUserItems(id);
       } catch (error) {
         console.error('Error loading profile:', error);
         // If user not found, redirect to home or dashboard
         navigate('/');
       } finally {
         setLoading(false);
       }
    };

    loadProfileData();
  }, [id, navigate]);

  const fetchUserItems = async (userId: string) => {
    setItemLoading(true);
    try {
      const response = await axiosInstance.get<ItemsResponse>(`/items/user/${userId}`);
      if (response.data && response.data.items) {
        setUserItems(response.data.items);
      } else {
        setUserItems([]);
      }
    } catch (error) {
      console.error('Error fetching user items:', error);
      if (error instanceof AxiosError) {
        console.error('Response:', error.response?.data);
      }
      setUserItems([]);
    } finally {
      setItemLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('user_id');
    localStorage.removeItem('token');
    navigate('/');
  };

  const handleAddItem = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setItemError('');
    setLoading(true);

    if (!user) return;

    try {
      const formData = new FormData();
      formData.append('user_id', user.user_id);
      formData.append('title', itemTitle);
      formData.append('description', itemDescription);
      formData.append('category', itemCategory);
      formData.append('condition', itemCondition);
      formData.append('return_date', new Date(itemReturnDate).toISOString());
      
      if (itemImage) {
        formData.append('images', itemImage);
      }

      await axiosInstance.post('/items', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Reset form and close modal
      setItemTitle('');
      setItemDescription('');
      setItemCategory('');
      setItemCondition('fair');
      setItemReturnDate('');
      setItemImage(null);
      setItemError('');
      setShowAddItemModal(false);
      setShowSettingsModal(false);


      // Refresh items list
      await fetchUserItems(user.user_id);
    } catch (err) {
      console.error('Add item error:', err);
      if (err instanceof AxiosError && err.response) {
        const errorData = err.response.data as ApiError;
        setItemError(errorData.error || 'Failed to create item');
      } else {
        setItemError('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

    const openEditModal = () => {
    if (!user) return;
    setEditUsername(user.username);
    setEditDegree(user.profile.degree || '');
    setEditProgram(user.profile.program || '');
    setEditPic(null);
    setEditError('');
    setShowEditModal(true);
  };

  const handleEditProfile = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    setEditError('');

    if (!editUsername.trim()) {
      setEditError('Username cannot be empty');
      return;
    }

    setEditSaving(true);
    try {
      const formData = new FormData();
      formData.append('username', editUsername.trim());
      formData.append('degree', editDegree.trim());
      formData.append('program', editProgram.trim());
      if (editPic) {
        formData.append('profile_pic', editPic);
      }

      const response = await axiosInstance.patch<User>(`/user/${user.user_id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setUser(response.data);
      localStorage.setItem('user', JSON.stringify(response.data));
      setShowEditModal(false);
      setEditPic(null);
    } catch (err) {
      console.error('Edit profile error:', err);
      if (err instanceof AxiosError && err.response) {
        const errorData = err.response.data as ApiError;
        setEditError(errorData.error || 'Failed to update profile');
      } else {
        setEditError('An unexpected error occurred');
      }
    } finally {
      setEditSaving(false);
    }
  };


  const openPasswordModal = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
    setPasswordSuccess('');
    setShowPasswordModal(true);
  };

  const handleChangePassword = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword.length < 3) {
      setPasswordError('New password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    setPasswordSaving(true);
    try {
      await axiosInstance.patch(`/user/${user.user_id}/password`, {
        current_password: currentPassword,
        new_password: newPassword,
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordSuccess('Password updated successfully');
    } catch (err) {
      console.error('Change password error:', err);
      if (err instanceof AxiosError && err.response) {
        const errorData = err.response.data as ApiError;
        setPasswordError(errorData.error || 'Failed to update password');
      } else {
        setPasswordError('An unexpected error occurred');
      }
    } finally {
      setPasswordSaving(false);
    }
  };
  const handleDeleteItem = async (itemId: string, title: string) => 
    {
      if (!loggedInUserId) return;
      if (!window.confirm(`Delete "${title}"? This can't be undone.`)) return;

      setDeletingId(itemId);
      try {
        await axiosInstance.delete(`/items/${itemId}`, {
          params: { user_id: loggedInUserId },
        });
        // Remove it from the list without refetching
        setUserItems((items) => items.filter((i) => i._id !== itemId));
      } catch (err) {
        console.error('Delete item error:', err);
        if (err instanceof AxiosError && err.response) {
          const errorData = err.response.data as ApiError;
          alert(errorData.error || 'Failed to delete item');
        } else {
          alert('An unexpected error occurred');
        }
      } finally {
        setDeletingId(null);
      }
    };

  const handleDeleteUser = async (userId: string) =>
  {
    
    if (!loggedInUserId) return;
    setDeletingId(userId);
    try {
        await axiosInstance.delete(`/user/${userId}`);
        // Remove it from the list without refetching
        handleLogout()
      } catch (err) {
        console.error('Delete user error:', err);
        if (err instanceof AxiosError && err.response) {
          const errorData = err.response.data as ApiError;
          alert(errorData.error || 'Failed to delete user');
        } else {
          alert('An unexpected error occurred');
        }
      } finally {
        setDeletingId(null);
      }

  };
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return dateString;
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600 font-medium">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
              R
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              ReUseU
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <div className="space-y-2">
            <button 
              onClick={() => navigate(`/profile/${loggedInUserId}`)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${isOwnProfile ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md' : 'text-gray-700 hover:bg-gray-100'}`}
            >
              {/* Add this span for the label */}
              <span>Profile</span>
              
              {/* This badge stays on the right because of ml-auto */}
              <span className="ml-auto bg-white/30 px-2 py-0.5 rounded text-xs">active</span>
            </button>
            <button 
              onClick={() => navigate('/browse')}
              className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-all"
            >
              Browse
            </button>
            <button 
              onClick={() => navigate('/matches')}
              className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-all">
              Matches
            </button>
          </div>
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full px-4 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-lg font-semibold hover:from-teal-600 hover:to-cyan-600 transition-all shadow-md"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="relative mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              {isOwnProfile ? `Welcome back, ${user.username}!` : `${user.username}'s Profile`}
            </h1>
            <p className="text-xl text-gray-600">Your Dashboard</p>
            {isOwnProfile && (
              <button
              onClick={() => setShowSettingsModal(true)}
              className="absolute top-0 right-0 h-fit px-8 py-4 bg-gradient-to-r from-teal-500 via-purple-500 to-pink-500 text-white rounded-2xl font-bold text-lg hover:from-teal-600 hover:via-purple-600 hover:to-pink-600 transition-all shadow-xl hover:shadow-2xl"
            >
              Settings
            </button>
            )}


          </div>

          {/* Profile Card and Add Item Button */}
          <div className="flex gap-6 mb-8">
            {/* User Profile Card */}
           <div className="relative bg-white rounded-2xl shadow-lg p-6 border border-gray-200 min-w-[300px]">
              {isOwnProfile && (
                <button
                  onClick={openEditModal}
                  title="Edit profile"
                  aria-label="Edit profile"
                  className="absolute top-3 right-3 p-2 rounded-xl text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-all"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z" />
                  </svg>
                </button>
              )}
              <div className="flex flex-col items-center">


                <div className="flex items-center gap-4 mb-4">
                      {imageUrl(user.profile.profile_pic) ? (
                        <img
                          src={imageUrl(user.profile.profile_pic!) || undefined}
                          alt={"user profile pic"}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-20 h-20 bg-gradient-to-r from-pink-400 to-teal-400 rounded-full flex items-center justify-center mb-4">
                          <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                </div>
                
                <div className="text-center w-full space-y-2">
                  <p className="font-semibold text-gray-800">Name: {user.username}</p>
                  <p className="text-sm text-gray-600">School: {user.profile.school}</p>
                  <p className="text-sm text-gray-600">Rating: {user.profile.rating.toFixed(1)}/5.0</p>
                  <p className="text-sm text-gray-600">Degree: {user.profile.degree}</p>
                  <p className="text-sm text-gray-600">Program: {user.profile.program}</p>
                </div>
              </div>
            </div>

            {/* Add Item Button */}
            {isOwnProfile && (
            
            <button
              onClick={() => setShowAddItemModal(true)}
              className="h-fit px-8 py-4 bg-gradient-to-r from-teal-500 via-purple-500 to-pink-500 text-white rounded-2xl font-bold text-lg hover:from-teal-600 hover:via-purple-600 hover:to-pink-600 transition-all shadow-xl hover:shadow-2xl"
            >
              Add Item
            </button>
            
            )}
          </div>

          {/* My Posted Items */}
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">{isOwnProfile ? 'My Posted Items' : `${user.username}'s Items`}</h2>
            {itemLoading ? (
              <div className="text-gray-600">Loading items...</div>
            ) : userItems.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200 text-center text-gray-500">
                <p>{isOwnProfile ? "You haven't posted items yet." : "This user has no items yet."}</p>
                <p className="mt-2">Click "Add Item" to get started!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userItems.map((item) => (
                  <div
                    key={item._id}
                    className="relative bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-200 hover:border-purple-300 transition-all"
                  >
                    {isOwnProfile && (
                      <button
                        onClick={() => handleDeleteItem(item._id, item.title)}
                        disabled={deletingId === item._id}
                        title="Delete item"
                        aria-label={`Delete ${item.title}`}
                        className="absolute top-3 right-3 p-2 rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-50 transition-all"
                      >
                        {deletingId === item._id ? (
                          <span className="text-xs">...</span>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round"
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M15 7V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        )}
                      </button>
                    )}
                    <div className="flex items-center gap-4 mb-4">
                      {imageUrl(item.images?.[0]) ? (
                        <img
                          src={imageUrl(item.images[0])!}
                          alt={item.title}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gradient-to-r from-purple-400 to-pink-400 rounded-lg flex items-center justify-center">
                          <span className="text-2xl">📚</span>
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-800">{item.title}</h3>
                        <p className="text-sm text-gray-500">{item.category}</p>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <p className="text-gray-600"><span className="font-semibold">Condition:</span> {item.condition}</p>
                      <p className="text-gray-600"><span className="font-semibold">Return by:</span> {formatDate(item.return_date)}</p>
                      <p className="text-gray-600"><span className="font-semibold">Status:</span> {item.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Item Modal */}
      {showAddItemModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Post a New Item</h2>
                <button
                  onClick={() => setShowAddItemModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              {itemError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                  {itemError}
                </div>
              )}

              <form onSubmit={handleAddItem} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    required
                    value={itemTitle}
                    onChange={(e) => setItemTitle(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Item title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    required
                    value={itemDescription}
                    onChange={(e) => setItemDescription(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Item description"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <input
                    type="text"
                    required
                    value={itemCategory}
                    onChange={(e) => setItemCategory(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="e.g., Textbook, Electronics"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
                  <select
                    value={itemCondition}
                    onChange={(e) => setItemCondition(e.target.value as ItemCondition)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="poor">Poor</option>
                    <option value="fair">Fair</option>
                    <option value="gently used">Gently Used</option>
                    <option value="excellent">Excellent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Return Date</label>
                  <input
                    type="datetime-local"
                    required
                    value={itemReturnDate}
                    onChange={(e) => setItemReturnDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Image (Optional)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setItemImage(e.target.files?.[0] || null)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg font-semibold hover:from-pink-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
                >
                  {loading ? 'Posting...' : 'Post Item'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Edit Profile</h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              {editError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                  {editError}
                </div>
              )}

              <form onSubmit={handleEditProfile} className="space-y-4">
                <div className="flex flex-col items-center gap-3">
                  {editPicPreview || imageUrl(user.profile.profile_pic) ? (
                    <img
                      src={editPicPreview || imageUrl(user.profile.profile_pic)!}
                      alt="Profile preview"
                      className="w-24 h-24 rounded-full object-cover border-2 border-purple-200"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-gradient-to-r from-pink-400 to-teal-400 rounded-full flex items-center justify-center">
                      <svg className="w-14 h-14 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                  <label className="cursor-pointer text-sm font-medium text-purple-600 hover:text-purple-800">
                    Change profile picture
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/gif,image/webp"
                      onChange={(e) => setEditPic(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                  <input
                    type="text"
                    required
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Degree</label>
                  <input
                    type="text"
                    value={editDegree}
                    onChange={(e) => setEditDegree(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="e.g., Bachelor's"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Program</label>
                  <input
                    type="text"
                    value={editProgram}
                    onChange={(e) => setEditProgram(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="e.g., Computer Science"
                  />
                </div>

                <button
                  type="submit"
                  disabled={editSaving}
                  className="w-full px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg font-semibold hover:from-pink-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
                >
                  {editSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* show setting modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xs w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Settings</h2>
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="flex items-center justify-center text-gray-500 rounded-full w-8 h-8 hover:bg-gray-200 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
              <div className="flex flex-col items-start gap-3">
                <button
                  onClick={openPasswordModal}
                  className="p-2 rounded-xl hover:bg-gray-200 transition-all w-full text-left">
                  Edit Password
                </button>

                <button
                  onClick={() => setShowDeletePopup(true)}
                  className="p-2 rounded-xl hover:bg-gray-200 transition-all w-full text-left">
                  Delete Account
                </button>
              </div>


            </div>
          </div>
        </div>

      )}

      

      {/* showDelete popup */}
      {showDeletePopup && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">

              <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">

                  <h2 className="text-xl font-bold text-gray-800 mb-3">
                      Delete Account?
                  </h2>

                  <p className="text-gray-600 mb-6">
                      Are you sure you want to delete your account?
                      This action cannot be undone and all your
                      account information may be permanently lost.
                  </p>

                  <div className="flex justify-end gap-3">

                      <button
                          onClick={() => setShowDeletePopup(false)}
                          className="px-4 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 transition-all"
                      >
                          Cancel
                      </button>

                      <button
                          onClick={() => {
                              setShowDeletePopup(false);
                              handleDeleteUser(user.user_id);
                          }}
                          className="px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-all"
                      >
                          Yes, Delete Account
                      </button>

                  </div>
              </div>
          </div>
      )}

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Change Password</h2>
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              {passwordError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                  {passwordError}
                </div>
              )}
              {passwordSuccess && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
                  {passwordSuccess}
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                  <input
                    type="password"
                    required
                    autoComplete="current-password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <button
                  type="submit"
                  disabled={passwordSaving}
                  className="w-full px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg font-semibold hover:from-pink-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
                >
                  {passwordSaving ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
