// DATA: fixed values for the auth feature.

export const AUTH_MESSAGES = {
  loginSuccess: "Login successful",
  invalidCredentials: "Invalid username or password",
  registered: "User registered successfully",
  alreadyRegistered: "Username or email is already registered",
  currentUser: "Current user",
  userGone: "User no longer exists",
} as const;

// The only user columns that leave the repository; the password hash never does.
export const PUBLIC_USER_SELECT = {
  id: true,
  username: true,
  email: true,
} as const;
