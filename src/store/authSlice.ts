import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import { AuthService } from '@/services/authService'

export type User = {
  id: number
  fullName: string
  email: string
  role: string
  emailVerified: boolean
  avatar?: string | null
  address?: string | null
  dateOfBirth?: string | null
  gender?: string | null
}

export type LoginRequest = {
  emailOrPhone: string
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

export const login = createAsyncThunk(
  'auth/login',
  async (credentials: LoginRequest, { rejectWithValue }) => {
    try {
      const resp = await AuthService.login(credentials)
      return resp
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Login failed'
      return rejectWithValue(msg)
    }
  }
)

export const loginWithGoogle = createAsyncThunk(
  'auth/loginWithGoogle',
  async (token: string, { rejectWithValue }) => {
    try {
      const resp = await AuthService.loginWithGoogle({ token })
      return resp
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Google login failed'
      return rejectWithValue(msg)
    }
  }
)

export const getCurrentUser = createAsyncThunk('auth/getCurrentUser', async (_, { rejectWithValue }) => {
  try {
    const resp = await AuthService.getProfile()
    return resp.data
  } catch (err: any) {
    const msg = err?.response?.data?.message || err?.message || 'Failed to get current user'
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
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem('loginToasted')
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(
        login.fulfilled,
        (state, action: PayloadAction<any>) => {
          state.loading = false
          const payload: any = action.payload || {}
          const data = payload.data ?? payload
          const token = data?.token ?? null
          const refreshToken = data?.refreshToken ?? null
          const user = data?.user ?? null

          state.token = token
          state.refreshToken = refreshToken
          state.user = user

          if (typeof localStorage !== 'undefined') {
            if (token) localStorage.setItem('authToken', token)
            if (refreshToken) localStorage.setItem('refreshToken', refreshToken)
          }
        }
      )
      .addCase(login.rejected, (state, action) => {
        state.loading = false
        state.error = (action.payload as string) || 'Login failed'
      })
      .addCase(loginWithGoogle.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(loginWithGoogle.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false
        const payload: any = action.payload || {}
        const data = payload.data ?? payload
        const token = data?.token ?? null
        const refreshToken = data?.refreshToken ?? null
        const user = data?.user ?? null

        state.token = token
        state.refreshToken = refreshToken
        state.user = user

        if (typeof localStorage !== 'undefined') {
          if (token) localStorage.setItem('authToken', token)
          if (refreshToken) localStorage.setItem('refreshToken', refreshToken)
        }
      })
      .addCase(loginWithGoogle.rejected, (state, action) => {
        state.loading = false
        state.error = (action.payload as string) || 'Google login failed'
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
  },
})

export const { clearError, logout } = slice.actions
export default slice.reducer

