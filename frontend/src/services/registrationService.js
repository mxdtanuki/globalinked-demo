const API_BASE_URL = 'http://localhost:8000' || process.env.REACT_APP_API_BASE_URL; 

export async function registerUser(userData) {
  try {
    console.log('📝 Registering user:', userData);
    
    const response = await fetch(`${API_BASE_URL}/registration/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        user_name: userData.user_name,
        user_email: userData.user_email, 
        user_pass: userData.user_pass,
        user_position: userData.user_position,
        user_profile_img: userData.user_profile_img || null
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Registration failed");
    }

    const result = await response.json();
    console.log(' Registration successful:', result);
    return result;
    
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
}

export async function approveUser(userId) {
  const token = localStorage.getItem("access_token");

  const response = await fetch(`${API_BASE_URL}/registration/${userId}/approve`, {
    method: "PUT",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Failed to approve user");
  }

  return response.json(); // returns the updated user object
}

export async function getPendingUsers() {
  const token = localStorage.getItem("access_token");

  const response = await fetch(`${API_BASE_URL}/registration/pending`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!response.ok) throw new Error("Failed to fetch pending users");
  return response.json();
}

// Get all users (pending, approved, rejected)
export async function getAllUsers() {
  const token = localStorage.getItem("access_token");

  const response = await fetch(`${API_BASE_URL}/registration/`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!response.ok) throw new Error("Failed to fetch all users");
  return response.json();
}

export async function rejectUser(userId) {
  const token = localStorage.getItem("access_token");

  const response = await fetch(`${API_BASE_URL}/registration/${userId}/reject`, {
    method: "PUT", 
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Failed to reject user");
  }

  return response.json();
}

export async function deleteUser(userId) {
  const token = localStorage.getItem("access_token");

  const response = await fetch(`${API_BASE_URL}/registration/${userId}`, {
    method: "DELETE",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Failed to delete user");
  }

  return response.json();
}

// Get current logged-in user
export async function getCurrentUser() {
  const token = localStorage.getItem("access_token");
  console.log("getCurrentUser token:", token); // <-- debug
  if (!token) throw new Error("No access token found");

  const response = await fetch(`${API_BASE_URL}/registration/me`, {
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(errorData.detail || "Failed to load user profile");
  }

  return response.json();
}

// Update user profile (including profile picture)
export async function updateUserProfile(userId, updateData) {
  const token = localStorage.getItem("access_token");
  if (!token) throw new Error("No access token found");

  const response = await fetch(`${API_BASE_URL}/registration/${userId}`, {
    method: "PUT",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updateData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Failed to update profile");
  }

  return response.json();
}
