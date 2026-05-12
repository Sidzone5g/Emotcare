import { GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./firebase.js";
import { supabase } from "./supabase.js";

function initSlider() {
  const testiGrid = document.querySelector('.testi-grid');
  if (!testiGrid) return;

  // Wrap the grid in an overflow hidden container to clip the cards outside the view
  const wrapper = document.createElement('div');
  wrapper.style.overflow = 'hidden';
  wrapper.style.width = '100%';
  // Add padding to prevent hover transforms (translateY) from being cut off
  wrapper.style.padding = '10px 0'; 
  wrapper.style.marginTop = '38px';
  
  // Remove the grid's original margin-top as it's now applied to the wrapper
  testiGrid.style.marginTop = '0';
  
  testiGrid.parentNode.insertBefore(wrapper, testiGrid);
  wrapper.appendChild(testiGrid);

  // Convert the CSS Grid to a Flex row for horizontal scrolling
  testiGrid.style.display = 'flex';
  testiGrid.style.flexWrap = 'nowrap';
  testiGrid.style.gap = '20px';
  testiGrid.style.width = 'max-content';
  testiGrid.style.gridTemplateColumns = 'none';

  // Fix width of each card so they don't shrink
  const cardWidth = 350; 
  const originalCards = Array.from(testiGrid.children);
  
  originalCards.forEach(card => {
    card.style.flex = `0 0 ${cardWidth}px`;
    card.style.width = `${cardWidth}px`;
  });

  // Clone the cards to append at the end to create a seamless infinite loop
  originalCards.forEach(card => {
    const clone = card.cloneNode(true);
    testiGrid.appendChild(clone);
  });

  let currentTranslate = 0;
  let isPaused = false;
  const speed = 1.2; // Sliding speed in pixels per frame
  const gap = 20; // Must match the gap applied above
  const totalOriginalWidth = (cardWidth + gap) * originalCards.length;

  // Pause on hover for better user experience
  testiGrid.addEventListener('mouseenter', () => isPaused = true);
  testiGrid.addEventListener('mouseleave', () => isPaused = false);
  
  // Pause on touch for mobile devices
  testiGrid.addEventListener('touchstart', () => isPaused = true, {passive: true});
  testiGrid.addEventListener('touchend', () => isPaused = false);

  function animate() {
    if (!isPaused) {
      currentTranslate -= speed;
      
      // When the original cards have scrolled completely out of view,
      // seamlessly jump back to the start without any visual delay.
      if (Math.abs(currentTranslate) >= totalOriginalWidth) {
         currentTranslate += totalOriginalWidth; 
      }

      testiGrid.style.transform = `translateX(${currentTranslate}px)`;
    }
    requestAnimationFrame(animate);
  }

  // Start the animation loop
  requestAnimationFrame(animate);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSlider);
} else {
  initSlider();
}

const googleProvider = new GoogleAuthProvider();

export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    console.log("User:", result.user);
    // You can redirect to dashboard here on success
    
    window.showPage('dashboard');
  } catch (error) {
    console.error(error);
    alert('Error logging in with Google: ' + error.message);
  }
};



export const submitEmailLogin = async () => {
  const email = document.getElementById('login-email-input').value;
  const password = document.getElementById('login-password-input').value;
  
  if (!email || !password) {
    alert('Please enter both email and password.');
    return;
  }
  
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    console.log("Email User:", result.user);
    // onAuthStateChanged will handle redirect
  } catch (error) {
    console.error(error);
    alert('Error logging in with Email: ' + error.message);
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
    window.showPage('home');
  } catch (error) {
    console.error("Error logging out:", error);
  }
};

let currentProfile = null; // Store it globally

const PLAN_DETAILS = {
  "TRIAL RECOVERY": {
    price: "Rs. 49 / 7 days",
    benefits: "1 counselling session, 7 days chat support, and one extra 10 minute session."
  },
  "RECOVERY": {
    price: "Rs. 99 / 28 days",
    benefits: "2 counselling sessions, music therapy, 28 days chat support, and one extra 10 minute session."
  },
  "STUDENT RECOVERY": {
    price: "Rs. 199 / month",
    benefits: "4 counselling sessions, music therapy, video guidance, 24/7 chat support, and one extra 20 minute session."
  },
  "CAREER COUNSELLING": {
    price: "Rs. 249 / 30 days",
    benefits: "3 one-hour counselling sessions, career trial resources, 30 days chat support, and one extra 20 minute session."
  }
};

function getProfilePlan(profile) {
  const planName = profile?.plan_purchased;
  return PLAN_DETAILS[planName] ? planName : null;
}

function formatPlanDate(value) {
  if (!value) return "No renewal date";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No renewal date";

  return `Renews on ${date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  })}`;
}

function setPlanStatus(status) {
  const statusEl = document.getElementById('dash-plan-status');
  if (!statusEl) return;

  const normalized = status || 'inactive';
  const isActive = normalized === 'active';
  statusEl.textContent = isActive ? 'Active' : normalized.replace(/_/g, ' ');
  statusEl.style.background = isActive ? 'rgba(110,231,183,0.1)' : 'rgba(255,255,255,0.08)';
  statusEl.style.color = isActive ? 'var(--mint)' : 'var(--text-muted)';
}

function updateDashboardProfile(profile) {
  if (!profile) return;

  const nameEl = document.getElementById('dash-name');
  const universityEl = document.getElementById('dash-university');
  if (nameEl) nameEl.textContent = ', ' + (profile.name || 'Student');
  if (universityEl) universityEl.textContent = profile.university || 'University not set';

  const planName = getProfilePlan(profile);
  const status = profile.subscription_status || (planName ? 'active' : 'inactive');
  const details = planName ? PLAN_DETAILS[planName] : null;

  const planEl = document.getElementById('dash-plan');
  const priceEl = document.getElementById('dash-plan-price');
  const renewalEl = document.getElementById('dash-plan-renewal');
  const benefitsEl = document.getElementById('dash-plan-benefits');

  if (planEl) planEl.textContent = planName || 'No Plan Selected';
  if (priceEl) priceEl.textContent = details?.price || 'Choose a plan to begin';
  if (renewalEl) renewalEl.textContent = planName ? formatPlanDate(profile.current_period_end) : 'No renewal date';
  if (benefitsEl) benefitsEl.textContent = details?.benefits || 'Your plan benefits will appear here after purchase.';
  setPlanStatus(status);
}

async function fetchProfileFromDatabase(userId) {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return profile;
}

export const refreshProfileFromDatabase = async () => {
  const user = auth.currentUser;
  if (!user) return;

  try {
    const profile = await fetchProfileFromDatabase(user.uid);
    currentProfile = profile;
    updateDashboardProfile(profile);
  } catch (error) {
    console.error("Error refreshing profile:", error);
    alert("Could not refresh your profile. Please try again.");
  }
};

// Listen for auth state changes to persist login
onAuthStateChanged(auth, async (user) => {
  if (user) {
    console.log("User is logged in:", user.email);
    
    // Update navigation
    if (document.getElementById('nav-login')) document.getElementById('nav-login').style.display = 'none';
    if (document.getElementById('nav-profile-li')) document.getElementById('nav-profile-li').style.display = 'block';
    
    // Fetch profile from Supabase
    let profile = null;
    let error = null;

    try {
      profile = await fetchProfileFromDatabase(user.uid);
    } catch (profileError) {
      error = profileError;
    }
      
    // If no profile exists, create one with default values
    if (!profile) {
      const newProfile = {
        id: user.uid,
        name: user.displayName || 'Student',
        email: user.email,
        phone: user.phoneNumber || '',
        university: 'University not set',
        plan_purchased: null,
        subscription_status: 'inactive'
      };
      
      const { data: createdProfile, error: createError } = await supabase
        .from('profiles')
        .insert([newProfile])
        .select()
        .single();
        
      if (createError) {
        console.error("Error creating profile:", createError);
      } else {
        profile = createdProfile;
      }
    }
    
    if (!profile) {
      console.error("Profile could not be loaded or created.", error);
      alert("Could not load your profile. Please refresh and try again.");
      return;
    }

    currentProfile = profile; // Save to global variable
    
    updateDashboardProfile(profile);
    
    // Redirect logic: If profile is incomplete, go to onboarding. Else dashboard.
    if (typeof window.showPage === 'function') {
      if (profile.university === 'University not set' || profile.phone === '') {
        // Pre-fill form if data exists
        if (profile.name !== 'Student') document.getElementById('onboard-name').value = profile.name;
        if (profile.phone) document.getElementById('onboard-phone').value = profile.phone;
        if (profile.university !== 'University not set') document.getElementById('onboard-university').value = profile.university;
        document.getElementById('onboarding-title').textContent = 'Complete Your Profile';
        document.getElementById('onboarding-btn').textContent = 'Save Profile & Continue';
        window.showPage('onboarding');
      } else {
        window.showPage('dashboard');
      }
    }
  } else {
    // User is logged out
    
    // Update navigation
    if (document.getElementById('nav-login')) document.getElementById('nav-login').style.display = 'block';
    if (document.getElementById('nav-profile-li')) document.getElementById('nav-profile-li').style.display = 'none';
    
    if (document.getElementById('page-dashboard').classList.contains('active')) {
       window.showPage('home');
    }
  }
});

// Function to save onboarding details
export const saveOnboarding = async () => {
  const name = document.getElementById('onboard-name').value;
  const phone = document.getElementById('onboard-phone').value;
  const university = document.getElementById('onboard-university').value;
  
  if (!name || !phone || !university) {
    alert("Please fill out all fields to continue.");
    return;
  }
  
  const user = auth.currentUser;
  if (!user) return;
  
  // Update in Supabase
  const { error } = await supabase
    .from('profiles')
    .update({ name, phone, university })
    .eq('id', user.uid);
    
  if (error) {
    console.error("Error saving profile:", error);
    alert("Failed to save profile. Please try again.");
    return;
  }
  
  // Update UI and route to dashboard
  document.getElementById('dash-name').textContent = ', ' + name;
  document.getElementById('dash-university').textContent = university;
  
  if (currentProfile) {
    currentProfile.name = name;
    currentProfile.phone = phone;
    currentProfile.university = university;
  }
  
  window.showPage('dashboard');
};

export const openEditProfile = () => {
  if (currentProfile) {
    if (currentProfile.name !== 'Student') document.getElementById('onboard-name').value = currentProfile.name;
    if (currentProfile.phone) document.getElementById('onboard-phone').value = currentProfile.phone;
    if (currentProfile.university !== 'University not set') document.getElementById('onboard-university').value = currentProfile.university;
  }
  
  document.getElementById('onboarding-title').textContent = 'Edit Your Profile';
  document.getElementById('onboarding-btn').textContent = 'Save Changes';
  
  window.showPage('onboarding');
};

// Function to process payment and update plan
export const processPayment = async () => {
  const user = auth.currentUser;
  if (!user) {
    alert("Please log in first to proceed with the payment.");
    window.showPage('login');
    return;
  }
  
  const planName = document.getElementById('pay-plan-name')?.textContent?.trim();
  if (!planName) {
    alert("Invalid plan selected. Please try again.");
    return;
  }

  const superprofileLinks = {
    "TRIAL RECOVERY": "https://superprofile.bio/bookings/mindetmanifeststore?sessionId=69f891b9f9d5cf0013bc6fa6",
    "RECOVERY": "https://superprofile.bio/bookings/mindetmanifeststore?sessionId=69f891b9f9d5cf0013bc6fab",
    "STUDENT RECOVERY": "https://superprofile.bio/bookings/mindetmanifeststore?sessionId=69f891b9f9d5cf0013bc6fb0",
    "CAREER COUNSELLING": "https://superprofile.bio/bookings/mindetmanifeststore?sessionId=69f8ea569642ca0013826a33"
  };

  const redirectUrl = superprofileLinks[planName];
  if (!redirectUrl) {
    alert("Invalid plan selected. Please try again.");
    return;
  }

  window.location.href = redirectUrl;
};

// Make it available globally for the HTML onclick attribute
window.loginWithGoogle = loginWithGoogle;
window.submitEmailLogin = submitEmailLogin;
window.logoutUser = logoutUser;
window.saveOnboarding = saveOnboarding;
window.openEditProfile = openEditProfile;
window.processPayment = processPayment;
window.refreshProfileFromDatabase = refreshProfileFromDatabase;
