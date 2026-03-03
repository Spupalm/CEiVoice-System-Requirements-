import React, { useState, useRef } from 'react';
import { FiEye, FiEyeOff } from "react-icons/fi";
import ReCAPTCHA from "react-google-recaptcha";

const API_URL = process.env.REACT_APP_API_URL;

function CreateNewAdmin({ onSuccess, onBack }) {
  const recaptchaRef = useRef(null);
  const [fullName, setFullName]         = useState('');
  const [username, setUsername]         = useState('');
  const [password, setPassword]         = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [previewUrl, setPreviewUrl]     = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [captchaToken, setCaptchaToken] = useState(null);
  const [error, setError]               = useState('');
  const [loading, setLoading]           = useState(false);
  const fileInputRef = useRef(null);

  const resetCaptcha = () => {
    setCaptchaToken(null);
    recaptchaRef.current?.reset();
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setProfileImage(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!fullName || !username || !password) {
      setError('Please fill in all required fields.');
      resetCaptcha();
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      resetCaptcha();
      return;
    }
    if (!captchaToken) {
      setError('Please verify that you are not a robot.');
      return;
    }

    const formData = new FormData();
    formData.append('fullName', fullName);
    formData.append('username', username);
    formData.append('password', password);
    formData.append('role', 'admin');
    formData.append('skills', '');
    formData.append('captchaToken', captchaToken);
    if (profileImage) formData.append('profileImage', profileImage);

    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/register`, { method: 'POST', body: formData });
      const data = await response.json();
      if (!response.ok) {
        setError(data.message || 'Registration failed.');
        resetCaptcha();
        return;
      }
      onSuccess();
    } catch {
      setError('Network error: Could not connect to server.');
      resetCaptcha();
    } finally {
      setLoading(false);
    }
  };

  // Password strength
  const strength = password.length === 0 ? 0 : password.length < 8 ? 1 : password.length < 12 ? 2 : 3;
  const strengthLabel = ['', 'Too short', 'Good', 'Strong'][strength];
  const strengthColor = ['', '#EF4444', '#F59E0B', '#10B981'][strength];

  return (
    <div style={{
      display: 'flex', width: '100vw', height: '100vh',
      fontFamily: "'Segoe UI', sans-serif",
      position: 'fixed', top: 0, left: 0, overflow: 'hidden',
    }}>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .cei-input {
          width: 100%; box-sizing: border-box;
          padding: 10px 14px;
          border: 1px solid #E5E7EB;
          border-radius: 9px;
          font-size: 13px;
          color: #1A1A2E;
          background: #F9FAFB;
          outline: none;
          font-family: 'Segoe UI', sans-serif;
          transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
        }
        .cei-input:focus {
          border-color: #F97316;
          box-shadow: 0 0 0 3px rgba(249,115,22,0.12);
          background: white;
        }
        .cei-input::placeholder { color: #C4C9D4; }
        .cei-input.has-icon { padding-left: 40px; }
        .cei-input.has-right { padding-right: 44px; }
        .cei-input.error { border-color: #EF4444; }
        .submit-btn {
          width: 100%; padding: 12px;
          border-radius: 9px; border: none;
          background: linear-gradient(135deg, #F97316, #EA580C);
          color: white; font-size: 13px; font-weight: 700;
          cursor: pointer; letter-spacing: 0.02em;
          box-shadow: 0 3px 12px rgba(249,115,22,0.3);
          transition: transform 0.15s, box-shadow 0.15s;
          font-family: 'Segoe UI', sans-serif;
        }
        .submit-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 5px 18px rgba(249,115,22,0.4);
        }
        .submit-btn:disabled {
          background: #E5E7EB; color: #9CA3AF;
          box-shadow: none; cursor: not-allowed;
        }
        .back-btn {
          background: none; border: none;
          color: #9CA3AF; font-size: 12px; font-weight: 600;
          cursor: pointer; padding: 0; display: flex; align-items: center; gap: 5px;
          font-family: 'Segoe UI', sans-serif; transition: color 0.15s;
        }
        .back-btn:hover { color: #F97316; }
        .avatar-ring {
          width: 64px; height: 64px; border-radius: 50%;
          background: linear-gradient(135deg, #F97316, #EA580C);
          border: 3px solid #F97316;
          display: flex; align-items: center; justify-content: center;
          overflow: hidden; cursor: pointer; flex-shrink: 0;
          transition: opacity 0.2s, transform 0.2s;
        }
        .avatar-ring:hover { opacity: 0.85; transform: scale(1.03); }
        .nav-item-indicator {
          width: 6px; height: 6px; border-radius: 50%;
          background: rgba(249,115,22,0.5); flex-shrink: 0;
        }
      `}</style>

      {/* ── LEFT PANEL ─────────────────────────────────────────────────────── */}
      <div style={{
        width: 300, background: '#1A1A2E', flexShrink: 0,
        display: 'flex', flexDirection: 'column', padding: '32px 28px',
        position: 'relative', overflow: 'hidden',
      }}>
       
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 40 }}>
          <img src="/CeiLogoColor.png" alt="EVoice Logo" style={{ height: 44, objectFit: 'contain' }} />
        </div>

        {/* Headline */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#F97316', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>
            Admin Panel
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: 'white', lineHeight: 1.3, margin: '0 0 14px' }}>
            Create a new<br />
            <span style={{ color: '#F97316' }}>administrator</span><br />
            account
          </h2>
          <p style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.7, margin: '0 0 32px' }}>
            Admin accounts have full access to ticket management, user approvals, and system reports.
          </p>

          {/* Feature list — same bullet style as sidebar nav */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              'Full dashboard access',
              'Approve user registrations',
              'Manage all tickets & drafts',
              'View system-wide reports',
            ].map((text, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className="nav-item-indicator" />
                <span style={{ fontSize: 12, color: '#9CA3AF' }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ fontSize: 11, color: '#374151' }}>CEIVoice Admin System © 2026</div>
      </div>

      {/* ── RIGHT PANEL ────────────────────────────────────────────────────── */}
      <div style={{
        flex: 1, background: '#F5F5F5',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px', overflowY: 'auto',
      }}>
        <div style={{
          background: 'white', borderRadius: 14, padding: '32px 36px',
          width: '100%', maxWidth: 460,
          border: '1px solid #F3F4F6',
          boxShadow: '0 2px 16px rgba(0,0,0,0.07)',
          animation: 'fadeUp 0.35s ease',
        }}>
          {/* Back button */}
          <button className="back-btn" onClick={onBack} style={{ marginBottom: 22 }}>
            ← Back to Dashboard
          </button>

          {/* Header */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#F97316', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
              New Account
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: '#1A1A2E', margin: '0 0 4px' }}>Create Admin</h3>
            <p style={{ fontSize: 12, color: '#9CA3AF', margin: 0 }}>Fill in the details below to create a new administrator.</p>
          </div>

          <form onSubmit={handleSubmit}>

            {/* ── Avatar upload ── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 22, padding: '14px 16px', background: '#F9FAFB', borderRadius: 10, border: '1px solid #F3F4F6' }}>
              <div
                className="avatar-ring"
                onClick={() => fileInputRef.current?.click()}
                title="Click to upload photo"
              >
                {previewUrl
                  ? <img src={previewUrl} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontSize: 24, lineHeight: 1 }}>👤</span>}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: '#1A1A2E', marginBottom: 2 }}>
                  {profileImage ? profileImage.name : 'Profile Photo'}
                </div>
                <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 8 }}>PNG or JPG, up to 5MB</div>
                <button type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{ background: '#FFF7ED', border: '1px solid #FDBA74', color: '#EA580C', borderRadius: 7, padding: '5px 12px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                  {profileImage ? 'Change' : 'Upload'}
                </button>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageChange} />
            </div>

            {/* ── Full Name ── */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                Full Name
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: '#C4C9D4', pointerEvents: 'none' }}>👤</span>
                <input
                  type="text"
                  className="cei-input has-icon"
                  placeholder="e.g. Rick Astley"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                />
              </div>
            </div>

            {/* ── Username ── */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                Username
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: '#C4C9D4', pointerEvents: 'none' }}>@</span>
                <input
                  type="text"
                  className="cei-input has-icon"
                  placeholder="e.g. rick_astley"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                />
              </div>
            </div>

            {/* ── Password ── */}
            <div style={{ marginBottom: 6 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: '#C4C9D4', pointerEvents: 'none' }}>🔒</span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="cei-input has-icon has-right"
                  placeholder="Minimum 8 characters"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <span
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#9CA3AF', display: 'flex', alignItems: 'center' }}>
                  {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </span>
              </div>
            </div>

            {/* Password strength bar */}
            {password.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', gap: 3, marginBottom: 4 }}>
                  {[1, 2, 3].map(i => (
                    <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: strength >= i ? strengthColor : '#F3F4F6', transition: 'background 0.3s' }} />
                  ))}
                </div>
                <div style={{ fontSize: 11, color: strengthColor, fontWeight: 600 }}>{strengthLabel}</div>
              </div>
            )}
            {password.length === 0 && <div style={{ marginBottom: 14 }} />}

            {/* ── Role badge (read-only) ── */}
            <div style={{ marginBottom: 18, padding: '11px 14px', background: '#FFF7ED', border: '1px solid #FDBA74', borderRadius: 9, display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#F97316', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#EA580C', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Role</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#1A1A2E', marginTop: 1 }}>Administrator — Full system access</div>
              </div>
            </div>

            {/* ── Error ── */}
            {error && (
              <div style={{ padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 8, color: '#DC2626', fontSize: 12, fontWeight: 500, marginBottom: 14 }}>
                ⚠ {error}
              </div>
            )}

            {/* ── reCAPTCHA ── */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
              <ReCAPTCHA
                ref={recaptchaRef}
                sitekey="6LeQBlssAAAAAFZTj22xDHurWEaMtcsTyngKlH4H"
                onChange={token => setCaptchaToken(token)}
              />
            </div>

            {/* ── Submit ── */}
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Creating account…' : 'Create Admin Account'}
            </button>

            {/* ── Already have account ── */}
            <div style={{ textAlign: 'right', marginTop: 14 }}>
              <span
                onClick={onBack}
                style={{ fontSize: 12, color: '#F97316', cursor: 'pointer', fontWeight: 600 }}
                onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>
                ← Back to login
              </span>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}

export default CreateNewAdmin;