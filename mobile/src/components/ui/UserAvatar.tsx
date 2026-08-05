import React from 'react';

interface UserAvatarProps {
  name?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const GRADIENTS = [
  'from-amber-500 to-yellow-600',
  'from-blue-500 to-indigo-600',
  'from-emerald-500 to-teal-600',
  'from-purple-500 to-pink-600',
  'from-rose-500 to-orange-500',
];

const getGradient = (key: string) => {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = key.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % GRADIENTS.length;
  return GRADIENTS[index];
};

const getInitials = (name?: string | null, email?: string | null) => {
  if (name && name.trim()) {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }
  if (email && email.trim()) {
    return email.substring(0, 2).toUpperCase();
  }
  return 'UX';
};

export const UserAvatar: React.FC<UserAvatarProps> = React.memo(({
  name,
  email,
  avatarUrl,
  className = '',
  size = 'md',
}) => {
  const [imageError, setImageError] = React.useState(false);
  const initials = getInitials(name, email);
  const gradient = getGradient(name || email || 'user');

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs font-bold',
    md: 'w-10 h-10 text-sm font-black',
    lg: 'w-16 h-16 text-xl font-black',
  }[size];

  if (avatarUrl && !imageError && !avatarUrl.includes('dicebear')) {
    return (
      <img
        src={avatarUrl}
        alt={name || 'User Avatar'}
        onError={() => setImageError(true)}
        className={`${sizeClasses} rounded-full object-cover border border-border shadow-xs ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses} rounded-full bg-gradient-to-tr ${gradient} text-white flex items-center justify-center border border-white/20 shadow-xs shrink-0 select-none ${className}`}
    >
      <span>{initials}</span>
    </div>
  );
});

UserAvatar.displayName = 'UserAvatar';
