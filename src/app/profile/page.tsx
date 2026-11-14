'use client';

import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Globe,
  Camera,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Save,
  Lock,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { CURRENCY_MAP } from '@/lib/currency';

export default function ProfilePage() {
  const { user, refreshUser, updateUserLocally } = useAuth();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [address, setAddress] = useState('');
  const [country, setCountry] = useState('India');
  const [preferredCurrency, setPreferredCurrency] = useState('INR');
  const [timeZone, setTimeZone] = useState('Asia/Kolkata');
  const [profilePicture, setProfilePicture] = useState('');

  // Password Change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState({ text: '', isError: false });
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Status
  const [saveLoading, setSaveLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setBio(user.bio || '');
      setDateOfBirth(user.dateOfBirth || '');
      setAddress(user.address || '');
      setCountry(user.country || 'India');
      setPreferredCurrency(user.preferredCurrency || 'INR');
      setTimeZone(user.timeZone || 'Asia/Kolkata');
      setProfilePicture(user.profilePicture || '');
    }
  }, [user]);

  const handleProfileImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg('Image size should be less than 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      setProfilePicture(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveLoading(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phone,
          bio,
          dateOfBirth,
          address,
          country,
          preferredCurrency,
          timeZone,
          profilePicture,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMsg('Profile updated successfully!');
        updateUserLocally(data.user);
        await refreshUser();
      } else {
        setErrorMsg(data.error || 'Failed to update profile.');
      }
    } catch {
      setErrorMsg('An error occurred while saving.');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg({ text: '', isError: false });

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ text: 'New passwords do not match.', isError: true });
      return;
    }

    if (newPassword.length < 8) {
      setPasswordMsg({ text: 'Password must be at least 8 characters long.', isError: true });
      return;
    }

    setPasswordLoading(true);

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });

      const data = await res.json();
      if (res.ok) {
        setPasswordMsg({ text: 'Password updated successfully!', isError: false });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordMsg({ text: data.error || 'Failed to change password.', isError: true });
      }
    } catch {
      setPasswordMsg({ text: 'Error changing password.', isError: true });
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="profile">
        <div className="profile-header">
          <h1 className="profile-title">
            User Profile & Identity
          </h1>
          <p className="profile-description">
            Manage your personal profile details, preferences, and password security.
          </p>
        </div>

        {successMsg && (
          <div className="profile-alert-success">
            <CheckCircle2 style={{ width: 16, height: 16, flexShrink: 0 }} />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="profile-alert-error">
            <AlertCircle style={{ width: 16, height: 16, flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* PROFILE PICTURE & MAIN DETAILS FORM */}
        <form onSubmit={handleSaveProfile} className="profile-card">
          {/* Avatar Upload */}
          <div className="profile-avatar-section">
            <div className="profile-avatar-wrapper">
              {profilePicture ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profilePicture}
                  alt={name}
                  className="profile-avatar-img"
                />
              ) : (
                <div className="profile-avatar-placeholder">
                  {name ? name.charAt(0).toUpperCase() : 'U'}
                </div>
              )}

              <label className="profile-avatar-btn">
                <Camera style={{ width: 14, height: 14 }} />
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleProfileImageUpload} />
              </label>
            </div>

            <div className="profile-avatar-info">
              <h3 className="profile-avatar-name">{name || 'Your Name'}</h3>
              <p className="profile-avatar-email">{user?.email}</p>
              {profilePicture && (
                <button
                  type="button"
                  onClick={() => setProfilePicture('')}
                  className="profile-avatar-remove-btn"
                >
                  <Trash2 style={{ width: 12, height: 12 }} /> Remove Picture
                </button>
              )}
            </div>
          </div>

          {/* Form Fields */}
          <div className="profile-form-grid-2">
            <div className="profile-form-group">
              <label className="profile-form-label">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="profile-form-input"
              />
            </div>

            <div className="profile-form-group">
              <label className="profile-form-label">Email Address</label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="profile-form-input profile-form-input-disabled"
              />
            </div>

            <div className="profile-form-group">
              <label className="profile-form-label">Phone Number</label>
              <input
                type="tel"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="profile-form-input"
              />
            </div>

            <div className="profile-form-group">
              <label className="profile-form-label">Date of Birth</label>
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="profile-form-input"
              />
            </div>

            <div className="profile-form-group">
              <label className="profile-form-label">Preferred Currency</label>
              <select
                value={preferredCurrency}
                onChange={(e) => setPreferredCurrency(e.target.value)}
                className="profile-form-select"
              >
                {Object.entries(CURRENCY_MAP).map(([code, info]) => (
                  <option key={code} value={code}>
                    {code} ({info.symbol}) - {info.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="profile-form-group">
              <label className="profile-form-label">Country</label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="profile-form-input"
              />
            </div>
          </div>

          <div className="profile-form-group">
            <label className="profile-form-label">Bio / Notes</label>
            <textarea
              rows={2}
              placeholder="A brief sentence about your financial goals..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="profile-form-textarea"
            />
          </div>

          <div className="profile-form-actions">
            <button
              type="submit"
              disabled={saveLoading}
              className="profile-btn-save"
            >
              <Save style={{ width: 14, height: 14 }} />
              <span>{saveLoading ? 'Saving...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </form>

        {/* SECURITY & PASSWORD CHANGE */}
        <form onSubmit={handleChangePassword} className="profile-card">
          <div className="profile-security-header">
            <h3 className="profile-security-title">
              <Lock style={{ width: 16, height: 16, color: '#64748b' }} />
              <span>Change Password</span>
            </h3>
            <p className="profile-security-subtitle">Ensure your password is at least 8 characters long.</p>
          </div>

          {passwordMsg.text && (
            <div
              className={
                passwordMsg.isError
                  ? 'profile-alert-error'
                  : 'profile-alert-success'
              }
            >
              {passwordMsg.isError ? (
                <AlertCircle style={{ width: 16, height: 16, flexShrink: 0 }} />
              ) : (
                <CheckCircle2 style={{ width: 16, height: 16, flexShrink: 0 }} />
              )}
              <span>{passwordMsg.text}</span>
            </div>
          )}

          <div className="profile-form-grid-3">
            <div className="profile-form-group">
              <label className="profile-form-label">Current Password</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="profile-form-input"
              />
            </div>
            <div className="profile-form-group">
              <label className="profile-form-label">New Password</label>
              <input
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="profile-form-input"
              />
            </div>
            <div className="profile-form-group">
              <label className="profile-form-label">Confirm New Password</label>
              <input
                type="password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="profile-form-input"
              />
            </div>
          </div>

          <div className="profile-form-actions">
            <button
              type="submit"
              disabled={passwordLoading}
              className="profile-btn-password"
            >
              {passwordLoading ? 'Updating Password...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}

