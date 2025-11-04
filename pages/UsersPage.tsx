// Fix: Replaced placeholder content with a full implementation of the UsersPage, which provides a UI for viewing, adding, editing, and deleting users (for admins only).
import React, { useState, useEffect } from 'react';
import { useDatabase } from '@/contexts/DatabaseContext';
import { useI18n } from '../contexts/I18nContext';
import { useAuth } from '../contexts/AuthContext';
// Fix: Import UserId type
import { User, UserId, UserRole } from '../types';
import GlassCard from '../components/ui/GlassCard';
import NeuButton from '../components/ui/NeuButton';

// دالة hash بديلة لا تحتاج bcryptjs
const simpleHash = async (password: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'glass-pos-salt');
  // Fix: Use a standard hashing algorithm like SHA-256 instead of the non-existent SHA-264.
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

interface ExtendedUser extends User {
  password?: string;
}

// Fix: Corrected the type for form data to align with the User type and include an optional password.
type UserFormData = Partial<Omit<User, 'id'>> & {
  id?: UserId;
  password?: string;
  username: string;
};

const UserModal = ({
  user,
  onClose,
  onSave,
  error,
}: {
  user: UserFormData | null;
  onClose: () => void;
  onSave: (userData: UserFormData) => Promise<void>;
  error?: string;
}) => {
  const { t } = useI18n();
  const [formData, setFormData] = useState<UserFormData>(
    // Fix: Added passwordHash to the initial state to match the UserFormData type.
    user || { username: '', role: 'cashier', password: '', passwordHash: '' }
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value as any }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username) {
      alert(t('fill_required_fields'));
      return;
    }
    // For new users, password is required
    if (!formData.id && !formData.password) {
        alert(t('password_required_for_new_user'));
        return;
    }

    await onSave(formData);
  };

  if (!user) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <GlassCard className="w-full max-w-lg">
        <h2 className="text-2xl font-bold mb-6">{user.id ? t('edit_user') : t('add_user')}</h2>
        {error && (
          <div className="mb-4 p-3 bg-red-500/20 text-red-500 rounded-lg">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block mb-2 text-sm font-medium">{t('username')}</label>
            <input name="username" value={formData.username || ''} onChange={handleChange} className="w-full px-4 py-2 bg-white/50 dark:bg-black/50 rounded-lg border-none shadow-neumorphic-light-inset dark:shadow-neumorphic-dark-inset focus:outline-none focus:ring-2 focus:ring-blue-500" required autoFocus />
          </div>
          <div>
            <label className="block mb-2 text-sm font-medium">{t('role')}</label>
            <select name="role" value={formData.role} onChange={handleChange} className="w-full px-4 py-2 bg-white/50 dark:bg-black/50 rounded-lg border-none shadow-neumorphic-light-inset dark:shadow-neumorphic-dark-inset focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="cashier">Cashier</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div>
            <label className="block mb-2 text-sm font-medium">{t('password')}</label>
            <input name="password" type="password" value={formData.password || ''} onChange={handleChange} placeholder={user.id ? 'Leave blank to keep current' : ''} className="w-full px-4 py-2 bg-white/50 dark:bg-black/50 rounded-lg border-none shadow-neumorphic-light-inset dark:shadow-neumorphic-dark-inset focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex justify-end gap-4 mt-6">
            <NeuButton type="button" onClick={onClose} variant="secondary">{t('cancel')}</NeuButton>
            <NeuButton type="submit" variant="primary">{t('save')}</NeuButton>
          </div>
        </form>
      </GlassCard>
    </div>
  );
};

const UsersPage = () => {
  const { t } = useI18n();
  const { users, addUser, updateUser, deleteUser } = useDatabase();
  const { user: currentLoggedUser } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  // Fix: Changed state type from Partial<User> to UserFormData to match modal props.
  const [currentUser, setCurrentUser] = useState<UserFormData | null>(null);
  const [error, setError] = useState<string>("");

  // Redirect if not admin
  useEffect(() => {
    if (currentLoggedUser?.role !== 'admin') {
      window.location.href = '/dashboard';
    }
  }, [currentLoggedUser]);

  useEffect(() => {
    const lucide = (window as any).lucide;
    if (lucide?.createIcons) {
      lucide.createIcons();
    }
  });

  const handleAdd = () => {
    // Fix: Provide a complete initial object that satisfies the UserFormData type.
    setCurrentUser({ username: '', role: 'cashier', password: '', passwordHash: '' });
    setIsModalOpen(true);
  };

  const handleEdit = (user: User) => {
    setCurrentUser(user);
    setIsModalOpen(true);
  };

  // Fix: Ensure the ID is correctly typed as UserId.
  const handleDelete = (id: UserId) => {
    if (window.confirm(t('confirm_delete_user'))) {
      if(!deleteUser(id)) {
        // The original implementation had an alert in deleteUser, which is fine.
        // No need to duplicate the alert here.
      }
    }
  };

  // Fix: Refactored the save handler for clarity and correctness.
  const handleSave = async (userData: UserFormData) => {
    try {
      setError("");
      // Check for duplicate username
      const existingUser = users.find(u => 
        u.username === userData.username && 
        u.id !== userData.id
      );
      
      if (existingUser) {
        setError(t('username_already_exists'));
        return;
      }

      if (userData.id) { // Editing existing user
        const originalUser = users.find(u => u.id === userData.id);
        if (!originalUser) {
          setError("User not found");
          return;
        }

        const isLastAdmin = users.filter(u => u.role === 'admin').length === 1 &&
          originalUser.role === 'admin' &&
          userData.role !== 'admin';
        
        if (isLastAdmin) {
          setError(t('cannot_remove_last_admin'));
          return;
        }
        
        const updatedUser: User = {
          id: userData.id,
          username: userData.username,
          role: userData.role || UserRole.CASHIER,
          passwordHash: originalUser.passwordHash // Keep old hash by default
        };

        if (userData.password) {
          updatedUser.passwordHash = await simpleHash(userData.password);
        }
        
        updateUser(updatedUser);

      } else { // Adding new user
        if (!userData.password) {
          setError(t('password_required'));
          return;
        }
        
        // DataContext's addUser handles hashing and ID generation
        addUser({
          username: userData.username,
          role: userData.role || 'cashier',
          password: userData.password
        });
      }
      
      handleCloseModal();
    } catch (err) {
      setError(t('error_saving_user'));
      console.error('Error saving user:', err);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentUser(null);
    setError("");
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">{t('users')}</h1>
      <GlassCard className="mb-6">
        <div className="flex justify-end">
          <NeuButton onClick={handleAdd} variant="primary">{t('add_user')}</NeuButton>
        </div>
      </GlassCard>
      <GlassCard>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/20">
                <th className="p-4">{t('username')}</th>
                <th className="p-4">{t('role')}</th>
                <th className="p-4 text-center">{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} className="border-b border-white/20 last:border-b-0">
                  <td className="p-4">{user.username}</td>
                  <td className="p-4">{user.role}</td>
                  <td className="p-4">
                    <div className="flex gap-2 justify-center">
                      <button onClick={() => handleEdit(user)} className="p-2 hover:bg-white/20 rounded-full" title={t('edit')}>
                        <i data-lucide="pencil" className="w-4 h-4"></i>
                      </button>
                      <button onClick={() => handleDelete(user.id)} className="p-2 hover:bg-white/20 rounded-full text-red-500" title={t('delete')}>
                        <i data-lucide="trash-2" className="w-4 h-4"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
      {isModalOpen && <UserModal user={currentUser} onClose={handleCloseModal} onSave={handleSave} error={error} />}
    </div>
  );
};

export default UsersPage;