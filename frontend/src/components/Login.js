import React, { useState, useEffect, useRef } from "react";
import { FiEye, FiEyeOff, FiChevronRight, FiChevronLeft } from "react-icons/fi";
import ReCAPTCHA from "react-google-recaptcha";
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import Swal from 'sweetalert2';

const API_URL = process.env.REACT_APP_API_URL;

export default function Login({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ─── Role-aware login handler ───────────────────────────────────────────────
  // After a successful login, this checks if the user navigated to /admin
  // (or any admin route) without being an admin, and boots them out.
  const handleLogin = (username, profileImage, id, role, email) => {
    // If the user is on an admin path but their role is not admin, redirect them.
    const isOnAdminPath = window.location.pathname.startsWith('/admin');
    if (isOnAdminPath && role !== 'admin') {
      Swal.fire({
        title: 'Access Denied',
        text: 'You do not have permission to access the admin area.',
        icon: 'error',
        confirmButtonText: 'Go to Dashboard',
        confirmButtonColor: '#F36601',
      }).then(() => {
        window.location.href = '/dashboard'; // redirect non-admins away
      });
      return;
    }
    onLogin(username, profileImage, id, role, email);
  };

  return (
    <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
      <div style={{
        position: "fixed", top: 0, left: 0,
        width: "100vw", height: "100vh",
        overflow: "hidden", fontFamily: "'Nunito', sans-serif",
      }}>

        {/* Navbar */}
        <nav style={{
          position: "absolute", top: 0, left: 0,
          width: "100%", height: "75px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: isMobile ? "0 1.5rem" : "0 4rem",
          boxSizing: "border-box", zIndex: 200,
          background: "rgba(0,0,0,0.3)", backdropFilter: "blur(10px)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "2px", cursor: "pointer" }}>
            <img src="/Ceiwhitelogo.png" alt="Logo" style={{ width: "45px", height: "39.85px", filter: "drop-shadow(0px 4px 4px rgba(0,0,0,0.25))", objectFit: "contain" }} />
            <span style={{ fontFamily: "'Hammersmith One', sans-serif", fontSize: "24px", color: "#fff", fontWeight: "400", whiteSpace: "nowrap", lineHeight: "1", paddingBottom: "2px", filter: "drop-shadow(0px 4px 4px rgba(0,0,0,0.25))" }}>Voice System</span>
          </div>
          {!isMobile && (
            <div style={{ display: "flex", gap: "2rem" }}>
              <span style={{ color: "#fff", fontSize: "0.95rem", fontWeight: 500, cursor: "pointer", opacity: 0.8 }}>Home</span>
              <span onClick={() => setIsRegister(false)} style={{ color: !isRegister ? "#FFB000" : "#fff", fontWeight: !isRegister ? "bold" : 500, fontSize: "0.95rem", cursor: "pointer" }}>Login</span>
              <span onClick={() => setIsRegister(true)} style={{ color: isRegister ? "#FFB000" : "#fff", fontWeight: isRegister ? "bold" : 500, fontSize: "0.95rem", cursor: "pointer" }}>Register</span>
            </div>
          )}
        </nav>

        {/* Middle toggle button */}
        {!isMobile && (
          <div onClick={() => setIsRegister(!isRegister)} style={{
            position: "absolute", top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            width: "55px", height: "55px", borderRadius: "50%",
            backgroundColor: "rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.3)",
            backdropFilter: "blur(10px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", zIndex: 150, color: "#fff",
          }}>
            {isRegister ? <FiChevronLeft size={24} /> : <FiChevronRight size={24} />}
          </div>
        )}

        {/* Slider */}
        <div style={{ width: "100vw", height: "100vh", overflow: "hidden" }}>
          <div style={{
            display: "flex", width: "200vw", height: "100vh",
            transition: "transform 0.8s cubic-bezier(0.65, 0, 0.35, 1)",
            transform: isRegister ? "translateX(-100vw)" : "translateX(0)",
          }}>

            {/* LOGIN PANEL */}
            <div style={{ width: "100vw", height: "100vh", flexShrink: 0, display: "flex", flexDirection: isMobile ? "column" : "row" }}>
              <div style={{ flex: isMobile ? "0 0 40%" : 1, backgroundImage: 'url("https://i.pinimg.com/1200x/d4/32/30/d4323062065c96e06e794370cfc01571.jpg")', backgroundSize: "cover", backgroundPosition: "center" }} />
              <div style={{ flex: isMobile ? "0 0 60%" : 1, background: "linear-gradient(135deg, #FFD88E 0%, #FFB000 10%, #F36601 20%, #530A0A 45%, #000000 100%)", display: "flex", alignItems: "center", justifyContent: "center", overflowY: "auto" }}>
                <LoginForm onLogin={handleLogin} goToSignUp={() => setIsRegister(true)} />
              </div>
            </div>

            {/* REGISTER PANEL */}
            <div style={{ width: "100vw", height: "100vh", flexShrink: 0, display: "flex", flexDirection: isMobile ? "column" : "row" }}>
              <div style={{ flex: isMobile ? "0 0 60%" : 1, background: "linear-gradient(135deg, #FFD88E 0%, #FFB000 10%, #F36601 20%, #530A0A 45%, #000000 100%)", display: "flex", alignItems: "center", justifyContent: "center", overflowY: "auto" }}>
                <SignUpForm onSuccess={() => setIsRegister(false)} goToLogIn={() => setIsRegister(false)} />
              </div>
              <div style={{ flex: isMobile ? "0 0 40%" : 1, backgroundImage: 'url("https://i.pinimg.com/1200x/d4/32/30/d4323062065c96e06e794370cfc01571.jpg")', backgroundSize: "cover", backgroundPosition: "center" }} />
            </div>

          </div>
        </div>
      </div>
    </GoogleOAuthProvider>
  );
}

// ── LOGIN FORM ────────────────────────────────────────────────────────────────
function LoginForm({ onLogin, goToSignUp }) {
  const recaptchaRef = useRef(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [captchaToken, setCaptchaToken] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleLoginFail = () => {
    setCaptchaToken(null);
    if (recaptchaRef.current) recaptchaRef.current.reset();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!username.trim() || !password.trim()) {
      setError('Please enter username and password.');
      handleLoginFail();
      return;
    }
    if (!captchaToken) {
      setError('Please verify that you are not a robot.');
      return;
    }
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, captchaToken }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.message || 'Login failed.');
        handleLoginFail();
        return;
      }

      // ── Role gate: block non-admins from the admin area ──────────────────
      if (window.location.pathname.startsWith('/admin') && data.user.role !== 'admin') {
        setError('Access denied. Admin accounts only.');
        handleLoginFail();
        return;
      }

      localStorage.setItem('todo_user_id', data.user.id);
      localStorage.setItem('todo_username', data.user.username);
      localStorage.setItem('todo_profile', data.user.profileImage);
      localStorage.setItem('todo_user_role', data.user.role);
      localStorage.setItem('todo_user_email', data.user.email);
      onLogin(data.user.username, data.user.profileImage, data.user.id, data.user.role, data.user.email);
    } catch (err) {
      setError('Network error: Could not connect to the server.');
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const decoded = jwtDecode(credentialResponse.credential);
      const googleProfilePic = decoded.picture;
      const response = await fetch(`${API_URL}/google-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: credentialResponse.credential, profileImage: googleProfilePic }),
      });
      const data = await response.json();
      if (response.ok) {
        // ── Role gate for Google login too ───────────────────────────────
        if (window.location.pathname.startsWith('/admin') && data.user.role !== 'admin') {
          setError('Access denied. Admin accounts only.');
          return;
        }

        localStorage.setItem('todo_user_id', data.user.id);
        localStorage.setItem('todo_username', data.user.username);
        localStorage.setItem('todo_profile', data.user.profileImage || '');
        localStorage.setItem('todo_user_role', data.user.role);
        localStorage.setItem('todo_user_email', data.user.email);
        onLogin(data.user.username, data.user.profileImage || '', data.user.id, data.user.role, data.user.email);
      } else {
        setError(data.message || 'Google login failed on server.');
      }
    } catch (err) {
      setError('Failed to connect to server during Google login.');
    }
  };

  return (
    <div style={{ width: "90%", maxWidth: "400px", background: "rgba(0,0,0,0.3)", backdropFilter: "blur(25px)", borderRadius: "20px", padding: "2.5rem", border: "1px solid rgba(255,255,255,0.1)" }}>
      <h2 style={{ color: "#fff", fontSize: "2rem", margin: 0 }}>USER LOGIN</h2>
      <p style={{ color: "#DADADA", fontSize: "1rem", marginBottom: "2rem" }}>Welcome back to CeiVoice</p>

      {error && <p style={errorStyle}>{error}</p>}

      <label style={labelStyle}>User Name</label>
      <input value={username} onChange={e => setUsername(e.target.value)} style={inputStyle} placeholder="Your User Name" />

      <label style={labelStyle}>Password</label>
      <div style={{ position: "relative" }}>
        <input value={password} onChange={e => setPassword(e.target.value)} style={inputStyle} type={showPassword ? "text" : "password"} placeholder="Your Password" />
        <div onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: 15, top: 14, color: "#999", cursor: "pointer" }}>
          {showPassword ? <FiEye /> : <FiEyeOff />}
        </div>
      </div>

      <ReCAPTCHA
        ref={recaptchaRef}
        sitekey="6LeQBlssAAAAAFZTj22xDHurWEaMtcsTyngKlH4H"
        theme="dark"
        onChange={token => setCaptchaToken(token)}
        onExpired={() => setCaptchaToken(null)}
        style={{ marginBottom: "1.5rem", transform: "scale(0.85)", transformOrigin: "0 0" }}
      />

      <button onClick={handleSubmit} style={btnStyle}>LOGIN</button>

      <div style={{ textAlign: "center", margin: "1rem 0", color: "#fff", opacity: 0.8 }}>OR</div>

      <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => setError("Google Login Failed. Please try again.")} />

      <p style={{ color: "#fff", textAlign: "center", marginTop: "1.5rem", fontSize: "0.85rem" }}>
        Don't have an account?{" "}
        <span onClick={goToSignUp} style={{ color: "#FFB000", cursor: "pointer", fontWeight: "bold" }}>Register</span>
      </p>
    </div>
  );
}

// ── SIGNUP FORM ───────────────────────────────────────────────────────────────
function SignUpForm({ onSuccess, goToLogIn }) {
  const recaptchaRef = useRef(null);
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [profileImage, setProfileImage] = useState(null);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [captchaToken, setCaptchaToken] = useState(null);
  const [availableCategories, setAvailableCategories] = useState([]);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [email, setEmail] = useState('');

  const handleLoginFail = () => {
    setCaptchaToken(null);
    if (recaptchaRef.current) recaptchaRef.current.reset();
  };

  useEffect(() => {
    fetch(`${API_URL}/categories`)
      .then(res => { if (!res.ok) throw new Error("categories failed"); return res; })
      .then(res => res.json())
      .then(data => setAvailableCategories(data))
      .catch(() => {});
  }, []);

  const handleSkillChange = (categoryId) => {
    setSelectedSkills(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!fullName || !username || !password || !role) {
      setError('Please fill in all required fields.');
      handleLoginFail();
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      handleLoginFail();
      return;
    }
    if (role === 'assignee' && selectedSkills.length === 0) {
      setError('Please specify your skills/expertise.');
      return;
    }

    const formData = new FormData();
    formData.append('fullName', fullName);
    formData.append('username', username);
    formData.append('email', email);
    formData.append('password', password);
    formData.append('role', role);
    formData.append('skills', role === 'assignee' ? JSON.stringify(selectedSkills) : '[]');
    formData.append('captchaToken', captchaToken);
    if (profileImage) formData.append('profileImage', profileImage);

    try {
      const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Registration failed.');
        handleLoginFail();
        return;
      }

      if (data.isPending) {
        Swal.fire({
          title: 'Registration Successful!',
          text: 'Your account has been created. However, an administrator must approve your account before you can log in.',
          icon: 'info',
          confirmButtonText: 'Go to Login',
          confirmButtonColor: '#0d6efd',
        }).then(() => goToLogIn());
      } else {
        Swal.fire({
          title: 'Success!',
          text: 'Account created successfully.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false,
        }).then(() => onSuccess());
      }
    } catch (err) {
      setError('Network error: Could not connect to server.');
    }
  };

  return (
    <div style={{ width: "90%", maxWidth: "420px", background: "rgba(0,0,0,0.3)", backdropFilter: "blur(25px)", borderRadius: "20px", padding: "2.5rem", border: "1px solid rgba(255,255,255,0.1)", margin: "80px 0 20px 0" }}>
      <h2 style={{ color: "#fff", fontSize: "2rem", margin: 0, fontWeight: "800" }}>CREATE ACCOUNT</h2>
      <p style={{ color: "#DADADA", fontSize: "0.9rem", marginBottom: "1.5rem" }}>Create your account and experience smarter, faster support with CEiVoice.</p>

      {error && <p style={errorStyle}>{error}</p>}

      <label style={labelStyle}>Full Name</label>
      <input value={fullName} onChange={e => setFullName(e.target.value)} style={inputStyle} placeholder="Your Full Name" />

      <label style={labelStyle}>Username</label>
      <input value={username} onChange={e => setUsername(e.target.value)} style={inputStyle} placeholder="Your Username" />

      <label style={labelStyle}>Email</label>
      <input value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} placeholder="Your Email" type="email" />

      <label style={labelStyle}>Password</label>
      <div style={{ position: "relative" }}>
        <input value={password} onChange={e => setPassword(e.target.value)} style={inputStyle} type={showPassword ? "text" : "password"} placeholder="Min. 8 characters" />
        <div onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: 15, top: 14, color: "#999", cursor: "pointer" }}>
          {showPassword ? <FiEye /> : <FiEyeOff />}
        </div>
      </div>

      <label style={labelStyle}>Role</label>
      <select value={role} onChange={e => setRole(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
        <option value="user">User</option>
        <option value="assignee">Assignee</option>
      </select>

      {role === 'assignee' && availableCategories.length > 0 && (
        <>
          <label style={labelStyle}>Skills / Expertise</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "1.2rem" }}>
            {availableCategories.map(cat => (
              <div
                key={cat.id}
                onClick={() => handleSkillChange(cat.id)}
                style={{
                  padding: "6px 14px", borderRadius: "20px", cursor: "pointer", fontSize: "0.85rem", fontWeight: 500,
                  background: selectedSkills.includes(cat.id) ? "#F36601" : "rgba(255,255,255,0.15)",
                  color: "#fff", border: selectedSkills.includes(cat.id) ? "1px solid #F36601" : "1px solid rgba(255,255,255,0.3)",
                  transition: "all 0.2s",
                }}
              >
                {cat.name}
              </div>
            ))}
          </div>
        </>
      )}

      <label style={labelStyle}>Profile Image (optional)</label>
      <input
        type="file" accept="image/*"
        onChange={e => setProfileImage(e.target.files[0])}
        style={{ ...inputStyle, padding: "0.6rem 1rem", cursor: "pointer" }}
      />

      <ReCAPTCHA
        ref={recaptchaRef}
        sitekey="6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"
        theme="dark"
        onChange={token => setCaptchaToken(token)}
        onExpired={() => setCaptchaToken(null)}
        style={{ marginBottom: "1.5rem", transform: "scale(0.85)", transformOrigin: "0 0" }}
      />

      <button onClick={handleSubmit} style={btnStyle}>CREATE ACCOUNT</button>

      <p style={{ color: "#fff", textAlign: "center", marginTop: "1.5rem", fontSize: "0.85rem" }}>
        Already have an account?{" "}
        <span onClick={goToLogIn} style={{ color: "#FFB000", cursor: "pointer", fontWeight: "bold" }}>Login</span>
      </p>
    </div>
  );
}

// ── Shared styles ─────────────────────────────────────────────────────────────
const labelStyle = {
  color: "#FFB000", fontSize: "0.75rem", fontWeight: "bold",
  textTransform: "uppercase", marginBottom: "8px", display: "block",
};

const inputStyle = {
  width: "100%", padding: "0.85rem 1rem", marginBottom: "1.2rem",
  borderRadius: "10px", border: "none", background: "#fff",
  color: "#333", fontSize: "1rem", boxSizing: "border-box",
};

const btnStyle = {
  width: "100%", padding: "0.75rem", borderRadius: "10px",
  border: "none", background: "#F36601", color: "#fff",
  fontWeight: "bold", cursor: "pointer", fontSize: "1rem",
};

const errorStyle = {
  color: "#ff6b6b", fontSize: "0.85rem", marginBottom: "1rem",
  background: "rgba(255,0,0,0.1)", padding: "0.5rem 1rem", borderRadius: "8px",
};