import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { LocateFixed, Trash2 } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Input, Select } from '../../ui/Input';
import { Badge } from '../../ui/Badge';
import { useUpdateProfile, useChangePassword } from '../../../hooks/mutations';
import { useLocations } from '../../../hooks/queries';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../ui/Toast';
import { extractApiError } from '../../../services/api';

const schema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phoneNumber: z.string().optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your new password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type ProfileFormValues = z.infer<typeof schema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;

export function SettingsSection() {
  const { user, setUser } = useAuth();
  const { notify } = useToast();
  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  // Batch 5. The pickers stay collapsed while a location is already saved, so the
  // form does not have to guess which state a saved city belongs to.
  const [editingLocation, setEditingLocation] = useState(false);
  const [locationStateId, setLocationStateId] = useState<number | null>(null);
  const [locationId, setLocationId] = useState<number | null>(null);
  const [savingLocation, setSavingLocation] = useState(false);
  const [locating, setLocating] = useState(false);
  // Coordinates are only ever set from an explicit click below, never on page load,
  // so the browser permission prompt can never appear uninvited.
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);

  const statesQuery = useLocations({ type: 'State' });
  const citiesQuery = useLocations(
    locationStateId ? { parentId: locationStateId } : undefined,
  );
  const states = statesQuery.data ?? [];
  const cities = citiesQuery.data ?? [];

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ProfileFormValues>({
    resolver: zodResolver(schema),
  });

  const { register: registerPassword, handleSubmit: handlePasswordSubmit, reset: resetPassword, formState: { errors: passwordErrors, isSubmitting: isPasswordSubmitting } } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
  });

  useEffect(() => {
    if (!user) return;
    reset({
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber ?? '',
    });
  }, [user, reset]);

  if (!user) return null;

  // Batch 5. The profile save above deliberately does not send any location field,
  // so renaming an account can never wipe a saved location.
  const saveLocation = async (payload: {
    locationId?: number | null;
    latitude?: number | null;
    longitude?: number | null;
    clearLocation?: boolean;
  }) => {
    setSavingLocation(true);
    try {
      const updated = await updateProfile.mutateAsync({
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        ...payload,
      });
      setUser(updated);
      setEditingLocation(false);
      setCoords(null);
      setLocationStateId(null);
      setLocationId(null);
      notify({ type: 'success', title: 'Location updated', description: 'Your saved location was updated.' });
    } catch (err) {
      notify({ type: 'error', title: 'Could not update location', description: extractApiError(err) });
    } finally {
      setSavingLocation(false);
    }
  };

  const useMyCurrentLocation = () => {
    if (!('geolocation' in navigator)) {
      notify({ type: 'error', title: 'Not supported', description: 'This browser cannot share your location.' });
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setLocating(false);
        notify({ type: 'success', title: 'Location captured', description: 'Save to use it for nearby properties.' });
      },
      () => {
        setLocating(false);
        // A refusal is an ordinary outcome, not an error to shout about: the area
        // picker still works without coordinates.
        notify({ type: 'info', title: 'Location not shared', description: 'You can still choose an area instead.' });
      },
      { timeout: 10000, maximumAge: 300000 },
    );
  };

  const onSubmit = async (data: ProfileFormValues) => {
    try {
      const updated = await updateProfile.mutateAsync({
        firstName: data.firstName,
        lastName: data.lastName,
        phoneNumber: data.phoneNumber?.trim() || undefined,
      });
      setUser(updated);
      notify({ type: 'success', title: 'Profile updated', description: 'Your profile information was saved.' });
    } catch (err) {
      notify({ type: 'error', title: 'Could not update profile', description: extractApiError(err) });
    }
  };

  const onPasswordSubmit = async (data: PasswordFormValues) => {
    try {
      await changePassword.mutateAsync({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      resetPassword();
      setShowPasswordForm(false);
      notify({ type: 'success', title: 'Password changed', description: 'Your password has been updated.' });
    } catch (err) {
      notify({ type: 'error', title: 'Could not change password', description: extractApiError(err) });
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>My Profile</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4 p-4 sm:p-6">
          <Input label="Email" value={user.email} disabled hint="Email address cannot be changed." />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="First name" error={errors.firstName?.message} {...register('firstName')} />
            <Input label="Last name" error={errors.lastName?.message} {...register('lastName')} />
          </div>
          <Input label="Phone number" placeholder="e.g. +234 800 000 0000" error={errors.phoneNumber?.message} {...register('phoneNumber')} />
          <div className="flex justify-end pt-2">
            <Button type="submit" variant="primary" loading={isSubmitting}>Save changes</Button>
          </div>
        </form>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <div className="space-y-4 p-4 text-sm sm:p-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">Signed in as</p>
            <p className="mt-1 font-medium text-ink-900">{user.fullName}</p>
            <p className="text-ink-500">{user.email}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">Roles</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {user.roles.map((r) => (
                <Badge key={r} tone={r === 'Admin' ? 'forest' : r === 'Agent' ? 'gold' : 'neutral'}>{r}</Badge>
              ))}
            </div>
          </div>
          <div className="border-t border-ink-100 pt-4">
            {showPasswordForm ? (
              <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} noValidate className="space-y-3">
                <Input label="Current password" type="password" error={passwordErrors.currentPassword?.message} {...registerPassword('currentPassword')} />
                <Input label="New password" type="password" error={passwordErrors.newPassword?.message} {...registerPassword('newPassword')} />
                <Input label="Confirm new password" type="password" error={passwordErrors.confirmPassword?.message} {...registerPassword('confirmPassword')} />
                <div className="flex justify-end gap-2 pt-1">
                  <Button type="button" variant="ghost" onClick={() => { setShowPasswordForm(false); resetPassword(); }}>Cancel</Button>
                  <Button type="submit" variant="primary" loading={isPasswordSubmitting}>Update password</Button>
                </div>
              </form>
            ) : (
              <Button type="button" variant="outline" onClick={() => setShowPasswordForm(true)}>Change password</Button>
            )}
          </div>
          <p className="rounded-xl bg-ink-50 p-3 text-xs text-ink-500">
            Roles and permissions are managed by administrators. You cannot change your own roles.
          </p>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>My Location</CardTitle>
        </CardHeader>
        <div className="space-y-4 p-4 text-sm sm:p-6">
          <p className="text-ink-500">
            Used only to rank the &ldquo;Properties Near You&rdquo; section on the home page. Nothing is
            tracked, and removing it stops the section immediately.
          </p>

          {user.locationId ? (
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="forest">{user.locationName ?? 'Saved area'}</Badge>
              {user.hasCoordinates ? (
                <Badge tone="neutral">Exact location shared</Badge>
              ) : (
                <Badge tone="neutral">Area only, no distance shown</Badge>
              )}
            </div>
          ) : (
            <p className="text-sm text-ink-500">No location saved yet.</p>
          )}

          {editingLocation ? (
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <Select
                  label="State"
                  value={locationStateId ?? ''}
                  onChange={(e) => {
                    setLocationStateId(e.target.value ? Number(e.target.value) : null);
                    setLocationId(null);
                  }}
                >
                  <option value="">Select state</option>
                  {states.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </Select>
                <Select
                  label="City"
                  value={locationId ?? ''}
                  onChange={(e) => setLocationId(e.target.value ? Number(e.target.value) : null)}
                >
                  <option value="">{locationStateId ? 'Select city' : 'Select a state first'}</option>
                  {cities.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </Select>
              </div>

              <div className="rounded-xl border border-ink-100 bg-ink-50/60 p-3">
                <p className="text-xs text-ink-500">
                  Sharing your exact location lets us show how far away each property is. Without it
                  we can only match by area, and no distance is shown.
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    loading={locating}
                    onClick={useMyCurrentLocation}
                    leftIcon={<LocateFixed className="h-4 w-4" />}
                  >
                    Use my current location
                  </Button>
                  {coords && (
                    <span className="text-xs text-ink-500">
                      Captured {coords.lat.toFixed(3)}, {coords.lon.toFixed(3)}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setEditingLocation(false)}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  loading={savingLocation}
                  disabled={!locationId && !locationStateId && !coords}
                  onClick={() =>
                    saveLocation({
                      locationId: locationId ?? locationStateId,
                      latitude: coords?.lat ?? null,
                      longitude: coords?.lon ?? null,
                    })
                  }
                >
                  Save location
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={() => setEditingLocation(true)}>
                {user.locationId ? 'Change location' : 'Set location'}
              </Button>
              {user.locationId && (
                <Button
                  type="button"
                  variant="ghost"
                  loading={savingLocation}
                  leftIcon={<Trash2 className="h-4 w-4" />}
                  onClick={() => saveLocation({ clearLocation: true })}
                >
                  Remove
                </Button>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
