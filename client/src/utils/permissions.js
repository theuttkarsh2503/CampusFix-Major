import { ROLES } from "./constants"

export const isAdmin = (user) => user?.role === ROLES.ADMIN
export const isStaff = (user) => user?.role === ROLES.STAFF
export const isStudent = (user) => user?.role === ROLES.STUDENT
