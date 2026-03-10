import React, { useState, useEffect, useRef } from "react";
import { FiEye, FiEyeOff, FiChevronRight, FiChevronLeft } from "react-icons/fi";
import ReCAPTCHA from "react-google-recaptcha";
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import Swal from 'sweetalert2';

const API_URL = process.env.REACT_APP_API_URL;

/* ─── Responsive breakpoint hook ─────────────────────────────────────── */
function useBreakpoint() {
  const [width, setWidth] = useState(window.innerWidth);
  useEffect(() => {
    const fn = () => setWidth(window.innerWidth);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return {
    isTiny:   width < 400,   // 360–399
    isMobile: width < 640,   // 400–639
    isTablet: width < 1024,  // 640–1023
    width,
  };
}

/* ─── Root component ─────────────────────────────────────────────────── */
export default function Login({ onLogin, goToSignUp }) {
  const [isRegister, setIsRegister] = useState(false);
  const { isMobile, isTablet } = useBreakpoint();

  return (
    <div style={{
      position: "fixed", top: 0, left: 0,
      width: "100vw", height: "100vh",
      overflow: "hidden",
      fontFamily: "'Nunito', sans-serif",
    }}>
      {/* ── Navbar ── */}
      <nav style={{
        position: "absolute", top: 0, left: 0,
        width: "100%", height: "60px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: isMobile ? "0 1rem" : "0 3rem",
        boxSizing: "border-box", zIndex: 200,
        background: "rgba(0,0,0,0.35)", backdropFilter: "blur(10px)",
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", minWidth: 0 }}>
          <img
            src="/Ceiwhitelogo.png" alt="Logo"
            style={{ width: "36px", height: "32px", flexShrink: 0, objectFit: "contain",
              filter: "drop-shadow(0px 2px 4px rgba(0,0,0,0.4))" }}
          />
          <span style={{
            fontFamily: "'Hammersmith One', sans-serif",
            fontSize: isMobile ? "16px" : "20px",
            color: "#fff", fontWeight: "400",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            filter: "drop-shadow(0px 2px 4px rgba(0,0,0,0.3))",
          }}>
            Voice System
          </span>
        </div>

        {/* Nav links — hide on small mobile */}
        {!isMobile && (
          <div style={{ display: "flex", gap: "1.5rem", flexShrink: 0 }}>
            <NavLink active={!isRegister} onClick={() => setIsRegister(false)}>Login</NavLink>
            <NavLink active={isRegister}  onClick={() => setIsRegister(true)}>Register</NavLink>
          </div>
        )}

        {/* Mobile tab switcher */}
        {isMobile && (
          <div style={{ display: "flex", gap: "4px", background: "rgba(255,255,255,0.1)",
            borderRadius: "20px", padding: "3px", flexShrink: 0 }}>
            {["Login","Register"].map((label, i) => (
              <button
                key={label}
                onClick={() => setIsRegister(i === 1)}
                style={{
                  background: isRegister === (i === 1) ? "#F36601" : "transparent",
                  color: "#fff", border: "none", borderRadius: "17px",
                  padding: "4px 12px", fontSize: "0.78rem", fontWeight: 700,
                  cursor: "pointer", transition: "background 0.2s",
                }}
              >{label}</button>
            ))}
          </div>
        )}
      </nav>

      {/* ── Center toggle button (desktop only) ── */}
      {!isTablet && (
        <button
          onClick={() => setIsRegister(v => !v)}
          style={{
            position: "absolute", top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            width: "52px", height: "52px", borderRadius: "50%",
            background: "rgba(255,255,255,0.12)",
            border: "1px solid rgba(255,255,255,0.3)",
            backdropFilter: "blur(10px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", zIndex: 150, color: "#fff",
          }}
        >
          {isRegister ? <FiChevronLeft size={22} /> : <FiChevronRight size={22} />}
        </button>
      )}

      {/* ── Slider container ── */}
      <div style={{ width: "100vw", height: "100vh", overflow: "hidden" }}>
        <div style={{
          display: "flex", width: "200vw", height: "100vh",
          transition: "transform 0.75s cubic-bezier(0.65,0,0.35,1)",
          transform: isRegister ? "translateX(-100vw)" : "translateX(0)",
          willChange: "transform",
        }}>

          {/* ══ LOGIN PANEL ══ */}
          <Panel isMobile={isMobile} reverse={false}>
            <PanelGradient isMobile={isMobile}>
              <LoginForm onLogin={onLogin} goToSignUp={() => setIsRegister(true)} isMobile={isMobile} />
            </PanelGradient>
          </Panel>

          {/* ══ REGISTER PANEL ══ */}
          <Panel isMobile={isMobile} reverse={true}>
            <PanelGradient isMobile={isMobile}>
              <SignUpForm
                onSuccess={() => setIsRegister(false)}
                goToLogIn={() => setIsRegister(false)}
                isMobile={isMobile}
              />
            </PanelGradient>
          </Panel>

        </div>
      </div>
    </div>
  );
}

/* ─── Layout sub-components ──────────────────────────────────────────── */
const BG_IMAGE = 'url("https://i.pinimg.com/1200x/d4/32/30/d4323062065c96e06e794370cfc01571.jpg")';
const GRADIENT = "linear-gradient(135deg, #FFD88E 0%, #FFB000 10%, #F36601 20%, #530A0A 45%, #000000 100%)";

function Panel({ isMobile, reverse, children }) {
  /* On mobile: stack vertically — image top (30%), form bottom (70%)
     On desktop: side by side 50/50, image on the "outer" side            */
  const image = (
    <div style={{
      flex: isMobile ? "0 0 30%" : 1,
      backgroundImage: BG_IMAGE,
      backgroundSize: "cover",
      backgroundPosition: "center",
    }} />
  );
  const form = (
    <div style={{
      flex: isMobile ? "0 0 70%" : 1,
      background: GRADIENT,
      display: "flex", alignItems: isMobile ? "flex-start" : "center",
      justifyContent: "center", overflowY: "auto",
    }}>
      {children}
    </div>
  );

  return (
    <div style={{
      width: "100vw", height: "100vh", flexShrink: 0,
      display: "flex",
      flexDirection: isMobile ? "column" : "row",
    }}>
      {/* reverse: for register panel the gradient is on the left on desktop */}
      {reverse && !isMobile ? <>{form}{image}</> : <>{image}{form}</>}
      {/* mobile always: image on top, form below */}
      {isMobile && <>{image}{form}</>}
    </div>
  );
}

/* Thin wrapper so children can scroll inside the gradient area */
function PanelGradient({ isMobile, children }) {
  return (
    <div style={{
      width: "100%",
      display: "flex", justifyContent: "center",
      padding: isMobile ? "0 0 1.5rem 0" : "0",
    }}>
      {children}
    </div>
  );
}

function NavLink({ active, onClick, children }) {
  return (
    <span onClick={onClick} style={{
      color: active ? "#FFB000" : "#fff",
      fontWeight: active ? 700 : 500,
      fontSize: "0.95rem",
      cursor: "pointer",
      transition: "color 0.2s",
    }}>{children}</span>
  );
}

/* ─── LOGIN FORM ─────────────────────────────────────────────────────── */
function LoginForm({ onLogin, goToSignUp, isMobile }) {
  const recaptchaRef = useRef(null);
  const [username, setUsername]         = useState('');
  const [password, setPassword]         = useState('');
  const [captchaToken, setCaptchaToken] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]               = useState('');

  const resetCaptcha = () => {
    setCaptchaToken(null);
    recaptchaRef.current?.reset();
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setError('');
    if (!username.trim() || !password.trim()) {
      setError('Please enter username and password.');
      resetCaptcha(); return;
    }
    if (!captchaToken) { setError('Please verify that you are not a robot.'); return; }
    try {
      const res  = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, captchaToken }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || 'Login failed.'); resetCaptcha(); return; }
      saveAndLogin(data.user, onLogin);
    } catch { setError('Network error: Could not connect to the server.'); }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const decoded = jwtDecode(credentialResponse.credential);
      const res  = await fetch(`${API_URL}/google-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: credentialResponse.credential, profileImage: decoded.picture }),
      });
      const data = await res.json();
      if (res.ok) saveAndLogin(data.user, onLogin);
      else setError(data.message || 'Google login failed.');
    } catch { setError('Failed to connect to server during Google login.'); }
  };

  return (
    <FormCard isMobile={isMobile}>
      <h2 style={headingStyle}>USER LOGIN</h2>
      <p style={subStyle}>Welcome back to CeiVoice</p>

      {error && <ErrorBox>{error}</ErrorBox>}

      <Field label="Username">
        <Input value={username} onChange={e => setUsername(e.target.value)}
          placeholder="e.g. Rick Astley"
          onKeyDown={e => e.key === 'Enter' && handleSubmit(e)} />
      </Field>

      <Field label="Password">
        <PasswordInput value={password} onChange={e => setPassword(e.target.value)}
          show={showPassword} toggle={() => setShowPassword(v => !v)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit(e)} />
      </Field>

      <CaptchaWrapper isMobile={isMobile}>
        <ReCAPTCHA ref={recaptchaRef} sitekey="6LeQBlssAAAAAFZTj22xDHurWEaMtcsTyngKlH4H"
          theme="dark" onChange={setCaptchaToken} onExpired={() => setCaptchaToken(null)} />
      </CaptchaWrapper>

      <Btn onClick={handleSubmit}>LOGIN</Btn>
      <Divider />

      <div style={{ display: "flex", justifyContent: "center" }}>
        <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => setError("Google Login Failed.")}
          shape="pill" theme="outline" />
      </div>

      <Foot>Don't have an account? <Anchor onClick={goToSignUp}>Register</Anchor></Foot>
    </FormCard>
  );
}

/* ─── SIGN UP FORM ───────────────────────────────────────────────────── */
function SignUpForm({ onSuccess, goToLogIn, isMobile }) {
  const recaptchaRef = useRef(null);
  const [fullName,    setFullName]    = useState('');
  const [username,    setUsername]    = useState('');
  const [password,    setPassword]    = useState('');
  const [email,       setEmail]       = useState('');
  const [role,        setRole]        = useState('user');
  const [profileImage,setProfileImage]= useState(null);
  const [error,       setError]       = useState('');
  const [showPass,    setShowPass]    = useState(false);
  const [captchaToken,setCaptchaToken]= useState(null);
  const [categories,  setCategories]  = useState([]);
  const [skills,      setSkills]      = useState([]);

  const resetCaptcha = () => { setCaptchaToken(null); recaptchaRef.current?.reset(); };

  useEffect(() => {
    fetch(`${API_URL}/categories`).then(r => r.json()).then(setCategories).catch(() => {});
  }, []);

  const toggleSkill = (id) =>
    setSkills(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setError('');
    if (!fullName || !username || !password || !role) {
      setError('Please fill in all required fields.'); resetCaptcha(); return;
    }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); resetCaptcha(); return; }
    if (!captchaToken) { setError('Please verify that you are not a robot.'); return; }
    if (role === 'assignee' && skills.length === 0) {
      setError('Please select at least one skill.'); return;
    }
    const fd = new FormData();
    fd.append('fullName', fullName); fd.append('username', username);
    fd.append('email', email);       fd.append('password', password);
    fd.append('role', role);
    fd.append('skills', role === 'assignee' ? JSON.stringify(skills) : '[]');
    fd.append('captchaToken', captchaToken);
    if (profileImage) fd.append('profileImage', profileImage);

    try {
      const res  = await fetch(`${API_URL}/register`, { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) { setError(data.message || 'Registration failed.'); resetCaptcha(); return; }
      if (data.isPending) {
        Swal.fire({ title: 'Registration Successful!',
          text: 'An administrator must approve your account before you can log in.',
          icon: 'info', confirmButtonText: 'Go to Login', confirmButtonColor: '#F36601',
        }).then(goToLogIn);
      } else {
        Swal.fire({ title: 'Success!', text: 'Account created successfully.',
          icon: 'success', timer: 2000, showConfirmButton: false,
        }).then(onSuccess);
      }
    } catch { setError('Network error: Could not connect to server.'); }
  };

  return (
    <FormCard isMobile={isMobile}>
      <h2 style={headingStyle}>CREATE AN ACCOUNT</h2>
      <p style={subStyle}>Create your account and experience smarter, faster support with CEiVoice.</p>

      {error && <ErrorBox>{error}</ErrorBox>}

      <Field label="Full Name">
        <Input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="e.g. Rick Astley" />
      </Field>
      <Field label="Username">
        <Input value={username} onChange={e => setUsername(e.target.value)} placeholder="e.g. rick_astley" />
      </Field>
      <Field label={<>Email <Muted>(optional — for notifications)</Muted></>}>
        <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="e.g. rick@example.com" type="email" />
      </Field>
      <Field label="Password">
        <PasswordInput value={password} onChange={e => setPassword(e.target.value)}
          show={showPass} toggle={() => setShowPass(v => !v)} placeholder="Minimum 8 characters" />
      </Field>

      <Field label="Register as">
        <div style={{ display: "flex", gap: "0.6rem" }}>
          {['user','assignee'].map(r => (
            <RoleBtn key={r} active={role === r} onClick={() => setRole(r)}>
              {r === 'user' ? 'User (Client)' : 'Assignee (Worker)'}
            </RoleBtn>
          ))}
        </div>
      </Field>

      {role === 'assignee' && categories.length > 0 && (
        <Field label="Skills / Expertise">
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {categories.map(cat => (
              <SkillTag key={cat.id} active={skills.includes(cat.id)} onClick={() => toggleSkill(cat.id)}>
                {cat.name}
              </SkillTag>
            ))}
          </div>
        </Field>
      )}

      <Field label={<>Profile Image <Muted>(optional)</Muted></>}>
        <input type="file" accept="image/*" onChange={e => setProfileImage(e.target.files[0])}
          style={{ ...inputStyle, padding: "0.55rem 0.85rem", cursor: "pointer", fontSize: "0.85rem" }} />
      </Field>

      <CaptchaWrapper isMobile={isMobile}>
        <ReCAPTCHA ref={recaptchaRef} sitekey="6LeQBlssAAAAAFZTj22xDHurWEaMtcsTyngKlH4H"
          theme="dark" onChange={setCaptchaToken} onExpired={() => setCaptchaToken(null)} />
      </CaptchaWrapper>

      <Btn onClick={handleSubmit}>CREATE ACCOUNT</Btn>
      <Foot>Already have an account? <Anchor onClick={goToLogIn}>Login</Anchor></Foot>
    </FormCard>
  );
}

/* ─── Utility: save user to localStorage + call onLogin ─────────────── */
function saveAndLogin(user, onLogin) {
  localStorage.setItem('todo_user_id',    user.id);
  localStorage.setItem('todo_username',   user.username);
  localStorage.setItem('todo_profile',    user.profileImage || '');
  localStorage.setItem('todo_user_role',  user.role);
  localStorage.setItem('todo_user_email', user.email);
  onLogin(user.username, user.profileImage, user.id, user.role, user.email);
}

/* ─── Small reusable components ──────────────────────────────────────── */
function FormCard({ isMobile, children }) {
  return (
    <div style={{
      width: "calc(100% - 2rem)",
      maxWidth: "420px",
      background: "rgba(0,0,0,0.35)",
      backdropFilter: "blur(25px)",
      borderRadius: isMobile ? "16px" : "20px",
      padding: isMobile ? "1.4rem 1.2rem" : "2.5rem",
      border: "1px solid rgba(255,255,255,0.12)",
      margin: isMobile ? "70px auto 1.2rem auto" : "90px auto 1.5rem auto",
      boxSizing: "border-box",
    }}>
      {children}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: "1rem" }}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

function Input({ style: extraStyle, ...props }) {
  return (
    <input
      style={{ ...inputStyle, ...extraStyle }}
      {...props}
    />
  );
}

function PasswordInput({ value, onChange, show, toggle, onKeyDown, placeholder }) {
  return (
    <div style={{ position: "relative" }}>
      <input value={value} onChange={onChange} onKeyDown={onKeyDown}
        style={{ ...inputStyle, marginBottom: 0, paddingRight: "2.8rem" }}
        type={show ? "text" : "password"}
        placeholder={placeholder || "Minimum 8 characters"}
      />
      <button onClick={toggle} type="button" style={{
        position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
        background: "none", border: "none", color: "#888", cursor: "pointer",
        display: "flex", alignItems: "center", padding: 0,
      }}>
        {show ? <FiEyeOff size={17} /> : <FiEye size={17} />}
      </button>
    </div>
  );
}

function CaptchaWrapper({ isMobile, children }) {
  /* Scale down reCAPTCHA on very small screens */
  const scale = isMobile ? 0.78 : 0.85;
  return (
    <div style={{
      marginBottom: "1rem",
      transform: `scale(${scale})`,
      transformOrigin: "0 0",
      /* compensate for lost height so layout stays tight */
      height: `${74 * scale}px`,
      overflow: "hidden",
    }}>
      {children}
    </div>
  );
}

function Btn({ onClick, children }) {
  return (
    <button onClick={onClick} type="button" style={{
      width: "100%", padding: "0.75rem",
      borderRadius: "10px", border: "none",
      background: "linear-gradient(90deg,#F36601,#FFB000)",
      color: "#fff", fontWeight: 700,
      fontSize: "0.95rem", cursor: "pointer",
      letterSpacing: "0.04em",
      transition: "opacity 0.2s",
    }}
      onMouseEnter={e => e.currentTarget.style.opacity = "0.88"}
      onMouseLeave={e => e.currentTarget.style.opacity = "1"}
    >
      {children}
    </button>
  );
}

function RoleBtn({ active, onClick, children }) {
  return (
    <div onClick={onClick} style={{
      flex: 1, padding: "0.55rem 0.4rem",
      borderRadius: "10px", cursor: "pointer",
      textAlign: "center", fontSize: "0.82rem", fontWeight: 700,
      background: active ? "#F36601" : "rgba(255,255,255,0.1)",
      color: "#fff",
      border: active ? "1px solid #F36601" : "1px solid rgba(255,255,255,0.2)",
      transition: "all 0.2s",
      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
    }}>
      {children}
    </div>
  );
}

function SkillTag({ active, onClick, children }) {
  return (
    <div onClick={onClick} style={{
      padding: "5px 12px", borderRadius: "20px",
      cursor: "pointer", fontSize: "0.8rem", fontWeight: 600,
      background: active ? "#F36601" : "rgba(255,255,255,0.12)",
      color: "#fff",
      border: active ? "1px solid #F36601" : "1px solid rgba(255,255,255,0.25)",
      transition: "all 0.18s",
    }}>
      {children}
    </div>
  );
}

function Divider() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", margin: "0.9rem 0" }}>
      <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.18)" }} />
      <span style={{ color: "#fff", opacity: 0.7, fontSize: "0.8rem" }}>OR</span>
      <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.18)" }} />
    </div>
  );
}

function ErrorBox({ children }) {
  return (
    <p style={{
      color: "#ff6b6b", fontSize: "0.82rem", margin: "0 0 0.9rem 0",
      background: "rgba(255,0,0,0.12)", padding: "0.5rem 0.9rem",
      borderRadius: "8px", lineHeight: 1.4,
    }}>
      {children}
    </p>
  );
}

function Foot({ children }) {
  return (
    <p style={{ color: "#fff", textAlign: "center", marginTop: "1.2rem",
      fontSize: "0.82rem", lineHeight: 1.5 }}>
      {children}
    </p>
  );
}

function Anchor({ onClick, children }) {
  return (
    <span onClick={onClick} style={{ color: "#FFB000", cursor: "pointer", fontWeight: 700 }}>
      {children}
    </span>
  );
}

function Muted({ children }) {
  return <span style={{ color: "#999", textTransform: "none", fontWeight: "normal" }}>{children}</span>;
}

/* ─── Shared styles ──────────────────────────────────────────────────── */
const labelStyle = {
  color: "#FFB000", fontSize: "0.72rem", fontWeight: 700,
  textTransform: "uppercase", letterSpacing: "0.05em",
  marginBottom: "6px", display: "block",
};

const inputStyle = {
  width: "100%", padding: "0.75rem 0.9rem",
  borderRadius: "10px", border: "none",
  background: "#fff", color: "#333",
  fontSize: "0.9rem", boxSizing: "border-box",
  outline: "none",
};

const headingStyle = {
  color: "#fff", fontSize: "clamp(1.5rem, 5vw, 2rem)",
  margin: "0 0 4px 0", fontWeight: 800,
};

const subStyle = {
  color: "#DADADA", fontSize: "clamp(0.8rem, 2.5vw, 0.95rem)",
  marginBottom: "1.4rem", lineHeight: 1.4,
};