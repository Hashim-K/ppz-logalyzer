import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface User {
	id: string;
	username: string;
	email: string;
	is_active: boolean;
	is_admin: boolean;
	created_at: string;
	updated_at: string;
}

export interface AuthState {
	user: User | null;
	token: string | null;
	isLoading: boolean;
	isAuthenticated: boolean;
	login: (
		username: string,
		password: string,
	) => Promise<{ success: boolean; error?: string }>;
	register: (
		username: string,
		email: string,
		password: string,
	) => Promise<{ success: boolean; error?: string }>;
	logout: () => void;
	refreshToken: () => Promise<boolean>;
	setUser: (user: User | null) => void;
	setToken: (token: string | null) => void;
	setLoading: (loading: boolean) => void;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export const useAuth = create<AuthState>()(
	persist(
		(set, get) => ({
			user: null,
			token: null,
			isLoading: false,
			isAuthenticated: false,

			login: async (username: string, password: string) => {
				set({ isLoading: true });

				try {
					const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
						method: "POST",
						headers: {
							"Content-Type": "application/json",
						},
						body: JSON.stringify({ username, password }),
					});

					console.log("Login response status:", response.status);
					const data = await response.json().catch(() => ({}));
					console.log("Login response:", { status: response.status, data });

					if (response.ok && data.success) {
						const { user, session } = data.data;
						set({
							user,
							token: session.session_token,
							isAuthenticated: true,
							isLoading: false,
						});
						return { success: true };
					} else {
						set({ isLoading: false });
						
						// Handle specific error cases with detailed messages
						let errorMessage = "Login failed";
						if (response.status === 401) {
							errorMessage = "Invalid username or password";
						} else if (response.status === 423) {
							errorMessage =
								"Account is locked due to too many failed attempts";
						} else if (response.status === 403) {
							errorMessage =
								"Account is not active. Please contact administrator";
						} else if (response.status === 422) {
							errorMessage = "Invalid login credentials format";
						} else if (response.status === 429) {
							errorMessage = "Too many login attempts. Please try again later";
						} else if (response.status === 500) {
							errorMessage = "Server error. Please try again later";
						} else if (data.message) {
							errorMessage = data.message;
						}

						return {
							success: false,
							error: errorMessage,
						};
					}
				} catch (error) {
					set({ isLoading: false });
					console.debug("Login network error:", error);
					return {
						success: false,
						error: "Network error. Please check your connection and try again.",
					};
				}
			},

			register: async (username: string, email: string, password: string) => {
				set({ isLoading: true });

				console.log("Register function called with:", {
					username,
					email,
					password,
				});
				const requestBody = { username, email, password };
				console.log("Sending registration request:", requestBody);
				console.log("Request body JSON:", JSON.stringify(requestBody));

				try {
					const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
						method: "POST",
						headers: {
							"Content-Type": "application/json",
						},
						body: JSON.stringify(requestBody),
					});

					console.log("Registration response status:", response.status);
					const data = await response.json().catch(() => ({}));
					console.log("Registration response:", {
						status: response.status,
						data,
					});

					if (response.ok && data.success) {
						const { user, session } = data.data;
						set({
							user,
							token: session.session_token,
							isAuthenticated: true,
							isLoading: false,
						});
						return { success: true };
					} else {
						set({ isLoading: false });
						
						// Handle specific error cases with detailed messages
						let errorMessage = "Registration failed";
						if (response.status === 409) {
							// Check for specific error messages from backend
							if (
								data.message &&
								data.message.toLowerCase().includes("username already exists")
							) {
								errorMessage =
									"Username already taken. Please choose a different username.";
							} else if (
								data.message &&
								data.message.toLowerCase().includes("email already exists")
							) {
								errorMessage =
									"Email address already registered. Please use a different email.";
							} else {
								errorMessage =
									"Username or email already exists. Please use different credentials.";
							}
						} else if (response.status === 422) {
							if (
								data.message &&
								data.message.toLowerCase().includes("password")
							) {
								errorMessage =
									"Password must be at least 8 characters long with uppercase, lowercase, and numbers";
							} else if (
								data.message &&
								data.message.toLowerCase().includes("email")
							) {
								errorMessage = "Please enter a valid email address";
							} else if (
								data.message &&
								data.message.toLowerCase().includes("username")
							) {
								errorMessage =
									"Username must be 3-30 characters long and contain only letters, numbers, and underscores";
							} else {
								errorMessage =
									"Please check your registration details and try again";
							}
						} else if (response.status === 400) {
							errorMessage =
								"Invalid registration data. Please check all fields.";
						} else if (response.status === 429) {
							errorMessage =
								"Too many registration attempts. Please try again later.";
						} else if (response.status === 500) {
							errorMessage = "Server error. Please try again later.";
						} else if (response.status === 503) {
							errorMessage =
								"Service temporarily unavailable. Please try again later.";
						} else if (data.message) {
							errorMessage = data.message;
						}

						return {
							success: false,
							error: errorMessage,
						};
					}
				} catch (error) {
					set({ isLoading: false });
					console.debug("Registration network error:", error);

					// Provide specific network error messages
					let errorMessage =
						"Network error. Please check your connection and try again.";
					if (error instanceof TypeError && error.message.includes("fetch")) {
						errorMessage =
							"Unable to connect to server. Please check your internet connection.";
					} else if (
						error instanceof Error &&
						error.message.includes("timeout")
					) {
						errorMessage = "Request timed out. Please try again.";
					}

					return {
						success: false,
						error: errorMessage,
					};
				}
			},

			logout: () => {
				const { token } = get();

				// Call backend logout endpoint if we have a token
				if (token) {
					fetch(`${API_BASE_URL}/api/auth/logout`, {
						method: "POST",
						headers: {
							Authorization: `Bearer ${token}`,
							"Content-Type": "application/json",
						},
					}).catch(() => {
						// Ignore errors on logout - we'll clear local state regardless
					});
				}

				set({
					user: null,
					token: null,
					isAuthenticated: false,
					isLoading: false,
				});
			},

			refreshToken: async () => {
				const { token } = get();
				if (!token) return false;

				try {
					const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
						method: "POST",
						headers: {
							Authorization: `Bearer ${token}`,
							"Content-Type": "application/json",
						},
					});

					const data = await response.json();

					if (response.ok && data.success) {
						const { access_token } = data.data;
						set({ token: access_token });
						return true;
					} else {
						// Token refresh failed, logout user
						get().logout();
						return false;
					}
				} catch {
					// Network error, keep current state but return false
					return false;
				}
			},

			setUser: (user) => set({ user, isAuthenticated: !!user }),
			setToken: (token) => set({ token }),
			setLoading: (loading) => set({ isLoading: loading }),
		}),
		{
			name: "ppz-auth-storage",
			version: 2, // Increment to clear old cached data
			migrate: (persistedState: unknown, version: number) => {
				// Clear any old state that might have full_name references
				if (version < 2) {
					return {
						user: null,
						token: null,
						isAuthenticated: false,
					};
				}
				return persistedState as {
					user: User | null;
					token: string | null;
					isAuthenticated: boolean;
				};
			},
			partialize: (state) => ({
				user: state.user,
				token: state.token,
				isAuthenticated: state.isAuthenticated,
			}),
		},
	),
);

// Auth utility functions
export const getAuthHeaders = () => {
	const token = useAuth.getState().token;
	return token ? { Authorization: `Bearer ${token}` } : {};
};

export const isTokenExpired = (token: string): boolean => {
	try {
		const payload = JSON.parse(atob(token.split(".")[1]));
		return payload.exp * 1000 < Date.now();
	} catch {
		return true;
	}
};

// Availability check functions
export const checkUsernameAvailability = async (username: string): Promise<{ available: boolean; message: string }> => {
	if (!username || username.length < 3) {
		return { available: false, message: "Username must be at least 3 characters" };
	}

	try {
		const response = await fetch(`${API_BASE_URL}/api/auth/check-username/${encodeURIComponent(username)}`);
		const data = await response.json();
		
		if (response.ok) {
			return {
				available: data.data,
				message: data.message
			};
		} else {
			return { available: false, message: "Error checking username availability" };
		}
	} catch (error) {
		console.debug("Username availability check error:", error);
		return { available: false, message: "Unable to check username availability" };
	}
};

export const checkEmailAvailability = async (email: string): Promise<{ available: boolean; message: string }> => {
	// Basic email validation
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	if (!email || !emailRegex.test(email)) {
		return { available: false, message: "Please enter a valid email address" };
	}

	try {
		const response = await fetch(`${API_BASE_URL}/api/auth/check-email/${encodeURIComponent(email)}`);
		const data = await response.json();
		
		if (response.ok) {
			return {
				available: data.data,
				message: data.message
			};
		} else {
			return { available: false, message: "Error checking email availability" };
		}
	} catch (error) {
		console.debug("Email availability check error:", error);
		return { available: false, message: "Unable to check email availability" };
	}
};
