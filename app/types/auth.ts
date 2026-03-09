export interface IAdmin {
  username: string
}

export interface IAuthState {
  isAdmin: boolean
  username: string | null
}
