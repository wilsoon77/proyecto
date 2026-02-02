import { api } from "./client"

export type UserRole = 'CUSTOMER' | 'EMPLOYEE' | 'ADMIN'

export interface UserBranch {
  id: number
  name: string
  slug: string
}

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  phone?: string
  role: UserRole
  isActive: boolean
  branchId?: number | null
  branch?: UserBranch | null
  createdAt: string
  updatedAt: string
  orderCount?: number
}

export interface CreateUserData {
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string
  role: UserRole
  branchId?: number
}

export interface UpdateUserData {
  email?: string
  password?: string
  firstName?: string
  lastName?: string
  phone?: string
  role?: UserRole
  branchId?: number | null
}

export const usersService = {
  list: (): Promise<User[]> => 
    api.get("/users"),
  
  getById: (id: string): Promise<User> => 
    api.get(`/users/${id}`),
  
  create: (data: CreateUserData): Promise<User> => 
    api.post("/users", data),
  
  update: (id: string, data: UpdateUserData): Promise<User> => 
    api.patch(`/users/${id}`, data),
  
  deactivate: (id: string): Promise<{ deactivated: boolean; id: string }> => 
    api.delete(`/users/${id}/deactivate`),
  
  reactivate: (id: string): Promise<User> => 
    api.post(`/users/${id}/reactivate`),
}

export default usersService
