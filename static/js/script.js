import { firebaseConfigured, initializeFirebase, auth, db, GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, onAuthStateChanged, signOut, updateProfile, doc, collection, addDoc, getDocs, query, orderBy, serverTimestamp, updateDoc, createUserProfile } from "./firebase-service.js";

console.log("script loaded");

document.addEventListener("DOMContentLoaded", () => {
  const menuButton = document.querySelector(".menu-button"), navLinks = document.querySelector(".nav-links");
  if (menuButton && navLinks) menuButton.addEventListener("click", () => { const open=navLinks.classList.toggle("open"); menuButton.setAttribute("aria-expanded", open); });
  const path=window.location.pathname, protectedPaths=["/dashboard","/habits"];
  let firebaseReady = false;
  let firebaseInitializationError = "";
  const escapeHtml=value=>{const d=document.createElement("div");d.textContent=value;return d.innerHTML;};
  const notice=(id,text)=>{const el=document.querySelector(id);if(el)el.textContent=text;};
  const post=async(url,data)=>{const response=await fetch(url,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});const result=await response.json();if(!response.ok)throw new Error(result.error||"Something went wrong. Please try again.");return result;};

  function authError(error) { const codes={"auth/invalid-credential":"Email or password is incorrect.","auth/email-already-in-use":"This email already has an account.","auth/weak-password":"Use a password with at least 6 characters.","auth/popup-closed-by-user":"Google sign-in was closed before completion.","auth/operation-not-allowed":"This sign-in provider is not enabled in Firebase."}; return codes[error.code] || error.message || "Authentication could not be completed."; }
  function setAuthUi(user) { const displayName=user?.displayName||user?.email||""; const initial=displayName.trim().charAt(0).toUpperCase()||"U"; document.querySelectorAll(".auth-guest").forEach(e=>e.hidden=Boolean(user)); document.querySelectorAll(".auth-user").forEach(e=>e.hidden=!user); document.querySelectorAll(".user-name").forEach(e=>{e.textContent=displayName;e.title=displayName;}); document.querySelectorAll(".user-avatar").forEach(e=>e.textContent=initial); }
  function enableFirebaseFeatures() {
    onAuthStateChanged(auth, async user=>{ setAuthUi(user); if(protectedPaths.includes(path)&&!user){window.location.href="/login?next="+encodeURIComponent(path);return;} if(user){await createUserProfile(user);if(path==="/dashboard")loadCloudDashboard(user);} });
    document.querySelectorAll(".nav-logout").forEach(button=>button.addEventListener("click",async()=>{await signOut(auth);window.location.href="/";}));
  }

  async function startFirebaseInitialization() {
    if (!firebaseConfigured) {
      firebaseInitializationError = "Firebase is not configured yet.";
      setAuthUi(null);
      notice("#auth-notice", firebaseInitializationError);
      return;
    }
    try {
      await initializeFirebase();
      firebaseReady = true;
      console.log("Firebase initialization succeeded");
      enableFirebaseFeatures();
    } catch (error) {
      firebaseInitializationError = "Firebase could not be initialized. Please check the Firebase configuration and connection, then try again.";
      console.error("Firebase initialization failed", error);
      setAuthUi(null);
      notice("#auth-notice", firebaseInitializationError);
    }
  }

  async function googleLogin() { if(!firebaseConfigured)throw new Error("Firebase is not configured yet. Add your Web SDK configuration in static/js/firebase-config.js."); const result=await signInWithPopup(auth,new GoogleAuthProvider()); await createUserProfile(result.user); window.location.href="/dashboard"; }
  const loginForm=document.querySelector("#login-form"); if(loginForm) loginForm.addEventListener("submit",async event=>{event.preventDefault();const form=new FormData(loginForm);notice("#auth-notice","Signing in…");try{if(!firebaseConfigured)throw new Error("Firebase is not configured yet.");await signInWithEmailAndPassword(auth,form.get("email"),form.get("password"));window.location.href=new URLSearchParams(location.search).get("next")||"/dashboard";}catch(error){notice("#auth-notice",authError(error));}});
  const registerForm = document.querySelector("#register-form");
  if (registerForm) {
    registerForm.addEventListener("submit", async event => {
      event.preventDefault();
      console.log("registration attempt");
      const form = new FormData(registerForm);
      if (!firebaseReady) {
        const message = firebaseInitializationError || "Firebase is still initializing. Please wait and try again.";
        notice("#auth-notice", message);
        console.log("registration failed", message);
        return;
      }
      if (form.get("password") !== form.get("confirm_password")) {
        notice("#auth-notice", "Passwords do not match.");
        console.log("registration failed", "Passwords do not match.");
        return;
      }
      notice("#auth-notice", "Creating account...");
      try {
        const result = await createUserWithEmailAndPassword(auth, form.get("email"), form.get("password"));
        await updateProfile(result.user, { displayName: form.get("name") });
        await createUserProfile(auth.currentUser);
        console.log("registration succeeded");
        window.location.href = "/dashboard";
      } catch (error) {
        console.log("registration failed", error);
        notice("#auth-notice", authError(error));
      }
    });
    console.log("register handler attached");
  }
  document.querySelectorAll("#google-login,#google-register").forEach(button=>button.addEventListener("click",async()=>{try{await googleLogin();}catch(error){notice("#auth-notice",authError(error));}}));

  const symptomForm = document.querySelector("#symptom-form");
  if (symptomForm) {
    symptomForm.addEventListener("submit", async event => {
      event.preventDefault();
      console.log("symptom check submit started");

      const box = document.querySelector("#symptom-result");
      const submitButtons = symptomForm.querySelectorAll("button");
      symptomForm.classList.add("symptom-form-loading");
      submitButtons.forEach(button => { button.disabled = true; });
      const form = new FormData(symptomForm);
      const selected = form.getAll("symptoms");
      const payload = {
        selected_symptoms: selected,
        symptoms: form.get("other_symptoms"),
        age: form.get("age"),
        duration: form.get("duration"),
        severity: form.get("severity")
      };
      box.innerHTML = "<div class=\"result-placeholder loading-placeholder\"><span class=\"result-placeholder-icon\" aria-hidden=\"true\">⏳</span><div><h3>Checking your information safely…</h3><p>Please wait while we prepare your educational guidance.</p></div></div>";

      try {
        console.log("symptom API request started");
        const response = await fetch("/api/symptom-check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        console.log("symptom API response received", response.status);

        let result;
        try {
          result = await response.json();
        } catch (error) {
          throw new Error("The symptom service returned an invalid response.");
        }
        if (!response.ok) {
          throw new Error(result.error || "The symptom check could not be completed.");
        }

        const flags = result.matched_flags && result.matched_flags.length
          ? `<p class="matched-flags">Safety terms noticed: ${result.matched_flags.map(escapeHtml).join(", ")}</p>`
          : "";
        const resultClass = result.is_emergency ? "emergency" : result.risk_level.includes("PROFESSIONAL") ? "professional" : "wellness";
        const emergencyText = result.is_emergency ? `<p class="result-action">These symptoms may require urgent professional attention. Seek immediate professional medical care.</p><p class="result-safety">Do not rely on this application for emergency assessment.</p>` : "";
        const resultIcon = result.is_emergency ? "\u{1F6A8}" : resultClass === "professional" ? "i" : "\u2713";
        const emergencyLabel = result.is_emergency ? "\u{1F6A8} " : "";
        box.innerHTML = `<article class="result-card ${resultClass}" ${result.is_emergency ? "role=\"alert\"" : ""}><span class="result-status-icon" aria-hidden="true">${resultIcon}</span><div class="result-content"><h3 class="result-heading">Your Result</h3><span class="risk-label">${emergencyLabel}${escapeHtml(result.risk_level)}</span><p class="result-message">${escapeHtml(result.guidance)}</p>${emergencyText}${flags}</div></article>`;
        console.log("symptom result rendered");
        box.focus({ preventScroll: true });
        box.scrollIntoView({ behavior: "smooth", block: "center" });

        // Cloud saving is intentionally separate: it must never delay or hide the result.
        if (firebaseConfigured && auth?.currentUser && db && typeof addDoc === "function") {
          void (async () => {
            console.log("Firestore symptom save started");
            try {
              await addDoc(collection(db, "users", auth.currentUser.uid, "symptom_checks"), {
                symptoms: [...selected, payload.symptoms].filter(Boolean).join(", "),
                age: payload.age || null,
                duration: payload.duration || null,
                severity: payload.severity || null,
                result: result.guidance,
                safety_level: result.risk_level,
                created_at: serverTimestamp()
              });
              console.log("Firestore symptom save succeeded");
            } catch (error) {
              console.error("Firestore symptom save failed", error);
            }
          })();
        }
      } catch (error) {
        console.error("symptom check failed", error);
        box.innerHTML = `<article class="result-card professional" role="status"><h3 class="result-heading">Your Result</h3><p class="result-message">${escapeHtml(error.message || "Unable to complete the symptom check. Please try again.")}</p></article>`;
        box.focus({ preventScroll: true });
        box.scrollIntoView({ behavior: "smooth", block: "center" });
      } finally {
        symptomForm.classList.remove("symptom-form-loading");
        submitButtons.forEach(button => { button.disabled = false; });
      }
    });
    symptomForm.addEventListener("reset", () => {
      window.setTimeout(() => {
        document.querySelector("#symptom-result").innerHTML = "<div class=\"result-placeholder\"><span class=\"result-placeholder-icon\" aria-hidden=\"true\">✦</span><div><h3>Your Result</h3><p>Your result will appear here after you submit your symptoms.</p></div></div>";
      }, 0);
    });
    console.log("symptom handler attached");
  }

  const wellnessForm=document.querySelector("#wellness-form");if(wellnessForm){const input=document.querySelector("#wellness-message"),messages=document.querySelector("#chat-messages");const send=async message=>{if(!message.trim())return;messages.insertAdjacentHTML("beforeend",`<div class="message user-message">${escapeHtml(message)}</div><div class="message assistant-message loading-message">Thinking…</div>`);input.value="";try{const result=await post("/api/wellness",{message});document.querySelector(".loading-message").remove();messages.insertAdjacentHTML("beforeend",`<div class="message assistant-message">${escapeHtml(result.response)}</div>`);}catch(error){document.querySelector(".loading-message").textContent=error.message;}messages.scrollTop=messages.scrollHeight;};wellnessForm.addEventListener("submit",e=>{e.preventDefault();send(input.value);});document.querySelectorAll(".suggestions button").forEach(b=>b.addEventListener("click",()=>send(b.textContent)));}

  const habitForm=document.querySelector("#habit-form");if(habitForm)habitForm.addEventListener("submit",async event=>{event.preventDefault();const form=new FormData(habitForm);try{if(firebaseConfigured){if(!auth.currentUser)throw new Error("Please login to save habits.");await addDoc(collection(db,"users",auth.currentUser.uid,"habits"),{title:form.get("name"),category:form.get("category"),completed:false,created_at:serverTimestamp(),completed_at:null});}else await post("/api/habits",{name:form.get("name"),category:form.get("category")});notice("#habit-notice","Habit added successfully.");habitForm.reset();}catch(error){notice("#habit-notice",error.message);}});
  async function loadCloudDashboard(user){const root=document.querySelector("#cloud-dashboard");try{const [habits,checks,feedback]=await Promise.all([getDocs(query(collection(db,"users",user.uid,"habits"),orderBy("created_at","desc"))),getDocs(query(collection(db,"users",user.uid,"symptom_checks"),orderBy("created_at","desc"))),getDocs(query(collection(db,"users",user.uid,"feedback"),orderBy("created_at","desc")))]);const list=habits.docs.map(d=>({id:d.id,...d.data()})),done=list.filter(h=>h.completed).length;root.innerHTML=`<div class="stat-grid"><article><span>${done}/${list.length}</span><p>Habits completed</p></article><article><span>${checks.size}</span><p>Private symptom checks</p></article><article><span>${feedback.size}</span><p>Private feedback entries</p></article></div><div class="dashboard-grid"><section class="form-card"><div class="card-heading"><h2>Your habits</h2><a href="/habits">Add habit</a></div><div class="habit-list">${list.length?list.map(h=>`<button class="habit-row ${h.completed?"complete":""}" data-cloud-habit="${h.id}"><span>${h.completed?"✓":"○"}</span><div><b>${escapeHtml(h.title)}</b><small>${escapeHtml(h.category||"General")}</small></div></button>`).join(""):"<p class='empty-state'>No habits yet.</p>"}</div></section><section class="form-card"><h2>Recent symptom checks</h2><div class="recent-list">${checks.docs.length?checks.docs.slice(0,5).map(d=>`<article><b>${escapeHtml(d.data().safety_level)}</b><p>${escapeHtml(d.data().symptoms)}</p></article>`).join(""):"<p class='empty-state'>No saved symptom checks yet.</p>"}</div></section></div>`;root.querySelectorAll("[data-cloud-habit]").forEach(button=>button.addEventListener("click",async()=>{const ref=doc(db,"users",user.uid,"habits",button.dataset.cloudHabit);const complete=!button.classList.contains("complete");await updateDoc(ref,{completed:complete,completed_at:complete?serverTimestamp():null});loadCloudDashboard(user);}));}catch(error){root.innerHTML=`<p class="form-notice">Could not load cloud data: ${escapeHtml(error.message)}</p>`;}}
  if(!firebaseConfigured&&path==="/dashboard") document.querySelector("#cloud-dashboard").innerHTML="<p class='empty-state'>Firebase is not configured. SQLite demo data remains available through the existing API routes.</p>";
  const feedbackForm=document.querySelector("#feedback-form");if(feedbackForm)feedbackForm.addEventListener("submit",async event=>{event.preventDefault();const form=new FormData(feedbackForm),data=Object.fromEntries(form);try{if(firebaseConfigured){if(!auth.currentUser)throw new Error("Please login to save feedback history.");await addDoc(collection(db,"users",auth.currentUser.uid,"feedback"),{rating:Number(data.rating),message:data.feedback,created_at:serverTimestamp()});}else await post("/api/feedback",data);notice("#feedback-notice","Thank you! Your feedback was saved.");feedbackForm.reset();}catch(error){notice("#feedback-notice",error.message);}});
  // Run last: Firebase failures must not prevent form handlers from attaching.
  startFirebaseInitialization();
});
