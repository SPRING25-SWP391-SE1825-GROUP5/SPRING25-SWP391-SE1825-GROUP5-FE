import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import { UserService } from '@/services/userService'

export type User = {
  id: string
  firstName: string
  lastName: string
  role?: string
  email?: string
}

export type LoginRequest = {
  email: string
  password: string
}

type AuthState = {
  user: User | null
  token: string | null
  refreshToken: string | null
  loading: boolean
  error: string | null
}

const initialState: AuthState = {
  user: null,
  token: typeof localStorage !== 'undefined' ? localStorage.getItem('authToken') : null,
  refreshToken: typeof localStorage !== 'undefined' ? localStorage.getItem('refreshToken') : null,
  loading: false,
  error: null,
}

// Async thunks wired to real API service
export const login = createAsyncThunk(
  'auth/login',
  async (credentials: LoginRequest, { rejectWithValue }) => {
    try {
      const data = await (UserService as any).login(credentials)
      return data
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Login failed'
      return rejectWithValue(msg)
    }
  }
)

export const getCurrentUser = createAsyncThunk('auth/getCurrentUser', async (_, { rejectWithValue }) => {
  try {
    const user = await (UserService as any).getCurrentUser()
    return user
  } catch (err: any) {
    const msg = err?.response?.data?.message || err?.message || 'Failed to get current user'
    return rejectWithValue(msg)
  }
})

export const refreshAuthToken = createAsyncThunk('auth/refreshToken', async (refreshToken: string, { rejectWithValue }) => {
  try {
    const data = await (UserService as any).refresh(refreshToken)
    return data
  } catch (err: any) {
    const msg = err?.response?.data?.message || err?.message || 'Refresh token failed'
    return rejectWithValue(msg)
  }
})

const slice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError(state) {
      state.error = null
    },
    logout(state) {
      state.user = null
      state.token = null
      state.refreshToken = null
      state.error = null
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('authToken')
        localStorage.removeItem('refreshToken')
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(login.fulfilled, (state, action: PayloadAction<{ token: string; refreshToken: string; user: User }>) => {
        state.loading = false
        state.token = action.payload.token
        state.refreshToken = action.payload.refreshToken
        state.user = action.payload.user
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('authToken', action.payload.token)
          localStorage.setItem('refreshToken', action.payload.refreshToken)
        }
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false
        state.error = (action.payload as string) || 'Login failed'
      })
      .addCase(getCurrentUser.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getCurrentUser.fulfilled, (state, action: PayloadAction<User | null>) => {
        state.loading = false
        if (action.payload) state.user = action.payload
      })
      .addCase(getCurrentUser.rejected, (state, action) => {
        state.loading = false
        state.error = (action.payload as string) || 'Failed to get user'
      })
      .addCase(refreshAuthToken.fulfilled, (state, action: PayloadAction<{ token: string; refreshToken: string }>) => {
        state.token = action.payload.token
        state.refreshToken = action.payload.refreshToken
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('authToken', action.payload.token)
          localStorage.setItem('refreshToken', action.payload.refreshToken)
        }
      })
  },
})

export const { clearError, logout } = slice.actions
export default slice.reducer

