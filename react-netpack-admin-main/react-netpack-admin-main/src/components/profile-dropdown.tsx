import { useEffect, useMemo, useState } from 'react'
import { Country } from '@/type/country'
import { toast } from 'sonner'
import { logout, getToken } from '@/lib/auth'
import { getUserId } from '@/lib/auth'
import http from '@/utils/http'
import { AUTH_ENDPOINTS } from '@/constants/endpoint'
import { USER_ENDPOINTS, COUNTRY_ENDPOINT } from '@/constants/endpoint'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function ProfileDropdown() {
  const [userEmail, setUserEmail] = useState('')
  const [userRole, setUserRole] = useState('')
  const [fullName, setFullName] = useState('')

  const [showChangePassword, setShowChangePassword] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [showProfileSettings, setShowProfileSettings] = useState(false)
  const [isProfileIncomplete, setIsProfileIncomplete] = useState(false)
  const [countries, setCountries] = useState<Country[]>([])
  const [profileData, setProfileData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    postcode: '',
    countryId: '',
    organizationName: '',
    isOrganization: false,
  })
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({})

  // Load user data once
  useEffect(() => {
    setUserEmail(localStorage.getItem('userEmail') || '')
    const role = localStorage.getItem('userRole') || ''
    setUserRole(role)
    setFullName(localStorage.getItem('fullName') || '')

    // Check profile completeness for Customers on mount
    const userId = getUserId()
    if (userId && role === 'Customer') {
      const checkProfile = async () => {
        try {
          // Fetch user profile
          const res = await http.get<{ admin: any }>(
            USER_ENDPOINTS.GET_USER(userId)
          )
          if (res && res.admin) {
            const admin = res.admin
            const incomplete =
              !admin.fullName ||
              !admin.phoneNumber ||
              !admin.address1 ||
              !admin.address2 ||
              !admin.city ||
              !admin.state ||
              !admin.postcode ||
              !admin.countryId ||
              (admin.isOrganization && !admin.organizationName)

            if (incomplete) {
              setIsProfileIncomplete(true)
              setShowProfileSettings(true)
              // Since it's the initial check, we don't necessarily need a toast yet
              // but it helps the user understand why the dialog popped up
              toast.error('Please complete your profile details to proceed.')
            }
          }
        } catch (err) {
          console.error('Failed to check profile completeness:', err)
        }
      }
      checkProfile()
    }
  }, [])

  // Listen for external triggers to open the profile settings dialog
  // (e.g. from the enquiry modal when a CUSTOMER has incomplete profile data)
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail
      const incomplete = detail?.incomplete ?? false
      setIsProfileIncomplete(incomplete)
      setShowProfileSettings(true)
    }
    window.addEventListener('open-profile-settings', handler)
    return () => window.removeEventListener('open-profile-settings', handler)
  }, [])

  // Generate initials
  const initials = useMemo(() => {
    if (!fullName) return ''
    return fullName
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((n) => n[0]?.toUpperCase())
      .join('')
  }, [fullName])

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill all fields')
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error('New password and confirm password do not match')
      return
    }

    setIsSubmitting(true)

    try {
      const token = getToken()
      const res = await fetch(AUTH_ENDPOINTS.CHANGE_PASSWORD_SIMPLE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      })

      if (!res.ok) {
        throw new Error(await res.text())
      }

      toast.success('Password changed successfully')
      setShowChangePassword(false)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      console.error(err)
      toast.error(err?.message || 'Failed to change password')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Fetch profile and countries when dialog opens
  useEffect(() => {
    if (showProfileSettings) {
      const fetchData = async () => {
        try {
          // Fetch countries
          const countriesRes = await http.get<{ data: Country[] }>(
            COUNTRY_ENDPOINT.GET_ALL_COUNTRY
          )
          if (countriesRes) setCountries(countriesRes.data)

          // Fetch user profile
          const userId = getUserId()
          if (userId) {
            const res = await http.get<{ admin: any }>(
              USER_ENDPOINTS.GET_USER(userId)
            )
            if (res && res.admin) {
              const admin = res.admin
              setProfileData({
                fullName: admin.fullName || '',
                email: admin.email || '',
                phoneNumber: admin.phoneNumber || '',
                address1: admin.address1 || '',
                address2: admin.address2 || '',
                city: admin.city || '',
                state: admin.state || '',
                postcode: admin.postcode || '',
                countryId: admin.countryId?.toString() || '',
                organizationName: admin.organizationName || '',
                isOrganization: admin.isOrganization || false,
              })
            }
          }
        } catch (err) {
          console.error(err)
          toast.error('Failed to load profile data')
        }
      }
      fetchData()
    }
  }, [showProfileSettings])

  const handleUpdateProfile = async () => {
    const userId = getUserId()
    if (!userId) {
      toast.error('User session not found')
      return
    }

    // Build per-field errors
    const errors: Record<string, boolean> = {
      phoneNumber: !profileData.phoneNumber,
      address1: !profileData.address1,
      city: !profileData.city,
      state: !profileData.state,
      postcode: !profileData.postcode,
      countryId: !profileData.countryId,
      organizationName:
        profileData.isOrganization && !profileData.organizationName,
    }
    setFieldErrors(errors)

    const hasErrors = Object.values(errors).some(Boolean)
    if (hasErrors) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsSubmitting(true)
    try {
      await http.put(USER_ENDPOINTS.UPDATE_USER(userId), {
        ...profileData,
        countryId: profileData.countryId
          ? parseInt(profileData.countryId)
          : null,
      })

      toast.success('Profile updated successfully')
      setIsProfileIncomplete(false)
      setShowProfileSettings(false)
      setFieldErrors({})
      // Update local storage
      localStorage.setItem('fullName', profileData.fullName)
      localStorage.setItem('userEmail', profileData.email)
      // Reload so the enquiry modal picks up the fresh profile data
      window.location.reload()
    } catch (err: any) {
      console.error(err)
      toast.error(err?.message || 'Failed to update profile')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' className='relative h-8 w-8 rounded-full'>
            <Avatar className='h-8 w-8'>
              <AvatarImage src='/avatars/01.png' alt={fullName} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent className='w-56' align='end' forceMount>
          <DropdownMenuLabel className='font-normal'>
            <p className='text-sm font-medium'>{userRole}</p>
            <p className='text-muted-foreground text-xs'>{userEmail}</p>
          </DropdownMenuLabel>

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={() => setShowChangePassword(true)}>
            Change Password
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => setShowProfileSettings(true)}>
            Profile Settings
          </DropdownMenuItem>

          <DropdownMenuItem onClick={logout}>Log out</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showChangePassword} onOpenChange={setShowChangePassword}>
        <DialogContent className='w-full max-w-md'>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
          </DialogHeader>

          <div className='space-y-4'>
            <Input
              type='password'
              placeholder='Current password'
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
            <Input
              type='password'
              placeholder='New password'
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <Input
              type='password'
              placeholder='Confirm new password'
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />

            <div className='flex justify-end gap-2'>
              <Button
                variant='outline'
                onClick={() => setShowChangePassword(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button onClick={handleChangePassword} disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Change Password'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog
        open={showProfileSettings}
        onOpenChange={(open) => {
          if (!open && isProfileIncomplete) {
            toast.error('Please complete your profile details to proceed.')
            return
          }
          setShowProfileSettings(open)
        }}
      >
        <DialogContent
          className='max-h-[90vh] max-w-2xl overflow-y-auto'
          onInteractOutside={(e) => {
            if (isProfileIncomplete) e.preventDefault()
          }}
          onEscapeKeyDown={(e) => {
            if (isProfileIncomplete) e.preventDefault()
          }}
        >
          <DialogHeader>
            <DialogTitle>
              {isProfileIncomplete
                ? 'Complete Your Profile'
                : 'Profile Settings'}
            </DialogTitle>
          </DialogHeader>

          <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            <div className='space-y-2'>
              <Label htmlFor='fullName'>Full Name</Label>
              <Input
                id='fullName'
                placeholder='Full Name'
                value={profileData.fullName}
                disabled
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='email'>Email</Label>
              <Input
                id='email'
                type='email'
                placeholder='Email'
                value={profileData.email}
                disabled
              />
            </div>
            <div className='space-y-2'>
              <Label
                htmlFor='phoneNumber'
                className={fieldErrors.phoneNumber ? 'text-red-500' : ''}
              >
                Phone Number <span className='text-red-500'>*</span>
              </Label>
              <Input
                id='phoneNumber'
                placeholder='Phone Number'
                value={profileData.phoneNumber}
                onChange={(e) => {
                  setProfileData({
                    ...profileData,
                    phoneNumber: e.target.value,
                  })
                  if (e.target.value)
                    setFieldErrors((prev) => ({ ...prev, phoneNumber: false }))
                }}
                className={
                  fieldErrors.phoneNumber
                    ? 'border-red-500 ring-1 ring-red-500'
                    : ''
                }
              />
              {fieldErrors.phoneNumber && (
                <p className='text-xs text-red-500'>Phone number is required</p>
              )}
            </div>
            <div className='space-y-2'>
              <Label
                htmlFor='countryId'
                className={fieldErrors.countryId ? 'text-red-500' : ''}
              >
                Country <span className='text-red-500'>*</span>
              </Label>
              <Select
                value={profileData.countryId}
                onValueChange={(value) => {
                  setProfileData({ ...profileData, countryId: value })
                  if (value)
                    setFieldErrors((prev) => ({ ...prev, countryId: false }))
                }}
              >
                <SelectTrigger
                  id='countryId'
                  className={
                    fieldErrors.countryId
                      ? 'border-red-500 ring-1 ring-red-500'
                      : ''
                  }
                >
                  <SelectValue placeholder='Select Country' />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((c) => (
                    <SelectItem key={c.id} value={c.id.toString()}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldErrors.countryId && (
                <p className='text-xs text-red-500'>Country is required</p>
              )}
            </div>
            <div className='space-y-2'>
              <Label
                htmlFor='address1'
                className={fieldErrors.address1 ? 'text-red-500' : ''}
              >
                Address Line 1 <span className='text-red-500'>*</span>
              </Label>
              <Input
                id='address1'
                placeholder='Address Line 1'
                value={profileData.address1}
                onChange={(e) => {
                  setProfileData({ ...profileData, address1: e.target.value })
                  if (e.target.value)
                    setFieldErrors((prev) => ({ ...prev, address1: false }))
                }}
                className={
                  fieldErrors.address1
                    ? 'border-red-500 ring-1 ring-red-500'
                    : ''
                }
              />
              {fieldErrors.address1 && (
                <p className='text-xs text-red-500'>
                  Address Line 1 is required
                </p>
              )}
            </div>
            <div className='space-y-2'>
              <Label htmlFor='address2'>Address Line 2</Label>
              <Input
                id='address2'
                placeholder='Address Line 2'
                value={profileData.address2}
                onChange={(e) =>
                  setProfileData({ ...profileData, address2: e.target.value })
                }
              />
            </div>
            <div className='space-y-2'>
              <Label
                htmlFor='city'
                className={fieldErrors.city ? 'text-red-500' : ''}
              >
                City <span className='text-red-500'>*</span>
              </Label>
              <Input
                id='city'
                placeholder='City'
                value={profileData.city}
                onChange={(e) => {
                  setProfileData({ ...profileData, city: e.target.value })
                  if (e.target.value)
                    setFieldErrors((prev) => ({ ...prev, city: false }))
                }}
                className={
                  fieldErrors.city ? 'border-red-500 ring-1 ring-red-500' : ''
                }
              />
              {fieldErrors.city && (
                <p className='text-xs text-red-500'>City is required</p>
              )}
            </div>
            <div className='space-y-2'>
              <Label
                htmlFor='state'
                className={fieldErrors.state ? 'text-red-500' : ''}
              >
                State <span className='text-red-500'>*</span>
              </Label>
              <Input
                id='state'
                placeholder='State'
                value={profileData.state}
                onChange={(e) => {
                  setProfileData({ ...profileData, state: e.target.value })
                  if (e.target.value)
                    setFieldErrors((prev) => ({ ...prev, state: false }))
                }}
                className={
                  fieldErrors.state ? 'border-red-500 ring-1 ring-red-500' : ''
                }
              />
              {fieldErrors.state && (
                <p className='text-xs text-red-500'>State is required</p>
              )}
            </div>
            <div className='space-y-2'>
              <Label
                htmlFor='postcode'
                className={fieldErrors.postcode ? 'text-red-500' : ''}
              >
                Postcode <span className='text-red-500'>*</span>
              </Label>
              <Input
                id='postcode'
                placeholder='Postcode'
                value={profileData.postcode}
                onChange={(e) => {
                  setProfileData({ ...profileData, postcode: e.target.value })
                  if (e.target.value)
                    setFieldErrors((prev) => ({ ...prev, postcode: false }))
                }}
                className={
                  fieldErrors.postcode
                    ? 'border-red-500 ring-1 ring-red-500'
                    : ''
                }
              />
              {fieldErrors.postcode && (
                <p className='text-xs text-red-500'>Postcode is required</p>
              )}
            </div>

            <div className='space-y-4 border-t pt-4 md:col-span-2'>
              <div className='flex items-center space-x-2'>
                <Checkbox
                  id='isOrganization'
                  checked={profileData.isOrganization}
                  disabled
                />
                <Label htmlFor='isOrganization'>Is Organization?</Label>
              </div>

              {profileData.isOrganization && (
                <div className='space-y-2'>
                  <Label htmlFor='organizationName'>Organization Name</Label>
                  <Input
                    id='organizationName'
                    placeholder='Organization Name'
                    value={profileData.organizationName}
                    disabled
                  />
                </div>
              )}
            </div>
          </div>

          <div className='mt-4 flex justify-end gap-2'>
            {!isProfileIncomplete && (
              <Button
                variant='outline'
                onClick={() => setShowProfileSettings(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            )}
            <Button onClick={handleUpdateProfile} disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
