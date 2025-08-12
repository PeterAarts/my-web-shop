<template>
  <div class="verification-container">
    <div v-if="verificationStatus === 'verifying'">
      <h2>Verifying your email...</h2>
      <p>Please wait a moment.</p>
    </div>

    <div v-else-if="verificationStatus === 'success'">
      <h2>✅ Email Verified!</h2>
      <p>Thank you for verifying your email address. You can now log in.</p>
      <router-link to="/login">
        <button class="btn btn-primary">Go to Login</button>
      </router-link>
    </div>

    <div v-else-if="verificationStatus === 'error'">
      <h2>❌ Verification Failed</h2>
      <p>{{ errorMessage }}</p>
      <p>Please try registering again or contact support.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';

// Reactive variables to hold the state of the page
const route = useRoute();
const verificationStatus = ref('verifying'); // 'verifying', 'success', 'error'
const errorMessage = ref('');

// This function runs automatically when the page loads
onMounted(async () => {
  const token = route.params.token;

  if (!token) {
    verificationStatus.value = 'error';
    errorMessage.value = 'No verification token found.';
    return;
  }

  try {
    // CORRECTED: Use import.meta.env for Vite environment variables
    const apiUrl = `${import.meta.env.VITE_API_URL}/auth/verify-email/${token}`;
    
    const response = await fetch(apiUrl);

    // fetch doesn't throw an error on bad HTTP status, so we check it manually
    if (!response.ok) {
      // Try to get the error message from the server's JSON response
      const errorData = await response.json();
      throw new Error(errorData.msg || 'Verification request failed.');
    }
    
    // If the response is OK, update the status to success
    verificationStatus.value = 'success';
    
  } catch (error) {
    // If any step in the try block fails, update the status and display the error
    verificationStatus.value = 'error';
    errorMessage.value = error.message || 'An unknown error occurred.';
  }
});
</script>

<style scoped>
.verification-container {
  text-align: center;
  padding: 50px;
}
button {
  margin-top: 20px;
  padding: 10px 20px;
  cursor: pointer;
}
</style>