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
    
    showPage('dashboard');
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

// Listen for auth state changes to persist login
onAuthStateChanged(auth, async (user) => {
  if (user) {
    console.log("User is logged in:", user.email);
    
    // Update navigation
    if (document.getElementById('nav-login')) document.getElementById('nav-login').style.display = 'none';
    if (document.getElementById('nav-profile-li')) document.getElementById('nav-profile-li').style.display = 'block';
    
    // Fetch profile from Supabase
    let { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.uid)
      .single();
      
    // If no profile exists, create one with default values
    if (!profile) {
      const newProfile = {
        id: user.uid,
        name: user.displayName || 'Student',
        email: user.email,
        phone: user.phoneNumber || '',
        university: 'University not set',
        plan_purchased: 'Free Plan'
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
    
    currentProfile = profile; // Save to global variable
    
    // Update Dashboard UI
    if (profile) {
      document.getElementById('dash-name').textContent = ', ' + profile.name;
      document.getElementById('dash-university').textContent = profile.university;
      document.getElementById('dash-plan').textContent = profile.plan_purchased;
    }
    
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
  
  const planName = document.getElementById('pay-plan-name').textContent;
  const amountText = document.getElementById('pay-btn-total').textContent;
  const amount = parseInt(amountText);
  
  const customerName = document.getElementById('pay-input-name')?.value || (currentProfile ? currentProfile.name : 'Student');
  const customerEmail = document.getElementById('pay-input-email')?.value || user.email;
  const customerPhone = document.getElementById('pay-input-phone')?.value || (currentProfile ? currentProfile.phone : '');

  const options = {
    "key": "t5eq85Q4O5Gbtzm4CSodA5QS", // Replace with your actual Razorpay Key
    "amount": amount * 100, // Amount is dynamic for all plans
    "currency": "INR",
    "name": "EMOT CARE",
    "description": "Purchase " + planName,
    "handler": async function (response) {
      const transactionId = response.razorpay_payment_id || 'TXN_' + Math.floor(Math.random() * 100000000);

      // Insert payment record in Supabase
      const { error: paymentError } = await supabase.from('payments').insert([{
        user_id: user.uid,
        plan_name: planName,
        amount: amount,
        status: 'completed',
        transaction_id: transactionId
      }]);
      
      if (paymentError) console.error("Payment logging failed:", paymentError);
      
      // Update user profile with the new plan
      const { error: profileError } = await supabase.from('profiles').update({
        plan_purchased: planName
      }).eq('id', user.uid);
      
      if (profileError) {
        console.error("Profile plan update failed:", profileError);
      } else {
        if (currentProfile) currentProfile.plan_purchased = planName;
        const dashPlanEl = document.getElementById('dash-plan');
        if (dashPlanEl) dashPlanEl.textContent = planName;
      }
      
      if (typeof window.showSuccess === 'function') window.showSuccess();
    },
    "prefill": {
      "name": customerName,
      "email": customerEmail,
      "contact": customerPhone
    },
    "theme": {
      "color": "#6C63FF" // Emot Care Violet
    }
  };
  
  if (!window.Razorpay) {
    alert("Razorpay SDK not loaded. Please check your connection.");
    return;
  }
  
  const rzp1 = new window.Razorpay(options);
  
  rzp1.on('payment.failed', function (response){
    alert("Payment failed: " + response.error.description);
  });
  
  rzp1.open();
};

// Make it available globally for the HTML onclick attribute
window.loginWithGoogle = loginWithGoogle;
window.submitEmailLogin = submitEmailLogin;
window.logoutUser = logoutUser;
window.saveOnboarding = saveOnboarding;
window.openEditProfile = openEditProfile;
window.processPayment = processPayment;