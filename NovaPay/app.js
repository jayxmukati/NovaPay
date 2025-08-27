
const PAYMENT_LINK = "";
const RAZORPAY_LINK = "";


const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const state = {
  currentUser: null
};

const storage = {
  key: "novapay_users",
  sessionKey: "novapay_session",
  readUsers(){
    try { return JSON.parse(localStorage.getItem(this.key)) || []; }
    catch { return []; }
  },
  writeUsers(list){
    localStorage.setItem(this.key, JSON.stringify(list));
  },
  setSession(email){
    localStorage.setItem(this.sessionKey, JSON.stringify({ email, t: Date.now() }));
  },
  getSession(){
    try { return JSON.parse(localStorage.getItem(this.sessionKey)); }
    catch { return null; }
  },
  clearSession(){
    localStorage.removeItem(this.sessionKey);
  }
};

async function hash(str){
  const enc = new TextEncoder().encode(str);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,"0")).join("");
}

function init(){
  const year = new Date().getFullYear();
  $("#year").textContent = year;

  $("#open-auth")?.addEventListener("click", openAuth);
  $("#open-auth-2")?.addEventListener("click", openAuth);
  $("#btn-login").addEventListener("click", openAuthLogin);
  $("#btn-signup").addEventListener("click", openAuthSignup);
  $("#close-auth").addEventListener("click", closeAuth);
  $("#auth-modal").addEventListener("click", (e)=>{
    if(e.target.tagName === "DIALOG") closeAuth();
  });

  $$(".tab").forEach(tab => {
    tab.addEventListener("click", () => {
      $$(".tab").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      const name = tab.dataset.tab;
      $$(".tab-panel").forEach(p => p.classList.remove("active"));
      $("#tab-" + name).classList.add("active");
    });
  });


  $("#form-signup").addEventListener("submit", onSignup);
  $("#form-login").addEventListener("submit", onLogin);


  $("#btn-logout").addEventListener("click", ()=>{
    storage.clearSession();
    state.currentUser = null;
    renderAuthState();
  });


  $("#btn-pay").addEventListener("click", onPay);
  $("#contact-sales").addEventListener("click", ()=> alert("Thanks! We'll get back to you shortly."));


  const session = storage.getSession();
  if(session?.email){
    const users = storage.readUsers();
    const u = users.find(u => u.email === session.email);
    if(u) state.currentUser = { name: u.name, email: u.email };
  }
  renderAuthState();
}

function renderAuthState(){
  const loggedIn = !!state.currentUser;
  $(".auth-cta").classList.toggle("hidden", loggedIn);
  $("#btn-logout").classList.toggle("hidden", !loggedIn);
  $("#open-auth").textContent = loggedIn ? "Account" : "Get Started";
  $("#open-auth-2").textContent = loggedIn ? "Account" : "Account";
  if(loggedIn){
    $("#open-auth").onclick = openAuthAccount;
    $("#open-auth-2").onclick = openAuthAccount;
  } else {
    $("#open-auth").onclick = openAuth;
    $("#open-auth-2").onclick = openAuth;
  }
}

function openAuth(){ $("#auth-modal").showModal(); }
function closeAuth(){ $("#auth-modal").close(); }

function openAuthLogin(){ openAuth(); activateTab("login"); }
function openAuthSignup(){ openAuth(); activateTab("signup"); }

function openAuthAccount(){
  openAuth();
  activateTab("login");

  if(state.currentUser) $("#login-email").value = state.currentUser.email;
}

function activateTab(name){
  $$(".tab").forEach(t => t.classList.toggle("active", t.dataset.tab === name));
  $$(".tab-panel").forEach(p => p.classList.toggle("active", p.id === "tab-" + name));
}


async function onSignup(e){
  e.preventDefault();
  const name = $("#signup-name").value.trim();
  const email = $("#signup-email").value.trim().toLowerCase();
  const pass = $("#signup-pass").value;

  if(pass.length < 6) return alert("Password must be at least 6 characters.");

  const users = storage.readUsers();
  if(users.some(u => u.email === email)){
    return alert("An account with this email already exists. Please log in.");
  }

  const hashed = await hash(pass + ":" + email);
  users.push({ name, email, pass: hashed, createdAt: Date.now() });
  storage.writeUsers(users);
  storage.setSession(email);
  state.currentUser = { name, email };
  closeAuth();
  renderAuthState();
  alert("Welcome, " + name + "! Your demo account has been created.");
}


async function onLogin(e){
  e.preventDefault();
  const email = $("#login-email").value.trim().toLowerCase();
  const pass = $("#login-pass").value;
  const users = storage.readUsers();
  const user = users.find(u => u.email === email);
  if(!user) return alert("No account found. Please sign up.");
  const hashed = await hash(pass + ":" + email);
  if(user.pass !== hashed) return alert("Incorrect password.");
  storage.setSession(email);
  state.currentUser = { name: user.name, email };
  closeAuth();
  renderAuthState();
  alert("Welcome back, " + user.name + "!");
}


function onPay(){
  if(!state.currentUser){
    openAuthSignup();
    return alert("Please create an account first to continue to payment.");
  }

  const link = PAYMENT_LINK || RAZORPAY_LINK;
  if(!link){
    return alert("Payment link not configured. Open app.js and set PAYMENT_LINK (Stripe) or RAZORPAY_LINK.");
  }

  window.location.href = link;
}


document.addEventListener("DOMContentLoaded", init);