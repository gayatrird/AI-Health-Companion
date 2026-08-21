import { firebaseConfig, firebaseConfigured } from "./firebase-config.js";

export { firebaseConfigured };

export let auth = null;
export let db = null;

export let GoogleAuthProvider = null;
export let createUserWithEmailAndPassword = null;
export let signInWithEmailAndPassword = null;
export let signInWithPopup = null;
export let onAuthStateChanged = null;
export let signOut = null;
export let updateProfile = null;

export let doc = null;
export let setDoc = null;
export let getDoc = null;
export let collection = null;
export let addDoc = null;
export let getDocs = null;
export let query = null;
export let orderBy = null;
export let serverTimestamp = null;
export let updateDoc = null;

let firebaseInitialized = false;

export async function initializeFirebase() {
    if (!firebaseConfigured) {
        console.warn("Firebase is not configured.");
        return;
    }

    if (firebaseInitialized) {
        return;
    }

    const [appSdk, authSdk, firestoreSdk] = await Promise.all([
        import("https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js"),
        import("https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js"),
        import("https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js")
    ]);

    const app = appSdk.initializeApp(firebaseConfig);

    auth = authSdk.getAuth(app);
    db = firestoreSdk.getFirestore(app);

    GoogleAuthProvider = authSdk.GoogleAuthProvider;
    createUserWithEmailAndPassword = authSdk.createUserWithEmailAndPassword;
    signInWithEmailAndPassword = authSdk.signInWithEmailAndPassword;
    signInWithPopup = authSdk.signInWithPopup;
    onAuthStateChanged = authSdk.onAuthStateChanged;
    signOut = authSdk.signOut;
    updateProfile = authSdk.updateProfile;

    doc = firestoreSdk.doc;
    setDoc = firestoreSdk.setDoc;
    getDoc = firestoreSdk.getDoc;
    collection = firestoreSdk.collection;
    addDoc = firestoreSdk.addDoc;
    getDocs = firestoreSdk.getDocs;
    query = firestoreSdk.query;
    orderBy = firestoreSdk.orderBy;
    serverTimestamp = firestoreSdk.serverTimestamp;
    updateDoc = firestoreSdk.updateDoc;

    firebaseInitialized = true;

    console.log("Firebase initialized successfully.");
}

export async function createUserProfile(user) {
    if (!user || !db) {
        return;
    }

    const profileRef = doc(db, "users", user.uid);
    const existing = await getDoc(profileRef);

    const profile = {
        uid: user.uid,
        name: user.displayName || "Health Companion User",
        email: user.email || "",
        provider: user.providerData?.[0]?.providerId || "password"
    };

    if (!existing.exists()) {
        profile.created_at = serverTimestamp();
    }

    await setDoc(profileRef, profile, { merge: true });
}