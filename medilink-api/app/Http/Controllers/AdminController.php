<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\PatientDocument;
use App\Models\LabUpload;
use App\Models\Prescription;
use App\Models\QrToken;
use Illuminate\Http\Request;
use Carbon\Carbon;

class AdminController extends Controller
{
    // ─── Dashboard Stats ─────────────────────────────────────
    public function stats()
    {
        $totalPatients = User::where('role', 'patient')->count();
        $totalDoctors = User::where('role', 'doctor')->count();
        $totalLabs = User::where('role', 'lab')->count();
        $totalUploads = PatientDocument::count() + LabUpload::count();
        $activeQrCodes = QrToken::where('is_active', true)
            ->where('expires_at', '>', Carbon::now())
            ->count();

        return response()->json([
            'stats' => [
                ['icon' => '👤', 'iconClass' => 'blue', 'label' => 'Total Patients', 'value' => $totalPatients],
                ['icon' => '🩺', 'iconClass' => 'green', 'label' => 'Total Doctors', 'value' => $totalDoctors],
                ['icon' => '🧪', 'iconClass' => 'orange', 'label' => 'Total Labs', 'value' => $totalLabs],
                ['icon' => '📁', 'iconClass' => 'purple', 'label' => 'Total Uploads', 'value' => $totalUploads],
                ['icon' => '📱', 'iconClass' => 'red', 'label' => 'Active QR Codes', 'value' => $activeQrCodes],
            ],
        ]);
    }

    // ─── Recent Activity Feed ────────────────────────────────
    public function activity()
    {
        $activities = collect();

        // Recent user registrations
        $recentUsers = User::orderBy('created_at', 'desc')
            ->take(5)
            ->get()
            ->map(fn($u) => [
                'icon' => $u->role === 'doctor' ? '🩺' : ($u->role === 'lab' ? '🧪' : '👤'),
                'iconClass' => $u->role === 'doctor' ? 'doctor' : ($u->role === 'lab' ? 'lab' : 'patient'),
                'event' => 'New ' . ucfirst($u->role) . ' Registration',
                'desc' => $u->name . ' created a new ' . $u->role . ' account.',
                'time' => $u->created_at,
            ]);
        $activities = $activities->merge($recentUsers);

        // Recent lab uploads
        $recentLabUploads = LabUpload::with('lab')
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get()
            ->map(fn($l) => [
                'icon' => '🧪',
                'iconClass' => 'lab',
                'event' => 'New Lab Result Uploaded',
                'desc' => ($l->lab->name ?? 'A lab') . ' uploaded "' . $l->title . '".',
                'time' => $l->created_at,
            ]);
        $activities = $activities->merge($recentLabUploads);

        // Recent prescriptions
        $recentPrescriptions = Prescription::with('doctor')
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get()
            ->map(fn($p) => [
                'icon' => '📋',
                'iconClass' => 'doctor',
                'event' => 'New Prescription Created',
                'desc' => 'Dr. ' . ($p->doctor->name ?? 'Unknown') . ' issued a prescription.',
                'time' => $p->created_at,
            ]);
        $activities = $activities->merge($recentPrescriptions);

        // Sort all by time descending and take 10
        $sorted = $activities->sortByDesc('time')->take(10)->values();

        // Format timestamps to human-readable
        $formatted = $sorted->map(function ($item) {
            $item['time'] = Carbon::parse($item['time'])->diffForHumans();
            return $item;
        });

        return response()->json(['activities' => $formatted]);
    }

    // ─── List Users (paginated, filterable) ──────────────────
    public function users(Request $request)
    {
        $query = User::query();

        if ($request->filled('role')) {
            $query->where('role', $request->role);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $perPage = $request->input('per_page', 10);
        $users = $query->with('patientProfile')
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);

        return response()->json($users);
    }

    // ─── Get Single User ─────────────────────────────────────
    public function getUser($id)
    {
        $user = User::with('patientProfile')->findOrFail($id);
        
        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => ucfirst($user->role),
            'department' => $user->department ?? 'General',
            'status' => $user->status === 'active' ? 'ACTIVE' : 'INACTIVE',
            'registered' => $user->created_at->format('M d, Y'),
            'avatar' => $user->avatar ?? null,
        ]);
    }

    // ─── Update User Status ──────────────────────────────────
    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:active,inactive',
        ]);

        $user = User::findOrFail($id);
        $user->status = $request->status;
        $user->save();

        return response()->json(['message' => 'User status updated successfully.']);
    }

    // ─── Update User Profile ─────────────────────────────────
    public function updateUser(Request $request, $id)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email,' . $id,
            'role' => 'required|in:patient,doctor,lab,admin',
            'department' => 'nullable|string|max:255',
        ]);

        $user = User::findOrFail($id);
        $user->update($request->only(['name', 'email', 'role', 'department']));

        return response()->json([
            'message' => 'User updated successfully.',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => ucfirst($user->role),
                'department' => $user->department ?? 'General',
                'status' => $user->status === 'active' ? 'ACTIVE' : 'INACTIVE',
            ]
        ]);
    }

    // ─── Reset User Password ─────────────────────────────────
    public function resetPassword(Request $request, $id)
    {
        $user = User::findOrFail($id);
        
        // Generate random password
        $newPassword = substr(str_shuffle('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'), 0, 12);
        
        $user->update([
            'password' => \Hash::make($newPassword),
            'password_updated_at' => now(),
        ]);

        // TODO: Send email with new password
        
        return response()->json([
            'message' => 'Password reset successfully.',
            'temp_password' => $newPassword, // Only for testing - remove in production
        ]);
    }

    // ─── Force Logout User ───────────────────────────────────
    public function forceLogout($id)
    {
        $user = User::findOrFail($id);
        
        // Revoke all tokens
        $user->tokens()->delete();
        
        return response()->json([
            'message' => 'User logged out from all devices.',
        ]);
    }

    // ─── Change User Role ────────────────────────────────────
    public function changeRole(Request $request, $id)
    {
        $request->validate([
            'role' => 'required|in:patient,doctor,lab,admin',
        ]);

        $user = User::findOrFail($id);
        $user->update(['role' => $request->role]);

        return response()->json([
            'message' => 'Role updated successfully.',
            'role' => ucfirst($user->role),
        ]);
    }

    // ─── Delete User ─────────────────────────────────────────
    public function deleteUser($id)
    {
        $user = User::findOrFail($id);
        $user->delete(); // cascades via foreign keys

        return response()->json(['message' => 'User deleted successfully.']);
    }

    // ─── Admin Settings ──────────────────────────────────────
    
    // Get admin profile
    public function getProfile(Request $request)
    {
        $user = $request->user();
        return response()->json([
            'name' => $user->name,
            'email' => $user->email,
            'specialization' => $user->specialization ?? 'General Practitioner',
            'license_number' => $user->license_number ?? 'ML-0000-XXX',
        ]);
    }

    // Update admin profile
    public function updateProfile(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'specialization' => 'nullable|string|max:255',
            'license_number' => 'nullable|string|max:255',
        ]);

        $user = $request->user();
        $user->update($request->only(['name', 'email', 'specialization', 'license_number']));

        return response()->json([
            'message' => 'Profile updated successfully.',
            'name' => $user->name,
            'email' => $user->email,
            'specialization' => $user->specialization,
            'license_number' => $user->license_number,
        ]);
    }

    // Get security settings
    public function getSecurity(Request $request)
    {
        $user = $request->user();
        return response()->json([
            'password_last_changed' => $user->password_updated_at ?? $user->created_at,
            'two_factor_enabled' => $user->two_factor_enabled ?? false,
        ]);
    }

    // Update password
    public function updatePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:8',
        ]);

        $user = $request->user();

        // Check current password
        if (!\Hash::check($request->current_password, $user->password)) {
            return response()->json(['message' => 'Current password is incorrect.'], 401);
        }

        $user->update([
            'password' => \Hash::make($request->new_password),
            'password_updated_at' => now(),
        ]);

        return response()->json(['message' => 'Password updated successfully.']);
    }

    // Get preferences
    public function getPreferences(Request $request)
    {
        $user = $request->user();
        return response()->json([
            'email_notifications' => $user->email_notifications ?? true,
            'push_notifications' => $user->push_notifications ?? true,
            'sms_notifications' => $user->sms_notifications ?? false,
        ]);
    }

    // Update preferences
    public function updatePreferences(Request $request)
    {
        $user = $request->user();
        $user->update($request->only([
            'email_notifications',
            'push_notifications',
            'sms_notifications',
            'two_factor_enabled'
        ]));

        return response()->json(['message' => 'Preferences updated successfully.']);
    }

    // Deactivate account
    public function deactivateAccount(Request $request)
    {
        $user = $request->user();
        
        // Revoke all tokens
        $user->tokens()->delete();
        
        // Soft delete or mark as inactive
        $user->update(['is_active' => false]);
        
        return response()->json(['message' => 'Account deactivated successfully.']);
    }
}
